/**
 * PV-PM-014 — night reads as night: cool tint, edge vignette, lit windows.
 * The look does not move. 减少动作 keeps the same pixels.
 * Set NIGHT_WASH_ENABLED to false to restore the flat blue fill.
 */

export const NIGHT_WASH_ENABLED = true;

export const NIGHT_FRAME = "#16305c";
export const NIGHT_TINT = "rgba(14, 36, 84, 0.52)";
export const NIGHT_VIGNETTE = "rgba(4, 10, 28, 0.5)";
export const NIGHT_WINDOW = "#fff6d8";
export const NIGHT_WINDOW_GLOW = "#f2d15c";
export const LEGACY_NIGHT_TINT = "rgba(16, 28, 64, 0.34)";

export const DAY_GRASS = { r: 60, g: 110, b: 50 };
export const NIGHT_INK = { r: 14, g: 36, b: 84, a: 0.52 };
export const WINDOW_CORE = { r: 255, g: 246, b: 216 };

export type Rgb = { r: number; g: number; b: number };

export type NightLook = {
  frame: string;
  tint: string;
  vignette: string;
  window: string;
  glow: string;
  static: true;
};

/** Same colors whether motion is reduced or not. */
export function nightLook(reduced: boolean): NightLook {
  void reduced;
  return {
    frame: NIGHT_FRAME,
    tint: NIGHT_TINT,
    vignette: NIGHT_VIGNETTE,
    window: NIGHT_WINDOW,
    glow: NIGHT_WINDOW_GLOW,
    static: true,
  };
}

export function nightWashMark(night: boolean, reduced: boolean): "cool" | "flat" | "off" {
  void reduced;
  if (!night) return "off";
  return NIGHT_WASH_ENABLED ? "cool" : "flat";
}

export function blendOver(base: Rgb, ink: { r: number; g: number; b: number; a: number }): Rgb {
  const keep = 1 - ink.a;
  return {
    r: base.r * keep + ink.r * ink.a,
    g: base.g * keep + ink.g * ink.a,
    b: base.b * keep + ink.b * ink.a,
  };
}

/** Green-minus-blue drops once the cool wash is on. A non-designer can see that shift. */
export function nightShift(day: Rgb, night: Rgb) {
  return day.g - day.b - (night.g - night.b);
}

function channel(value: number) {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(a: Rgb, b: Rgb) {
  const lum = (color: Rgb) => 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  const hi = Math.max(lum(a), lum(b));
  const lo = Math.min(lum(a), lum(b));
  return (hi + 0.05) / (lo + 0.05);
}

type House = { x: number; y: number };

type PaintInput = {
  viewW: number;
  viewH: number;
  camX: number;
  camY: number;
  worldW: number;
  worldH: number;
  houses: House[];
  reduced: boolean;
};

/** Screen-space wash under the nameplates. Windows stay warm and do not flicker. */
export function paintNightWash(ctx: CanvasRenderingContext2D, input: PaintInput) {
  const look = nightLook(input.reduced);
  if (!NIGHT_WASH_ENABLED) {
    ctx.fillStyle = LEGACY_NIGHT_TINT;
    ctx.fillRect(0, 0, input.viewW, input.viewH);
    return { mode: "flat" as const, windows: 0 };
  }
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = look.tint;
  ctx.fillRect(0, 0, input.viewW, input.viewH);
  const cx = input.viewW / 2;
  const cy = input.viewH / 2;
  const inner = Math.min(input.viewW, input.viewH) * 0.28;
  const outer = Math.max(input.viewW, input.viewH) * 0.72;
  const vignette = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  vignette.addColorStop(0, "rgba(4, 10, 28, 0)");
  vignette.addColorStop(1, look.vignette);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, input.viewW, input.viewH);

  const scale = input.viewW / Math.max(1, input.worldW);
  let windows = 0;
  for (const house of input.houses) {
    const sx = ((house.x + 2 - input.camX) / input.worldW) * input.viewW;
    const sy = ((house.y + 3 - input.camY) / input.worldH) * input.viewH;
    if (sx < -20 || sy < -20 || sx > input.viewW || sy > input.viewH) continue;
    const w = Math.max(4, 5 * scale);
    const h = Math.max(3, 4 * scale);
    ctx.fillStyle = look.glow;
    ctx.fillRect(sx - 1, sy - 1, w + 2, h + 2);
    ctx.fillStyle = look.window;
    ctx.fillRect(sx + 1, sy + 1, Math.max(2, w * 0.45), Math.max(1, h * 0.4));
    windows += 1;
  }
  ctx.restore();
  return { mode: "cool" as const, windows };
}
