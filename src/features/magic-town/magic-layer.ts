/**
 * The magic overlay painter. Runs in the browser only, after the world is blitted and before name plates.
 * Loops (landmarks, auras) are baked once into frame strips, so a frame costs a few drawImage calls.
 * Weather and one-shot spells render live into small pixel frames at a capped rate.
 * Effects: pixelfx by patch-gg (MIT), vendored under src/vendor/pixelfx.
 */
import { WIZARD_LOOK_ENABLED } from "@/features/wizard-look/wizard-look";
import { PlayLayer } from "@/features/magic-play/play-layer";
import type { FxCore, FxInstance, FxModule } from "./magic-registry";
import {
  weatherIsSky,
  LANDMARKS,
  LANDMARK_LOOPS,
  TRANSITIONS,
  MAGIC_CRITTERS_ENABLED,
  loopAt,
  loopIsCritter,
  auraFor,
  pickAuras,
  weatherBand,
  weatherPlan,
  strainedBudget,
  type Aura,
  type AuraInput,
  type DailyMagic,
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
  w: number;
  h: number;
  ax: number;
  ay: number;
  frames: number;
  fps: number;
  /** Paint tick this strip was last drawn on, for the LRU. */
  used: number;
};

const strips = new Map<string, Strip | "pending">();
const bakeQueue: { key: string; id: string; opts: Record<string, unknown> }[] = [];

const BAKE_FPS = 12;
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

function bake(reg: Registry, id: string, opts: Record<string, unknown>): Strip | null {
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
  const canvas = makeCanvas(cw * frames, ch);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(cw, ch);
  images.forEach((data, i) => {
    for (let y = 0; y < ch; y += 1)
      image.data.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4), y * cw * 4);
    ctx.putImageData(image, i * cw, 0);
  });
  return { canvas, w: cw, h: ch, ax: ax - x0, ay: ay - y0, frames, fps, used: paintTick };
}

function stripFor(reg: Registry, id: string, opts: Record<string, unknown> = {}): Strip | null {
  const key = `${id}|${JSON.stringify(opts)}`;
  const got = strips.get(key);
  if (got && got !== "pending") {
    got.used = paintTick;
    return got;
  }
  if (!got) {
    strips.set(key, "pending");
    bakeQueue.push({ key, id, opts });
  }
  return null;
}

/** Bake at most a couple of strips per frame so the map never hitches on first open. */
function drainBakes(reg: Registry, budgetMs: number) {
  const start = performance.now();
  while (bakeQueue.length && performance.now() - start < budgetMs) {
    const job = bakeQueue.shift();
    if (!job) break;
    const strip = bake(reg, job.id, job.opts);
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
};

function toScreen(view: MagicView, wx: number, wy: number) {
  const sx = view.viewW / view.spanW;
  const sy = view.viewH / view.spanH;
  return { x: (wx - view.camX) * sx, y: (wy - view.camY) * sy, sx, sy };
}

function drawStrip(
  ctx: CanvasRenderingContext2D,
  view: MagicView,
  strip: Strip,
  wx: number,
  wy: number,
  time: number,
  scale = 1,
  alpha = 1,
) {
  const at = toScreen(view, wx, wy);
  const w = strip.w * at.sx * scale;
  const h = strip.h * at.sy * scale;
  const x = at.x - strip.ax * at.sx * scale;
  const y = at.y - strip.ay * at.sy * scale;
  if (x > view.viewW || y > view.viewH || x + w < 0 || y + h < 0) return false;
  const index = ((Math.floor(time * strip.fps) % strip.frames) + strip.frames) % strip.frames;
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(strip.canvas, index * strip.w, 0, strip.w, strip.h, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  if (alpha < 1) ctx.globalAlpha = 1;
  return true;
}

/* ------------------------------------------------------------- landmarks */

/** Rough world-pixel reach of a loop, for culling before a strip is ever baked. */
const LOOP_REACH = 90;

function onScreen(view: MagicView, wx: number, wy: number, reach: number) {
  return wx > view.camX - reach && wy > view.camY - reach && wx < view.camX + view.spanW + reach && wy < view.camY + view.spanH + reach;
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
  image: ImageData;
  dirtyAt: number;
  stopAfter: number;
};

const SPELL_FPS = 30;
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
  if (SPELL_SCALE[id] !== undefined) return SPELL_SCALE[id];
  const size = Math.max(w, h);
  if (id === "ice/frost-nova") return 0.55;
  return size > 200 ? 0.6 : size > 140 ? 0.75 : 1;
}

type Status = { id: string; name: string; until: number; offset: number };
type Transition = { fx: FxInstance; canvas: HTMLCanvasElement; frame: ReturnType<FxCore["createFrame"]>; image: ImageData; w: number; h: number };

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
};

