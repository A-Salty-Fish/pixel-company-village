/**
 * The magic overlay painter. Runs in the browser only, after the world is blitted and before name plates.
 * Loops (landmarks, auras) are baked once into frame strips, so a frame costs a few drawImage calls.
 * One-shot spells render live into small pixel frames on the shared 12fps step; the standing air is hand-painted
 * (ambient-layer). PV-MAGIC-STYLE-001: every strip is shrunk to whole world pixels and recoloured into the town ramps.
 * Effects: pixelfx by patch-gg (MIT), vendored under src/vendor/pixelfx.
 */
import { WIZARD_LOOK_ENABLED } from "@/features/wizard-look/wizard-look";
import { PlayLayer } from "@/features/magic-play/play-layer";
import {
  auraCap,
  envelope,
  harmonize,
  loopCap,
  smoothstep,
  STEP_FPS,
  zoomTier,
  type Tier,
  type ZoomTier,
} from "@/features/magic-style/magic-style";
import { AmbientLayer } from "./ambient-layer";
import type { FxCore, FxInstance, FxModule } from "./magic-registry";
import {
  FIRE_GLOW,
  LANDMARKS,
  LANDMARK_LOOPS,
  TRANSITIONS,
  MAGIC_CRITTERS_ENABLED,
  loopAt,
  loopIsCritter,
  loopShows,
  loopTier,
  auraFor,
  pickAuras,
  weatherPlan,
  strainedBudget,
  type Aura,
  type AuraInput,
  type DailyMagic,
  type Loop,
  type MagicBudget,
} from "./magic-town";

type Registry = { FX: Record<string, FxModule>; CORE: FxCore };

let registry: Registry | null = null;
let loading: Promise<Registry | null> | null = null;

