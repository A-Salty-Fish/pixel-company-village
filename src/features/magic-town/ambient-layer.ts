/**
 * PV-MAGIC-STYLE-001 — the town's standing air, painted by hand in world pixels instead of tiled weather.
 * Day: a handful of slow petals, snow or leaves and a few gold motes. Night: fireflies in breathing clusters,
 * stepped lantern pools at the fires and a faint aurora along the top. No fog, no god rays.
 * Everything is a pure function of the clock (no particle state), anchored to the world so it drifts with the map,
 * and thinned out on a full-map view so the overview never turns to noise.
 */
import { beat, envelope, ramp, smoothstep, particleCount, type ZoomTier } from "@/features/magic-style/magic-style";

export type AmbientView = { camX: number; camY: number; spanW: number; spanH: number; viewW: number; viewH: number };
export type AmbientInput = {
  plan: readonly string[];
  night: boolean;
  now: number;
  tier: ZoomTier;
  narrow: boolean;
  /** Fire spots on screen (world px) that get a lantern pool after dark. */
  fires: readonly { x: number; y: number; r: number }[];
};

/** World anchors for firefly clusters: pond, garden, plaza corners, market, shrine, meadows. */
export const FIREFLY_CLUSTERS: readonly { x: number; y: number }[] = [
  { x: 118, y: 140 },
  { x: 336, y: 250 },
  { x: 700, y: 250 },
  { x: 1050, y: 200 },
  { x: 220, y: 600 },
  { x: 540, y: 720 },
  { x: 700, y: 610 },
  { x: 1000, y: 860 },
  { x: 330, y: 960 },
  { x: 820, y: 1010 },
];

const CELL_W = 300;
const CELL_H = 240;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Fall = "petals" | "snow" | "leaves" | null;

/** Which falling kind the plan asks for by day. */
export function fallKind(plan: readonly string[]): Fall {
  for (const id of plan) {
    if (id === "weather/cherry-blossoms") return "petals";
    if (id === "weather/snow" || id === "weather/blizzard") return "snow";
    if (id === "weather/falling-leaves") return "leaves";
  }
  return null;
}

export class AmbientLayer {
  /** Particles painted last frame, for the stats and the test hook. */
  count = 0;

  paint(ctx: CanvasRenderingContext2D, view: AmbientView, input: AmbientInput) {
    this.count = 0;
    const k = view.viewW / view.spanW;
    const unit = Math.max(1, Math.round(k));
    const toX = (wx: number) => Math.round((wx - view.camX) * k);
    const toY = (wy: number) => Math.round((wy - view.camY) * k);
    const inView = (wx: number, wy: number, pad = 8) =>
      wx > view.camX - pad && wy > view.camY - pad && wx < view.camX + view.spanW + pad && wy < view.camY + view.spanH + pad;
    const px = (wx: number, wy: number, size: number, color: string, alpha: number) => {
      if (alpha <= 0.02) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(toX(wx), toY(wy), size, size);
    };
    const t = input.now;
    const step = beat(t);
    ctx.save();
    if (!input.night) {
      this.paintDay(input, view, t, step, unit, inView, px);
    } else {
      this.paintNight(ctx, input, view, t, step, k, unit, inView, px);
    }
    ctx.restore();
  }