export class MagicLayer {
  private spells: Spell[] = [];
  private queued: { id: string; x: number; y: number; seed: number }[] = [];
  private weatherFx = new Map<string, FxInstance>();
  private weatherCanvas: HTMLCanvasElement | null = null;
  private weatherFrame: ReturnType<FxCore["createFrame"]> | null = null;
  private weatherImage: ImageData | null = null;
  private weatherKey = "";
  private weatherAt = -1;
  private last = -1;
  private seed = 1;
  /** Smoothed seconds between paints. A slow phone drops to a lighter magic budget on its own. */
  private gap = 1 / 60;
  private strained = false;
  private statuses: Status[] = [];
  private transitionNow: Transition | null = null;
  private transitionQueue: string[] = [];
  private transitionTurn = 0;
  private lastNight: boolean | null = null;
  private zoomAnchor = 0;
  private transitionAt = -99;
  private taps: number[] = [];
  /** Beams, staff trails, the charge ring, summons and game pips (PV-MAGIC-PLAY-001). */
  readonly play = new PlayLayer();
  stats: MagicStats = { ready: false, weather: [], auras: 0, spells: 0, landmarks: 0, baked: 0, ms: 0 };

  /** Queue a spell at world pixels. Plays once the effects bundle has loaded. */
  cast(id: string, x: number, y: number) {
    this.seed = (this.seed * 1103515245 + 12345) >>> 0;
    this.queued.push({ id, x, y, seed: this.seed % 9973 });
    if (this.queued.length > 12) this.queued.shift();
  }

  /** Hang a short-lived status (dizzy stars, a little chill) on a person; it follows them until it ends. */
  castOn(id: string, name: string, seconds: number) {
    this.statuses = this.statuses.filter((status) => status.name !== name);
    this.statuses.push({ id, name, until: this.last + seconds, offset: (this.statuses.length * 0.41) % 1 });
    if (this.statuses.length > 6) this.statuses.shift();
  }

  /** Play a screen-wide transition sweep. Ignored when one is already running or the budget has none. */
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

    paintTick += 1;
    drainBakes(reg, budget.animate ? (this.strained ? 2 : 6) : 40);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // landmarks and critters: cull first (so off-screen strips never bake), then keep the head of the list
    let landmarks = 0;
    if (budget.landmarks) {
      for (let i = 0; i < LANDMARK_LOOPS.length && landmarks < budget.landmarkCap; i += 1) {
        const loop = LANDMARK_LOOPS[i];
        if (loop.night && !input.night) continue;
        if (loop.day && input.night) continue;
        if (loopIsCritter(loop) && !MAGIC_CRITTERS_ENABLED) continue;
        const at = loopAt(loop, time, i);
        if (!onScreen(view, at.x, at.y, LOOP_REACH * (loop.scale ?? 1))) continue;
        const strip = stripFor(reg, loop.id, { seed: 1, ...(loop.opts ?? {}) });
        if (strip && drawStrip(ctx, view, strip, Math.round(at.x), Math.round(at.y), time + i * 0.37, loop.scale ?? 1, (loop.alpha ?? 1) * Math.min(1, budget.glow + 0.25)))
          landmarks += 1;
      }
    }

    // auras: strongest first, only those on screen, capped
    let auras = 0;
    if (budget.auras > 0) {
      const visible = input.people.filter((person) => {
        const at = toScreen(view, person.x, person.y);
        return at.x > -40 && at.y > -60 && at.x < view.viewW + 40 && at.y < view.viewH + 40;
      });
      const chosen = pickAuras(
        visible.map((person) => ({ person, aura: auraFor(person) })),
        budget.auras,
      );
      for (const { person, aura } of chosen) {
        if (!aura) continue;
        const strip = stripFor(reg, ...auraStrip(aura));
        if (!strip) continue;
        const offset = (person.id % 7) * 0.53;
        if (drawStrip(ctx, view, strip, person.x, person.y - 2 - auraLift(aura.kind), time + offset, auraScale(aura), aura.kind === "sleepy" || aura.kind === "dozing" ? 0.8 : 1)) auras += 1;
      }
    }

    // short statuses that follow a person after a spell
    this.statuses = this.statuses.filter((status) => status.until > input.now);
    if (budget.spells > 0 && budget.animate) {
      for (const status of this.statuses) {
        const person = input.people.find((candidate) => candidate.name === status.name);
        if (!person || !onScreen(view, person.x, person.y, 40)) continue;
        const strip = stripFor(reg, status.id, { seed: 2 });
        if (strip) drawStrip(ctx, view, strip, person.x, person.y - 2 - (WIZARD_LOOK_ENABLED ? HAT_LIFT : 0), time + status.offset, 0.6, 0.95);
      }
    }

