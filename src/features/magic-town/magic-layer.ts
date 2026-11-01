/**
 * The magic overlay painter. Runs in the browser only, after the world is blitted and before name plates.
 * Loops (landmarks, auras) are baked once into frame strips, so a frame costs a few drawImage calls.
 * Weather and one-shot spells render live into small pixel frames at a capped rate.
 * Effects: pixelfx by patch-gg (MIT), vendored under src/vendor/pixelfx.
 */
import type { FxCore, FxInstance, FxModule } from "./magic-registry";
import {
  weatherIsSky,
  LANDMARKS,
  auraFor,
  pickAuras,
  weatherBand,
  weatherPlan,
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

/** A blank 24x38 actor so actor effects (halo, heal, blessing) draw no stock dummy over the cat. */
function blankActor() {
  const w = 24;
  const h = 38;
  return {
    mask: { w, h, data: new Uint8Array(w * h) },
    pixels: new Uint32Array(w * h),
    x: -12,
    y: -38,
    w,
    h,
    k: 2,
    head: [0, -38],
    chest: [0, -26],
  };
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  return canvas;
}

/* ------------------------------------------------------------- baked loops */

type Strip = { canvas: HTMLCanvasElement; w: number; h: number; ax: number; ay: number; frames: number; fps: number };

const strips = new Map<string, Strip | "pending">();
const bakeQueue: { key: string; id: string; opts: Record<string, unknown> }[] = [];

const BAKE_FPS = 12;
const BAKE_MAX = 40;

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
  const canvas = makeCanvas(w * frames, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < frames; i += 1) {
    reg.CORE.clearFrame(frame);
    fx.draw(frame);
    reg.CORE.composite(frame, image.data, null, Number(opts.light ?? 1));
    ctx.putImageData(image, i * w, 0);
    fx.update(1 / fps);
  }
  return { canvas, w, h, ax, ay, frames, fps };
}