  private paintDay(
    input: AmbientInput,
    view: AmbientView,
    t: number,
    step: number,
    unit: number,
    inView: (x: number, y: number, pad?: number) => boolean,
    px: (x: number, y: number, size: number, color: string, alpha: number) => void,
  ) {
    const fall = fallKind(input.plan);
    const motes = input.plan.includes("weather/god-rays") ? 2 : 1;
    const perCell = particleCount(input.narrow ? 2 : 2, input.tier);
    const c0 = Math.floor((view.camX - 40) / CELL_W);
    const c1 = Math.floor((view.camX + view.spanW + 40) / CELL_W);
    const r0 = Math.floor((view.camY - 60) / CELL_H);
    const r1 = Math.floor((view.camY + view.spanH + 20) / CELL_H);
    const map = input.tier === "map";
    for (let cy = r0; cy <= r1; cy += 1)
      for (let cx = c0; cx <= c1; cx += 1) {
        const cell = cx * 92821 + cy * 68917;
        // a full map keeps one cell in three, so the overview is calm
        if (map && Math.floor(hash(cell) * 3) !== 0) continue;
        if (fall) {
          for (let i = 0; i < perCell; i += 1) {
            const seed = cell * 7 + i * 13;
            const life = 8 + hash(seed) * 3;
            const age = (t + hash(seed + 1) * life) % life;
            const cycle = Math.floor((t + hash(seed + 1) * life) / life);
            const bx = cx * CELL_W + hash(seed + 2 + cycle) * CELL_W;
            const by = cy * CELL_H + hash(seed + 3 + cycle) * CELL_H - 30;
            const speed = fall === "snow" ? 7 : fall === "petals" ? 6 : 8;
            const wx = bx + Math.sin(age * 0.9 + seed) * (fall === "leaves" ? 9 : 6) + age * 3;
            const wy = by + age * speed;
            if (!inView(wx, wy)) continue;
            const a = envelope(age, life, 1.4, 2.2) * (fall === "snow" ? 0.85 : 0.8);
            this.count += 1;
            // three flutter frames on the shared 12fps beat
            const frame = Math.floor(step * 4 + i) % 3;
            if (fall === "snow") {
              px(wx, wy, unit, ramp("mist", 4), a);
              if (!map && frame === 0) px(wx + 1, wy, unit, ramp("cyan", 3), a * 0.5);
            } else {
              const light = fall === "petals" ? ramp("violet", 3) : ramp("gold", 2);
              const dark = fall === "petals" ? ramp("violet", 2) : ramp("gold", 1);
              px(wx, wy, unit, light, a);
              if (!map) {
                if (frame === 0) px(wx + 1, wy, unit, dark, a);
                else if (frame === 1) px(wx + 1, wy + 1, unit, dark, a);
                else px(wx, wy + 1, unit, dark, a);
              }
            }
          }
        }
        // gold motes: a slow rise and a soft twinkle
        for (let i = 0; i < motes; i += 1) {
          const seed = cell * 11 + i * 29 + 5;
          const life = 7 + hash(seed) * 3;
          const age = (t + hash(seed + 1) * life) % life;
          const cycle = Math.floor((t + hash(seed + 1) * life) / life);
          const wx = cx * CELL_W + hash(seed + 2 + cycle) * CELL_W + Math.sin(age * 0.6 + seed) * 4;
          const wy = cy * CELL_H + hash(seed + 3 + cycle) * CELL_H - age * 2.5;
          if (!inView(wx, wy)) continue;
          const glow = envelope(age, life, 2, 2.5);
          // brightness steps in thirds so the twinkle reads as pixel art, not a fade
          const level = Math.round(glow * 3) / 3;
          if (level <= 0) continue;
          this.count += 1;
          px(wx, wy, unit, ramp("gold", 3), 0.55 * level);
          if (!map && level >= 0.66) {
            px(wx - 1, wy, unit, ramp("gold", 2), 0.25 * level);
            px(wx + 1, wy, unit, ramp("gold", 2), 0.25 * level);
            px(wx, wy - 1, unit, ramp("gold", 2), 0.25 * level);
            px(wx, wy + 1, unit, ramp("gold", 2), 0.25 * level);
          }
        }
      }
    void view;
  }