    // one-shot spells
    if (budget.spells > 0 && budget.animate) {
      while (this.queued.length) {
        const next = this.queued.shift();
        if (!next) break;
        const spell = this.start(reg, next.id, next.x, next.y, next.seed);
        if (!spell) continue;
        this.spells.push(spell);
        while (this.spells.length > budget.spells) this.spells.shift();
      }
      for (const spell of this.spells) {
        spell.fx.update(dt);
        if (spell.fx.t >= spell.stopAfter) spell.fx.stop();
        if (input.now - spell.dirtyAt >= 1 / SPELL_FPS || spell.dirtyAt < 0) {
          spell.dirtyAt = input.now;
          reg.CORE.clearFrame(spell.frame);
          spell.fx.draw(spell.frame);
          reg.CORE.composite(spell.frame, spell.image.data, null, budget.glow);
          spell.canvas.getContext("2d")?.putImageData(spell.image, 0, 0);
        }
        const at = toScreen(view, spell.x, spell.y);
        const w = spell.w * at.sx * spell.scale;
        const h = spell.h * at.sy * spell.scale;
        ctx.drawImage(
          spell.canvas,
          Math.round(at.x - spell.ax * at.sx * spell.scale),
          Math.round(at.y - spell.ay * at.sy * spell.scale),
          Math.round(w),
          Math.round(h),
        );
      }
      this.spells = this.spells.filter((spell) => !spell.fx.done());
      this.play.paint(ctx, view, this.strained, (id, x, y, scale, alpha, at) => {
        if (!onScreen(view, x, y, LOOP_REACH * scale)) return false;
        const strip = stripFor(reg, id, { seed: 3 });
        return strip ? drawStrip(ctx, view, strip, Math.round(x), Math.round(y), at, scale, alpha) : false;
      });
    } else {
      this.clear();
    }

    // weather, in screen space, a few times a second
    const plan = budget.weather > 0 ? weatherPlan(input).slice(0, budget.weather) : [];
    if (plan.length && budget.animate) this.paintWeather(ctx, reg, view, plan, input.now, budget);