function stripFor(reg: Registry, id: string, opts: Record<string, unknown> = {}): Strip | null {
  const key = `${id}|${JSON.stringify(opts)}`;
  const got = strips.get(key);
  if (got && got !== "pending") return got;
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

type Loop = { id: string; x: number; y: number; opts?: Record<string, unknown>; scale?: number; alpha?: number; night?: boolean; day?: boolean };

/** The standing magic of the town. World pixels, kept off the plot rows. */
export const LANDMARK_LOOPS: readonly Loop[] = [
  // 魔法阵广场: rune circle on the crossroads, braziers on two corners
  { id: "arcane/rune-circle", x: 608, y: 676, scale: 0.6 },
  { id: "fire/brazier", x: 568, y: 640, scale: 0.42 },
  { id: "fire/brazier", x: 648, y: 640, scale: 0.42, opts: { seed: 5 } },
  // 村口传送门 beside the gate post
  { id: "arcane/portal", x: 60, y: 206, scale: 0.42 },
  // 许愿泉 on the pond bank, with fish under the water and ripples
  { id: "water/fountain", x: 300, y: 204, scale: 0.42 },
  { id: "critters/fish-school", x: 120, y: 84, scale: 0.6, alpha: 0.85 },
  { id: "water/ripples", x: 176, y: 108, scale: 0.5, alpha: 0.7 },
  // 篝火 by the picnic spot
  { id: "fire/campfire", x: 660, y: 214, scale: 0.4 },
  // 浮空灯 over the path lantern
  { id: "fire/spirit-flame", x: 610, y: 222, scale: 0.34, opts: { palette: ["#3a1406", "#7a2a0a", "#c8561a", "#f29a32", "#ffd06a", "#fff1b8"] } },
  { id: "fire/candle", x: 586, y: 214, scale: 0.5 },
  { id: "fire/candle", x: 634, y: 210, scale: 0.5, opts: { seed: 7 } },
  // chimney smoke on the two houses
  { id: "village/chimney-smoke", x: 510, y: 104, alpha: 0.85 },
  { id: "village/chimney-smoke", x: 782, y: 120, alpha: 0.85, opts: { seed: 8 } },
  // road glints on the top road and the long street
  { id: "village/road-glint", x: 380, y: 230, night: true },
  { id: "village/road-glint", x: 860, y: 230, night: true, opts: { seed: 12 } },
  { id: "village/road-glint", x: 608, y: 450, night: true, opts: { along: "y", seed: 14 } },
  { id: "village/road-glint", x: 300, y: 658, night: true, opts: { seed: 16 } },
  { id: "village/road-glint", x: 920, y: 658, night: true, opts: { seed: 18 } },
  // wisps and butterflies drift over the meadow
  { id: "critters/wisp", x: 1000, y: 120, scale: 0.5, night: true },
  { id: "critters/wisp", x: 250, y: 560, scale: 0.5, night: true, opts: { seed: 3 } },
  { id: "critters/butterfly", x: 960, y: 110, scale: 0.6, day: true },
  { id: "critters/butterfly", x: 300, y: 330, scale: 0.6, day: true, opts: { seed: 5 } },
];

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
const SPELL_STOP: Record<string, number> = { "holy/blessing": 2.4, "holy/heal": 2.2 };

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
  stats: MagicStats = { ready: false, weather: [], auras: 0, spells: 0, landmarks: 0, baked: 0, ms: 0 };

  /** Queue a spell at world pixels. Plays once the effects bundle has loaded. */
  cast(id: string, x: number, y: number) {
    this.seed = (this.seed * 1103515245 + 12345) >>> 0;
    this.queued.push({ id, x, y, seed: this.seed % 9973 });
    if (this.queued.length > 12) this.queued.shift();
  }

  clear() {
    this.spells = [];
    this.queued = [];
  }

  get liveSpells() {
    return this.spells.length + this.queued.length;
  }

  render(ctx: CanvasRenderingContext2D, view: MagicView, input: MagicInput) {
    const t0 = performance.now();
    const budget = input.budget;
    if (!budget.on) {
      this.clear();
      this.stats = { ...this.stats, weather: [], auras: 0, spells: 0, landmarks: 0, ms: 0 };
      return;
    }
    const reg = loadMagic();
    if (!reg) return;
    const dt = this.last < 0 ? 0 : Math.min(0.05, Math.max(0, input.now - this.last));
    this.last = input.now;
    const time = budget.animate ? input.now : 0;

    drainBakes(reg, budget.animate ? 6 : 40);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // landmarks
    let landmarks = 0;
    if (budget.landmarks) {
      for (let i = 0; i < LANDMARK_LOOPS.length; i += 1) {
        const loop = LANDMARK_LOOPS[i];
        if (loop.night && !input.night) continue;
        if (loop.day && input.night) continue;
        const strip = stripFor(reg, loop.id, { seed: 1, ...(loop.opts ?? {}) });
        if (strip && drawStrip(ctx, view, strip, loop.x, loop.y, time + i * 0.37, loop.scale ?? 1, (loop.alpha ?? 1) * Math.min(1, budget.glow + 0.25)))
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
        if (drawStrip(ctx, view, strip, person.x, person.y - 2, time + offset, aura.kind === "holy" ? 0.8 : 1, aura.kind === "sleepy" ? 0.8 : 1)) auras += 1;
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
    } else {
      this.clear();
    }

    // weather, in screen space, a few times a second
    const plan = budget.weather > 0 ? weatherPlan(input).slice(0, budget.weather) : [];
    if (plan.length && budget.animate) this.paintWeather(ctx, reg, view, plan, input.now, budget);

    ctx.restore();
    this.stats = {
      ready: true,
      weather: plan,
      auras,
      spells: this.spells.length,
      landmarks,
      baked: [...strips.values()].filter((value) => value !== "pending").length,
      ms: Math.round((performance.now() - t0) * 100) / 100,
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
      scale: SPELL_SCALE[id] ?? 1,
      canvas,
      frame: reg.CORE.createFrame(w, h, 0, 0),
      image: ctx.createImageData(w, h),
      dirtyAt: -1,
      stopAfter: SPELL_STOP[id] ?? (meta.loop ? 2.5 : Infinity),
    };
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
    // weather pixels are 2 CSS px everywhere: sparse and calm on a wide desk, never a blizzard on a phone
    const scaleX = view.viewW / view.spanW;
    const dprN = Math.max(1, view.dpr);
    const px = (view.viewW / dprN < 600 ? 1.25 : 2) * dprN;
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
          if ((i + j) % 2 === 1) {
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
  return ["village/sleepy-sparkle", { seed: 2 }];
}

export { LANDMARKS };