  private paintNight(
    ctx: CanvasRenderingContext2D,
    input: AmbientInput,
    view: AmbientView,
    t: number,
    step: number,
    k: number,
    unit: number,
    inView: (x: number, y: number, pad?: number) => boolean,
    px: (x: number, y: number, size: number, color: string, alpha: number) => void,
  ) {
    const map = input.tier === "map";
    // lantern pools: three stepped rings of warm light, the outer ring flickers on a slow beat
    ctx.globalCompositeOperation = "lighter";
    for (const fire of input.fires) {
      if (!inView(fire.x, fire.y, fire.r + 4)) continue;
      const flick = Math.floor(beat(t, 4) * 4 + fire.x) % 5 === 0 ? 1 : 0;
      const rings = [
        { r: fire.r - flick, a: 0.07 },
        { r: Math.round(fire.r * 0.66), a: 0.08 },
        { r: Math.round(fire.r * 0.36), a: 0.1 },
      ];
      for (const ring of rings) this.pixelDisc(ctx, view, k, fire.x, fire.y, ring.r, ramp("gold", 2), ring.a);
    }
    // the aurora: a few soft ribbons hung from the top of the view, columns stepped two world pixels wide
    if (input.plan.includes("weather/aurora") && !map) {
      const cols = Math.ceil(view.spanW / 2);
      const top = 0;
      for (let i = 0; i < cols; i += 1) {
        const wx = view.camX + i * 2;
        const wave = Math.sin(wx * 0.018 + step * 0.35) + 0.6 * Math.sin(wx * 0.041 - step * 0.22);
        const length = Math.round(14 + wave * 8);
        const band = (Math.sin(wx * 0.006 + step * 0.1) + 1) / 2;
        const color = band > 0.5 ? ramp("cyan", 2) : ramp("violet", 2);
        const x = Math.round(i * 2 * k);
        const w = Math.max(1, Math.round(2 * k));
        // three bands of falling alpha
        for (let b = 0; b < 3; b += 1) {
          ctx.globalAlpha = [0.16, 0.1, 0.05][b] * smoothstep(band * 2 + 0.2);
          ctx.fillStyle = color;
          const y0 = Math.round((top + (length * b) / 3) * k);
          const y1 = Math.round((top + (length * (b + 1)) / 3) * k);
          ctx.fillRect(x, y0, w, Math.max(1, y1 - y0));
        }
      }
    }
    // a shooting star now and then on star nights
    if (input.plan.includes("weather/shooting-stars")) {
      const period = 7;
      const n = Math.floor(t / period);
      const age = t - n * period;
      if (age < 0.7) {
        const sx = view.camX + view.spanW * (0.2 + hash(n) * 0.6);
        const sy = view.camY + view.spanH * (0.05 + hash(n + 3) * 0.2);
        const f = smoothstep(age / 0.7);
        for (let j = 0; j < 6; j += 1) {
          const back = f * 60 - j * 3;
          if (back < 0) continue;
          px(sx - back, sy + back * 0.45, unit, j === 0 ? ramp("gold", 4) : ramp("mist", 3), (1 - j / 6) * (1 - f * 0.6) * 0.8);
        }
      }
    }
    // fireflies: clusters breathe together on a four-second rhythm, each fly a little behind its neighbour
    const flies = particleCount(input.narrow ? 4 : 5, input.tier);
    FIREFLY_CLUSTERS.forEach((anchor, ci) => {
      if (map && ci % 2 === 1) return;
      if (!inView(anchor.x, anchor.y, 40)) return;
      const breath = (t / 4 + ci * 0.37) % 1;
      for (let i = 0; i < flies; i += 1) {
        const seed = ci * 31 + i * 7;
        const wx = anchor.x + Math.sin(t * 0.31 + seed) * 22 + Math.sin(t * 0.73 + seed * 2) * 6;
        const wy = anchor.y + Math.cos(t * 0.27 + seed * 1.3) * 12 + Math.sin(t * 0.9 + seed) * 3;
        const phase = (breath - i * 0.12 + 1) % 1;
        const glow = Math.sin(phase * Math.PI) ** 2;
        const level = Math.round(glow * 3);
        this.count += 1;
        ctx.globalCompositeOperation = "source-over";
        px(wx, wy, unit, level >= 2 ? ramp("gold", 4) : ramp("gold", 3), level === 0 ? 0.35 : 0.9);
        if (level >= 2 && !map) {
          ctx.globalCompositeOperation = "lighter";
          const a = level === 3 ? 0.3 : 0.18;
          px(wx - 1, wy, unit, ramp("gold", 2), a);
          px(wx + 1, wy, unit, ramp("gold", 2), a);
          px(wx, wy - 1, unit, ramp("gold", 2), a);
          px(wx, wy + 1, unit, ramp("gold", 2), a);
        }
      }
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  /** A filled circle of whole world pixels, drawn as one rect per row. */
  private pixelDisc(ctx: CanvasRenderingContext2D, view: AmbientView, k: number, cx: number, cy: number, r: number, color: string, alpha: number) {
    if (r <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const rx = Math.round(cx);
    const ry = Math.round(cy);
    for (let dy = -r; dy <= r; dy += 1) {
      // flattened a touch so pools sit on the ground
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - (dy * 1.6) ** 2)));
      if (half <= 0) continue;
      const x0 = Math.round((rx - half - view.camX) * k);
      const x1 = Math.round((rx + half + 1 - view.camX) * k);
      const y0 = Math.round((ry + dy - view.camY) * k);
      const y1 = Math.round((ry + dy + 1 - view.camY) * k);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
}