/** Start loading the effects bundle. Safe to call every frame. */
export function loadMagic(): Registry | null {
  if (registry) return registry;
  if (!loading && typeof window !== "undefined") {
    loading = import("./magic-registry")
      .then((mod) => {
        registry = { FX: mod.FX, CORE: mod.CORE };
        return registry;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
  }
  return null;
}

export function magicReady() {
  return Boolean(registry);
}

/**
 * A cat-shaped 24x38 actor mask with no pixels: actor effects (frozen, electrified, warp-in) get an outline
 * to hug, but no stock dummy is drawn over the village cat.
 */
let catMask: Uint8Array | null = null;
function blankActor() {
  const w = 24;
  const h = 38;
  if (!catMask) {
    catMask = new Uint8Array(w * h);
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1) {
        const body = ((x - 12) / 9) ** 2 + ((y - 28) / 10) ** 2 <= 1;
        const head = (x - 12) ** 2 + (y - 12) ** 2 <= 64;
        const ear = y >= 2 && y <= 7 && (Math.abs(x - 6) <= (y - 2) / 2 || Math.abs(x - 18) <= (y - 2) / 2);
        if (body || head || ear) catMask[y * w + x] = 1;
      }
  }
  return {
    mask: { w, h, data: catMask },
    pixels: new Uint32Array(w * h),
    x: -12,
    y: -38,
    w,
    h,
    k: 2,
    head: [0, -38],
    chest: [0, -26],
    eyes: [
      [9, 11],
      [15, 11],
    ],
  };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  return canvas;
}

/* ------------------------------------------------------------- baked loops */

type Strip = {
  canvas: HTMLCanvasElement;
  /** Size of one frame in world pixels, after the bake scale. */
  w: number;
  h: number;
  /** Anchor inside a frame, whole world pixels. */
  ax: number;
  ay: number;
  frames: number;
  fps: number;
  /** Paint tick this strip was last drawn on, for the LRU. */
  used: number;
};

type BakeJob = { key: string; id: string; opts: Record<string, unknown>; scale: number; tier: Tier };
const strips = new Map<string, Strip | "pending">();
const bakeQueue: BakeJob[] = [];

const BAKE_FPS = STEP_FPS;
const BAKE_MAX = 40;
let paintTick = 0;
/** Strips kept in memory; phones keep fewer. The least recently drawn go first. */
function stripCap() {
  return typeof window !== "undefined" && window.innerWidth < 600 ? 40 : 80;
}
function evictStrips() {
  const cap = stripCap();
  const ready = [...strips.entries()].filter((entry): entry is [string, Strip] => entry[1] !== "pending");
  if (ready.length <= cap) return;
  ready.sort((a, b) => a[1].used - b[1].used);
  for (const [key, strip] of ready.slice(0, ready.length - cap)) {
    if (strip.used >= paintTick - 1) break;
    strips.delete(key);
  }
}

/** Shrink an RGBA frame to whole pixels with a soft filter, then snap it to the ramps and quarter alphas. */
function shrinkFrame(src: HTMLCanvasElement, tw: number, th: number, tier: Tier): ImageData | null {
  const out = makeCanvas(tw, th);
  const octx = out.getContext("2d", { willReadFrequently: true });
  if (!octx) return null;
  octx.imageSmoothingEnabled = tw !== src.width || th !== src.height;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(src, 0, 0, src.width, src.height, 0, 0, tw, th);
  const image = octx.getImageData(0, 0, tw, th);
  harmonize(image.data, tier);
  return image;
}

function bake(reg: Registry, job: BakeJob): Strip | null {
  const { id, opts, scale, tier } = job;
  const mod = reg.FX[id];
  if (!mod) return null;
  const meta = mod.meta ?? {};
  const w = meta.size?.[0] ?? 64;
  const h = meta.size?.[1] ?? 64;
  const ax = meta.origin?.[0] ?? w / 2;
  const ay = meta.origin?.[1] ?? h / 2;
  const duration = meta.duration ?? 2;
  const frames = Math.max(1, Math.min(BAKE_MAX, Math.round(duration * BAKE_FPS)));
  const fps = frames / duration;
  const options: Record<string, unknown> = { ...opts, x: ax, y: ay };
  if (meta.actor) options.actor = blankActor();
  const fx = reg.CORE.createFx(mod, options);
  // a stateful loop (a fire sim) settles for one cycle before we keep frames
  if ("create" in mod) {
    for (let s = 0; s < duration; s += 1 / 30) fx.update(1 / 30);
  }
  const frame = reg.CORE.createFrame(w, h, 0, 0);
  // render every frame once, then keep only the box that ever lights up, so big canvases cost little memory
  const images: Uint8ClampedArray[] = [];
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < frames; i += 1) {
    reg.CORE.clearFrame(frame);
    fx.draw(frame);
    const data = new Uint8ClampedArray(w * h * 4);
    reg.CORE.composite(frame, data, null, Number(opts.light ?? 1));
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1)
        if (data[(y * w + x) * 4 + 3] > 0) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    images.push(data);
    fx.update(1 / fps);
  }
  if (x1 < 0) {
    x0 = 0;
    y0 = 0;
    x1 = 0;
    y1 = 0;
  }
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const tw = Math.max(1, Math.round(cw * scale));
  const th = Math.max(1, Math.round(ch * scale));
  const canvas = makeCanvas(tw * frames, th);
  const ctx = canvas.getContext("2d");
  const crop = makeCanvas(cw, ch);
  const cctx = crop.getContext("2d");
  if (!ctx || !cctx) return null;
  const image = cctx.createImageData(cw, ch);
  for (let i = 0; i < images.length; i += 1) {
    const data = images[i];
    for (let y = 0; y < ch; y += 1)
      image.data.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4), y * cw * 4);
    cctx.putImageData(image, 0, 0);
    const small = shrinkFrame(crop, tw, th, tier);
    if (small) ctx.putImageData(small, i * tw, 0);
  }
  return { canvas, w: tw, h: th, ax: Math.round((ax - x0) * scale), ay: Math.round((ay - y0) * scale), frames, fps, used: paintTick };
}