    // transitions: a sweep when night falls or the view jumps a long way in or out
    if (this.lastNight !== null && this.lastNight !== input.night) this.transition("transitions/blinds");
    this.lastNight = input.night;
    if (!this.zoomAnchor) this.zoomAnchor = view.spanW;
    const ratio = view.spanW / this.zoomAnchor;
    if (ratio > 1.6 || ratio < 1 / 1.6) {
      if (input.now - this.transitionAt >= 4) this.transition();
      this.zoomAnchor = view.spanW;
    }
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
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return {
      id,
      fx,
      x,
      y,
      w,
      h,
      ax,
      ay,
      scale: spellScale(id, w, h),
      canvas,
      frame: reg.CORE.createFrame(w, h, 0, 0),
      image: ctx.createImageData(w, h),
      dirtyAt: -1,
      stopAfter: SPELL_STOP[id] ?? (meta.loop ? 2.5 : Infinity),
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
          this.transitionNow = { fx, canvas, frame: reg.CORE.createFrame(w, h, 0, 0), image: cctx.createImageData(w, h), w, h };
          this.transitionAt = now;
        }
      }
    }
    const run = this.transitionNow;
    if (!run) return;
    run.fx.update(dt);
    if (run.fx.done() || run.fx.t > 2.4) {
      this.transitionNow = null;
      return;
    }
    reg.CORE.clearFrame(run.frame);
    run.fx.draw(run.frame);
    reg.CORE.composite(run.frame, run.image.data, null, budget.glow);
    run.canvas.getContext("2d")?.putImageData(run.image, 0, 0);
    // light only: the sweep's dark half adds nothing, so the village never blacks out
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.45;
    ctx.drawImage(run.canvas, 0, 0, view.viewW, view.viewH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private paintWeather(
    ctx: CanvasRenderingContext2D,
    reg: Registry,
    view: MagicView,
    plan: string[],
    now: number,
    budget: MagicBudget,
  ) {
    const W = 320;
    const H = 180;
    const key = plan.join(",");
    if (key !== this.weatherKey) {
      this.weatherKey = key;
      this.weatherFx.clear();
      this.weatherAt = -1;
    }
    if (!this.weatherCanvas) {
      this.weatherCanvas = makeCanvas(W, H * plan.length);
      this.weatherFrame = reg.CORE.createFrame(W, H, 0, 0);
      this.weatherImage = new ImageData(W, H);
    }
    if (this.weatherCanvas.height !== H * plan.length) this.weatherCanvas.height = H * plan.length;
    const frame = this.weatherFrame;
    const image = this.weatherImage;
    const wctx = this.weatherCanvas.getContext("2d");
    if (!frame || !image || !wctx) return;
    const step = 1 / Math.max(1, budget.weatherFps);
    if (this.weatherAt < 0 || now - this.weatherAt >= step) {
      const dt = this.weatherAt < 0 ? 0 : Math.min(0.25, now - this.weatherAt);
      this.weatherAt = now;
      plan.forEach((id, row) => {
        let fx = this.weatherFx.get(id);
        if (!fx) {
          const mod = reg.FX[id];
          if (!mod) return;
          const ox = mod.meta?.origin?.[0] ?? 160;
          const oy = mod.meta?.origin?.[1] ?? 170;
          fx = reg.CORE.createFx(mod, { x: ox, y: oy, seed: 3 + row, haze: false });
          // start mid-loop so particles already fill the sky
          fx.update(2);
          this.weatherFx.set(id, fx);
        }
        fx.update(dt);
        reg.CORE.clearFrame(frame);
        fx.draw(frame);
        reg.CORE.composite(frame, image.data, null, budget.glow);
        wctx.putImageData(image, 0, row * H);
      });
    }
    // one weather pixel per world pixel, tiled; the tile's bottom strip (where leaves and snow settle) is cut off
    // weather pixels are 2 CSS px on a wide desk; phones get the sparser grid below
    const scaleX = view.viewW / view.spanW;
    const dprN = Math.max(1, view.dpr);
    // phones: 1 CSS px pixels and only every other tile (checkerboard), so a small screen gets a light sprinkle, not a storm
    const narrow = view.viewW / dprN < 600;
    const px = (narrow ? 1 : 2) * dprN;
    const UH = 140;
    const tileW = W * px;
    const tileH = UH * px;
    const source = this.weatherCanvas as HTMLCanvasElement;
    plan.forEach((id, row) => {
      const band = weatherBand(id);
      const top = band.top * view.viewH;
      const bottom = band.bottom * view.viewH;
      ctx.globalAlpha = id === "weather/fog" ? 0.5 : id === "weather/god-rays" ? 0.65 : 1;
      if (weatherIsSky(id)) {
        // one stretched copy of the whole tile: aurora and stars hang from the top and fade out on their own,
        // mist keeps only its lower bank and sits on the bottom edge
        const dw = view.viewW;
        const dh = Math.round(bottom - top);
        const srcY = id === "weather/fog" ? 96 : 0;
        const srcH = id === "weather/fog" ? 84 : H;
        // sky layers add light only, so their dark backdrop never dims the village
        const additive = id !== "weather/fog";
        if (additive) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = id === "weather/aurora" ? 0.36 : id === "weather/god-rays" ? 0.35 : 0.8;
        }
        ctx.drawImage(source, 0, row * H + srcY, W, srcH, 0, Math.round(top), dw, dh);
        ctx.globalCompositeOperation = "source-over";
        return;
      }
      const sparse = id === "weather/falling-leaves" || id === "weather/cherry-blossoms";
      // anchor tiles to the world so weather drifts with the camera instead of sticking to the glass
      const shiftX = -((((view.camX * scaleX) % tileW) + tileW) % tileW);
      let j = 0;
      for (let y = top; y < bottom; y += tileH, j += 1) {
        const h = Math.min(tileH, bottom - y);
        const srcH = Math.max(1, Math.round((h / tileH) * UH));
        let i = 0;
        for (let x = shiftX; x < view.viewW; x += tileW, i += 1) {
          const dx = Math.round(x);
          const dw = Math.round(x + tileW) - dx;
          const dy = Math.round(y);
          const dh = Math.round(y + h) - dy;
          if (narrow && (i + j) % 2 === 1) continue;
          // big leaves and petals: a desk keeps two tiles in three, so a close zoom stays airy
          if (!narrow && sparse && (i + 2 * j) % 3 === 2) continue;
          if ((i + j) % 2 === 1 || (narrow && j % 4 === 2)) {
            ctx.save();
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(source, 0, row * H, W, srcH, 0, 0, dw, dh);
            ctx.restore();
          } else {
            ctx.drawImage(source, 0, row * H, W, srcH, dx, dy, dw, dh);
          }
        }
      }
    });
    ctx.globalAlpha = 1;
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