function stripFor(reg: Registry, id: string, opts: Record<string, unknown> = {}, scale = 1, tier: Tier = "ambient"): Strip | null {
  const s = Math.round(scale * 100) / 100;
  const key = `${id}|${JSON.stringify(opts)}|${s}|${tier}`;
  const got = strips.get(key);
  if (got && got !== "pending") {
    got.used = paintTick;
    return got;
  }
  if (!got) {
    strips.set(key, "pending");
    bakeQueue.push({ key, id, opts, scale: s, tier });
  }
  return null;
}

/** Bake at most a couple of strips per frame so the map never hitches on first open. */
function drainBakes(reg: Registry, budgetMs: number) {
  const start = performance.now();
  while (bakeQueue.length && performance.now() - start < budgetMs) {
    const job = bakeQueue.shift();
    if (!job) break;
    const strip = bake(reg, job);
    if (strip) strips.set(job.key, strip);
    else strips.delete(job.key);
  }
  evictStrips();
}

/* ------------------------------------------------------------- view */

export type MagicView = {
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
  viewW: number;
  viewH: number;
  dpr: number;
  /** Camera zoom step (1 map, 2 near, 3 close); effects size and thin out by it. */
  zoom?: number;
};

/** Device pixels per world pixel. One number for both axes (PV-PIXEL-SNAP-001). */
function scaleOf(view: MagicView) {
  return view.viewW / view.spanW;
}

function toScreen(view: MagicView, wx: number, wy: number) {
  const k = scaleOf(view);
  return { x: (wx - view.camX) * k, y: (wy - view.camY) * k, k };
}

/** Draw one frame of a strip with its anchor on a whole world pixel; the strip is already at its final world size. */
function drawStrip(ctx: CanvasRenderingContext2D, view: MagicView, strip: Strip, wx: number, wy: number, time: number, alpha = 1) {
  const k = scaleOf(view);
  const left = Math.round(wx) - strip.ax - view.camX;
  const top = Math.round(wy) - strip.ay - view.camY;
  const x = Math.round(left * k);
  const y = Math.round(top * k);
  const w = Math.round((left + strip.w) * k) - x;
  const h = Math.round((top + strip.h) * k) - y;
  if (x > view.viewW || y > view.viewH || x + w < 0 || y + h < 0 || w <= 0 || h <= 0) return false;
  if (alpha <= 0.02) return false;
  const index = ((Math.floor(time * strip.fps) % strip.frames) + strip.frames) % strip.frames;
  ctx.globalAlpha = Math.min(1, alpha);
  // a full-map view shrinks the strip; there a soft filter beats dropped pixels
  ctx.imageSmoothingEnabled = k < 1;
  ctx.drawImage(strip.canvas, index * strip.w, 0, strip.w, strip.h, x, y, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  return true;
}

/* ------------------------------------------------------------- landmarks */

/** Rough world-pixel reach of a loop, for culling before a strip is ever baked. */
const LOOP_REACH = 90;
/** A tap wakes the quiet loops (road glints, frogs, bats) within this many world pixels, for a few seconds. */
const WAKE_RADIUS = 140;
const WAKE_LIFE = 8;

function onScreen(view: MagicView, wx: number, wy: number, reach: number) {
  return wx > view.camX - reach && wy > view.camY - reach && wx < view.camX + view.spanW + reach && wy < view.camY + view.spanH + reach;
}

const TIER_RANK = { hero: 0, near: 1, close: 2, rest: 3 } as const;
/** Loops in paint priority: the hero pieces first, so a cap trims the small stuff. */
const LOOP_ORDER: { loop: Loop; index: number }[] = LANDMARK_LOOPS.map((loop, index) => ({ loop, index })).sort(
  (a, b) => TIER_RANK[loopTier(a.loop)] - TIER_RANK[loopTier(b.loop)] || a.index - b.index,
);

function zoomRank(tier: ZoomTier) {
  return tier === "map" ? 0 : tier === "near" ? 1 : 2;
}

/* ------------------------------------------------------------- spells */

type Spell = {
  id: string;
  fx: FxInstance;
  x: number;
  y: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  scale: number;
  canvas: HTMLCanvasElement;
  frame: ReturnType<FxCore["createFrame"]>;
  native: HTMLCanvasElement;
  image: ImageData;
  /** Step index last drawn; spells redraw on the shared 12fps step. */
  step: number;
  stopAfter: number;
  /** Seconds of effect time at which the spell is fully faded. */
  end: number;
};

/** Spells redraw at this rate; motion between steps is the effect's own. */
const SPELL_FPS = STEP_FPS;
/** No spell grows past this many world pixels across. */
const SPELL_MAX = 96;
const SPELL_SCALE: Record<string, number> = {
  "arcane/magic-circle-cast": 0.55,
  "explosions/firework-rocket": 0.7,
  "water/geyser": 0.55,
  "water/splash": 0.5,
  "spawn/coin-drop": 0.7,
  "arcane/star-fall": 0.8,
};
/** Loop effects played as spells are let go after a beat, so they end on their own fade. */
const SPELL_STOP: Record<string, number> = {
  "holy/blessing": 2.4,
  "holy/heal": 2.2,
  "nature/leaf-storm": 2.4,
  "water/water-orb": 2.2,
  "pickups/power-star": 2,
  "scifi/force-field": 2.4,
  "arcane/spell-charge": 2,
  "lightning/ball-lightning": 2.2,
  "holy/divine-shield": 2.4,
  "lightning/electrified": 2,
  "scifi/glitch": 1.6,
  "fire/fire-ring": 2.2,
};
/** Spells on big canvases are shrunk so a tap never floods a phone screen. */
function spellScale(id: string, w: number, h: number) {
  const size = Math.max(w, h);
  const base = SPELL_SCALE[id] ?? (id === "ice/frost-nova" ? 0.55 : size > 200 ? 0.6 : size > 140 ? 0.75 : 1);
  return Math.min(base, SPELL_MAX / size);
}

type Status = { id: string; name: string; born: number; until: number; offset: number };
type Transition = {
  fx: FxInstance;
  canvas: HTMLCanvasElement;
  frame: ReturnType<FxCore["createFrame"]>;
  image: ImageData;
  w: number;
  h: number;
  born: number;
};
const TRANSITION_LIFE = 1.6;
const STATUS_CAP = 3;

/* ------------------------------------------------------------- the layer */

export type MagicPerson = AuraInput & { name: string; x: number; y: number; id: number };

export type MagicInput = {
  budget: MagicBudget;
  night: boolean;
  hour: number;
  seasonId: string;
  daily: DailyMagic | null;
  people: MagicPerson[];
  /** Seconds since start; frozen at 0 when motion is reduced. */
  now: number;
};

export type MagicStats = {
  ready: boolean;
  weather: string[];
  auras: number;
  spells: number;
  landmarks: number;
  baked: number;
  ms: number;
  /** True while the strain governor holds magic at the lighter budget. */
  lite?: boolean;
  /** PV-MAGIC-PLAY-001 hand-drawn play marks on screen right now. */
  play?: PlayLayer["counts"];
  /** PV-MAGIC-STYLE-001 ambient particles painted last frame, and the zoom tier. */
  ambient?: number;
  tier?: ZoomTier;
};

export class MagicLayer {
  private spells: Spell[] = [];
  private queued: { id: string; x: number; y: number; seed: number }[] = [];
  private last = -1;
  private seed = 1;
  /** Smoothed seconds between paints. A slow phone drops to a lighter magic budget on its own. */
  private gap = 1 / 60;
  private strained = false;
  private statuses: Status[] = [];
  private transitionNow: Transition | null = null;
  private transitionQueue: string[] = [];
  private transitionTurn = 0;
  private taps: number[] = [];
  private wakes: { x: number; y: number; born: number }[] = [];
  private ambient = new AmbientLayer();
  /** Beams, staff trails, the charge ring, summons and game pips (PV-MAGIC-PLAY-001). */
  readonly play = new PlayLayer();
  stats: MagicStats = { ready: false, weather: [], auras: 0, spells: 0, landmarks: 0, baked: 0, ms: 0 };

  /** Queue a spell at world pixels. Plays once the effects bundle has loaded. */
  cast(id: string, x: number, y: number) {
    this.seed = (this.seed * 1103515245 + 12345) >>> 0;
    this.queued.push({ id, x, y, seed: this.seed % 9973 });
    if (this.queued.length > 6) this.queued.shift();
  }

  /** Hang a short-lived status (dizzy stars, a little chill) on a person; it follows them until it ends. */
  castOn(id: string, name: string, seconds: number) {
    this.statuses = this.statuses.filter((status) => status.name !== name);
    this.statuses.push({ id, name, born: this.last, until: this.last + seconds, offset: (this.statuses.length * 0.41) % 1 });
    while (this.statuses.length > STATUS_CAP) this.statuses.shift();
  }

  /** Wake the quiet loops near a tap (road glints, frogs, bats) for a few seconds. */
  wake(x: number, y: number) {
    this.wakes = this.wakes.filter((wake) => Math.hypot(wake.x - x, wake.y - y) > 40);
    this.wakes.push({ x, y, born: this.last });
    if (this.wakes.length > 3) this.wakes.shift();
  }

  /** Play a screen-wide transition sweep. Only on request (a sign-in, the test hook); never on its own. */
  transition(id?: string) {
    const next = id ?? TRANSITIONS[this.transitionTurn++ % TRANSITIONS.length];
    if (this.transitionQueue.length || this.transitionNow) return;
    this.transitionQueue.push(next);
  }

  /** Count quick taps; the fifth inside the window returns true once so the scene can pop a combo counter. */
  noteTap(windowMs: number, taps: number, at: number) {
    this.taps = this.taps.filter((stamp) => at - stamp < windowMs);
    this.taps.push(at);
    if (this.taps.length < taps) return false;
    this.taps = [];
    return true;
  }

  clear() {
    this.spells = [];
    this.queued = [];
    this.statuses = [];
    this.transitionNow = null;
    this.transitionQueue = [];
    this.wakes = [];
    this.play.clear();
  }

  get liveSpells() {
    return this.spells.length + this.queued.length + (this.transitionNow || this.transitionQueue.length ? 1 : 0);
  }

  render(ctx: CanvasRenderingContext2D, view: MagicView, input: MagicInput) {
    const t0 = performance.now();
    let budget = input.budget;
    if (!budget.on) {
      this.clear();
      this.stats = { ...this.stats, weather: [], auras: 0, spells: 0, landmarks: 0, ms: 0 };
      return;
    }
    const reg = loadMagic();
    if (!reg) return;
    const rawGap = this.last < 0 ? 0 : Math.max(0, input.now - this.last);
    const dt = Math.min(0.05, rawGap);
    this.last = input.now;
    this.play.tick(input.now);
    const time = budget.animate ? input.now : 0;
    // PV-MAGIC-002 strain governor: under ~24fps for a while, magic steps down; back over ~40fps, it steps up
    if (budget.animate && rawGap > 0 && rawGap < 0.5) this.gap = this.gap * 0.95 + rawGap * 0.05;
    if (!this.strained && this.gap > 1 / 24) this.strained = true;
    else if (this.strained && this.gap < 1 / 40) this.strained = false;
    if (this.strained) budget = strainedBudget(budget);
    const tier = zoomTier(view.zoom ?? 2);
    const rank = zoomRank(tier);
    const narrow = view.viewW / Math.max(1, view.dpr) < 600;

    paintTick += 1;
    drainBakes(reg, budget.animate ? (this.strained ? 2 : 6) : 40);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // the standing air goes first so every landmark and person sits on top of it
    const plan = budget.weather > 0 && budget.animate ? weatherPlan(input).slice(0, budget.weather) : [];
    const fires: { x: number; y: number; r: number }[] = [];

    // landmarks and critters: hero pieces first, then near ones once zoomed in, small pickups only up close
    let landmarks = 0;
    this.wakes = this.wakes.filter((wake) => input.now - wake.born < WAKE_LIFE);
    const loopBudget = Math.min(budget.landmarkCap, loopCap(tier, narrow));
    const glow = Math.min(1, budget.glow + 0.25);
    if (budget.landmarks) {
      for (const { loop, index } of LOOP_ORDER) {
        if (landmarks >= loopBudget) break;
        if (loopIsCritter(loop) && !MAGIC_CRITTERS_ENABLED) continue;
        let alpha = (loop.alpha ?? 1) * glow;
        if (loopTier(loop) === "rest") {
          if (loop.night && !input.night) continue;
          if (loop.day && input.night) continue;
          let woke = 0;
          for (const wake of this.wakes)
            if (Math.hypot(wake.x - loop.x, wake.y - loop.y) < WAKE_RADIUS) woke = Math.max(woke, envelope(input.now - wake.born, WAKE_LIFE, 0.6, 2));
          if (woke <= 0) continue;
          alpha *= woke;
        } else if (!loopShows(loop, rank, input.night)) continue;
        const at = loopAt(loop, time, index);
        if (!onScreen(view, at.x, at.y, LOOP_REACH * (loop.scale ?? 1))) continue;
        if (input.night && FIRE_GLOW[loop.id]) fires.push({ x: Math.round(at.x), y: Math.round(at.y), r: Math.round(FIRE_GLOW[loop.id] * (loop.scale ?? 1)) });
        const strip = stripFor(reg, loop.id, { seed: 1, ...(loop.opts ?? {}) }, loop.scale ?? 1, "ambient");
        if (strip && drawStrip(ctx, view, strip, at.x, at.y, time + index * 0.37, alpha)) landmarks += 1;
      }
    }
    // lantern pools, fireflies, falling petals, the aurora: painted under the people but over the ground loops
    if (plan.length) this.ambient.paint(ctx, view, { plan, night: input.night, now: input.now, tier, narrow, fires });
    else this.ambient.count = 0;

    // auras: strongest first, only those on screen, capped hard; the sleepy sparkle is gone (it read as dust)
    let auras = 0;
    const auraBudget = Math.min(budget.auras, auraCap(tier, narrow));
    if (auraBudget > 0) {
      const visible = input.people.filter((person) => {
        const at = toScreen(view, person.x, person.y);
        return at.x > -40 && at.y > -60 && at.x < view.viewW + 40 && at.y < view.viewH + 40;
      });
      const chosen = pickAuras(
        visible.map((person) => {
          const aura = auraFor(person);
          return { person, aura: aura && aura.kind !== "sleepy" ? aura : null };
        }),
        auraBudget,
      );
      for (const { person, aura } of chosen) {
        if (!aura) continue;
        const strip = stripFor(reg, ...auraStrip(aura), auraScale(aura), "ambient");
        if (!strip) continue;
        const offset = (person.id % 7) * 0.53;
        if (drawStrip(ctx, view, strip, person.x, person.y - 2 - auraLift(aura.kind), time + offset, aura.kind === "dozing" ? 0.8 : 0.9)) auras += 1;
      }
    }

    // short statuses that follow a person after a spell, easing in and out
    this.statuses = this.statuses.filter((status) => status.until > input.now);
    if (budget.spells > 0 && budget.animate) {
      for (const status of this.statuses) {
        const person = input.people.find((candidate) => candidate.name === status.name);
        if (!person || !onScreen(view, person.x, person.y, 40)) continue;
        const strip = stripFor(reg, status.id, { seed: 2 }, 0.6, "play");
        const fade = envelope(input.now - status.born, status.until - status.born, 0.25, 0.5);
        if (strip) drawStrip(ctx, view, strip, person.x, person.y - 2 - (WIZARD_LOOK_ENABLED ? HAT_LIFT : 0), time + status.offset, fade);
      }
    }

    // one-shot spells: redrawn on the 12fps step, shrunk to whole pixels, faded in and out
    if (budget.spells > 0 && budget.animate) {
      while (this.queued.length) {
        const next = this.queued.shift();
        if (!next) break;
        const spell = this.start(reg, next.id, next.x, next.y, next.seed);
        if (!spell) continue;
        // a new spell close to an old one hurries the old one out, so taps never pile into a blob
        for (const old of this.spells)
          if (Math.hypot(old.x - spell.x, old.y - spell.y) < 36) old.end = Math.min(old.end, old.fx.t + 0.3);
        this.spells.push(spell);
        while (this.spells.length > budget.spells) this.spells.shift();
      }
      for (const spell of this.spells) {
        spell.fx.update(dt);
        if (spell.fx.t >= spell.stopAfter) spell.fx.stop();
        const step = Math.floor(spell.fx.t * SPELL_FPS);
        if (step !== spell.step) {
          spell.step = step;
          reg.CORE.clearFrame(spell.frame);
          spell.fx.draw(spell.frame);
          reg.CORE.composite(spell.frame, spell.image.data, null, budget.glow);
          spell.native.getContext("2d")?.putImageData(spell.image, 0, 0);
          const small = shrinkFrame(spell.native, spell.canvas.width, spell.canvas.height, "play");
          if (small) spell.canvas.getContext("2d")?.putImageData(small, 0, 0);
        }
        const fade = envelope(spell.fx.t, spell.end, 0.15, 0.3);
        drawStrip(
          ctx,
          view,
          { canvas: spell.canvas, w: spell.canvas.width, h: spell.canvas.height, ax: spell.ax, ay: spell.ay, frames: 1, fps: 1, used: paintTick },
          spell.x,
          spell.y,
          0,
          fade,
        );
      }
      this.spells = this.spells.filter((spell) => !spell.fx.done() && spell.fx.t < spell.end);
      this.play.paint(ctx, view, this.strained, (id, x, y, scale, alpha, at) => {
        if (!onScreen(view, x, y, LOOP_REACH * scale)) return false;
        const strip = stripFor(reg, id, { seed: 3 }, scale, "play");
        return strip ? drawStrip(ctx, view, strip, x, y, at, alpha) : false;
      });
    } else {
      this.clear();
    }

    // transitions: only when asked for, soft and short
    if (budget.transitions && budget.animate) this.paintTransition(ctx, reg, view, dt, input.now, budget);
    else {
      this.transitionNow = null;
      this.transitionQueue = [];
    }

    ctx.restore();
    this.stats = {
      ready: true,
      lite: this.strained,
      weather: plan,
      auras,
      spells: this.liveSpells,
      landmarks,
      baked: [...strips.values()].filter((value) => value !== "pending").length,
      ms: Math.round((performance.now() - t0) * 100) / 100,
      play: this.play.counts,
      ambient: this.ambient.count,
      tier,
    };
  }

  private start(reg: Registry, id: string, x: number, y: number, seed: number): Spell | null {
    const mod = reg.FX[id];
    if (!mod) return null;
    const meta = mod.meta ?? {};
    const w = meta.size?.[0] ?? 64;
    const h = meta.size?.[1] ?? 64;
    const ax = meta.origin?.[0] ?? w / 2;
    const ay = meta.origin?.[1] ?? h / 2;
    const options: Record<string, unknown> = { x: ax, y: ay, seed };
    if (meta.actor) options.actor = blankActor();
    const fx = reg.CORE.createFx(mod, options);
    const native = makeCanvas(w, h);
    const nctx = native.getContext("2d");
    if (!nctx) return null;
    const scale = spellScale(id, w, h);
    const canvas = makeCanvas(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
    const stopAfter = SPELL_STOP[id] ?? (meta.loop ? 2.5 : Infinity);
    const end = Number.isFinite(stopAfter) ? stopAfter + 0.5 : Math.max(0.6, meta.duration ?? 1.6);
    return {
      id,
      fx,
      x: Math.round(x),
      y: Math.round(y),
      w,
      h,
      ax: Math.round(ax * scale),
      ay: Math.round(ay * scale),
      scale,
      canvas,
      native,
      frame: reg.CORE.createFrame(w, h, 0, 0),
      image: nctx.createImageData(w, h),
      step: -1,
      stopAfter,
      end,
    };
  }

  private paintTransition(ctx: CanvasRenderingContext2D, reg: Registry, view: MagicView, dt: number, now: number, budget: MagicBudget) {
    if (!this.transitionNow && this.transitionQueue.length) {
      const id = this.transitionQueue.shift() as string;
      const mod = reg.FX[id];
      if (mod) {
        const w = mod.meta?.size?.[0] ?? 320;
        const h = mod.meta?.size?.[1] ?? 180;
        const canvas = makeCanvas(w, h);
        const cctx = canvas.getContext("2d");
        if (cctx) {
          const fx = reg.CORE.createFx(mod, { x: mod.meta?.origin?.[0] ?? w / 2, y: mod.meta?.origin?.[1] ?? h / 2, seed: 5 });
          this.transitionNow = { fx, canvas, frame: reg.CORE.createFrame(w, h, 0, 0), image: cctx.createImageData(w, h), w, h, born: now };
        }
      }
    }
    const run = this.transitionNow;
    if (!run) return;
    const age = now - run.born;
    run.fx.update(dt);
    if (run.fx.done() || age > TRANSITION_LIFE) {
      this.transitionNow = null;
      return;
    }
    if (Math.floor(age * SPELL_FPS) !== Math.floor((age - dt) * SPELL_FPS) || age === 0) {
      reg.CORE.clearFrame(run.frame);
      run.fx.draw(run.frame);
      reg.CORE.composite(run.frame, run.image.data, null, budget.glow);
      harmonize(run.image.data, "play");
      run.canvas.getContext("2d")?.putImageData(run.image, 0, 0);
    }
    // light only and soft: a gentle wash that rises and settles, never a flash
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.28 * Math.sin(Math.PI * smoothstep(age / TRANSITION_LIFE));
    ctx.drawImage(run.canvas, 0, 0, view.viewW, view.viewH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}

function auraStrip(aura: Aura): [string, Record<string, unknown>] {
  if (aura.kind === "arcane") return ["village/arcane-motes", { tier: aura.tier, seed: 3 }];
  if (aura.kind === "fish") return ["village/fish-bubbles", { tier: aura.tier, seed: 7 }];
  if (aura.kind === "holy") return ["holy/halo", { seed: 1, light: 0.8 + aura.tier * 0.15 }];
  if (aura.kind === "charged") return ["arcane/spell-charge", { seed: 4 }];
  if (aura.kind === "dozing") return ["status/sleep", { seed: 6 }];
  if (aura.kind === "popular") return ["status/charmed", { seed: 8 }];
  return ["village/sleepy-sparkle", { seed: 2 }];
}

/** Wizard hats are taller than cat ears: head-top auras ride above the hat tip. */
const HAT_LIFT = 12;
function auraLift(kind: Aura["kind"]) {
  if (!WIZARD_LOOK_ENABLED) return 0;
  return kind === "holy" || kind === "dozing" || kind === "popular" ? HAT_LIFT : 0;
}

function auraScale(aura: Aura) {
  if (aura.kind === "holy") return 0.8;
  if (aura.kind === "charged") return 0.5;
  if (aura.kind === "dozing" || aura.kind === "popular") return 0.6;
  return 1;
}

export { LANDMARKS };
