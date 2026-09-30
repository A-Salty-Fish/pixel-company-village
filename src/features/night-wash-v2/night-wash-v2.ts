/**
 * PV-PM-016 — night follows the same clock as the glance line.
 * Quiet villages and the dusk toggle used to leave the map bright green
 * while the top bar already said 夜里. This wash does not.
 * Set NIGHT_WASH_V2_ENABLED to false to restore PV-PM-014.
 * 减少动作 keeps the same still pixels.
 */

import { lightLabel } from "@/lib/copy";
import { contrastRatio, type Rgb } from "@/features/night-wash/night-wash";

export const NIGHT_WASH_V2_ENABLED = true;

export const NIGHT_FRAME = "#081018";
export const DAY_GRASS: Rgb = { r: 60, g: 110, b: 50 };
export const MULTIPLY_INK: Rgb = { r: 28, g: 40, b: 96 };
export const VEIL_INK = { r: 6, g: 14, b: 42, a: 0.78 };
export const VIGNETTE_INK = "rgba(2, 6, 16, 0.78)";
export const LAMP_CORE: Rgb = { r: 255, g: 246, b: 216 };
export const LAMP_GLOW = "#f2d15c";
export const LAMP_HALO = "#c48a2a";

export type NightLookV2 = {
  frame: string;
  multiply: string;
  veil: string;
  vignette: string;
  lamp: string;
  glow: string;
  static: true;
};

function channelHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

export function rgbHex(color: Rgb) {
  return `#${channelHex(color.r)}${channelHex(color.g)}${channelHex(color.b)}`;
}

/** Same hours as the top-bar light word. Quiet does not enter. */
export function sessionIsNight(hour: number) {
  return lightLabel(hour) === "夜里";
}

/** The map paints night whenever the glance line says 夜里. */
export function nightWashV2ShouldPaint(hour: number, quiet: boolean) {
  void quiet;
  return NIGHT_WASH_V2_ENABLED && sessionIsNight(hour);
}

export function nightLookV2(reduced: boolean): NightLookV2 {
  void reduced;
  return {
    frame: NIGHT_FRAME,
    multiply: rgbHex(MULTIPLY_INK),
    veil: `rgba(${VEIL_INK.r}, ${VEIL_INK.g}, ${VEIL_INK.b}, ${VEIL_INK.a})`,
    vignette: VIGNETTE_INK,
    lamp: rgbHex(LAMP_CORE),
    glow: LAMP_GLOW,
    static: true,
  };
}

export function nightWashV2Mark(night: boolean): "active" | "off" {
  return NIGHT_WASH_V2_ENABLED && night ? "active" : "off";
}

export function multiplyRgb(base: Rgb, ink: Rgb): Rgb {
  return {
    r: (base.r * ink.r) / 255,
    g: (base.g * ink.g) / 255,
    b: (base.b * ink.b) / 255,
  };
}

export function veilOver(base: Rgb, ink: { r: number; g: number; b: number; a: number }): Rgb {
  const keep = 1 - ink.a;
  return {
    r: base.r * keep + ink.r * ink.a,
    g: base.g * keep + ink.g * ink.a,
    b: base.b * keep + ink.b * ink.a,
  };
}

/** Cool dark field a bright green tile becomes under the v2 wash. */
export function nightField(day: Rgb = DAY_GRASS) {
  return veilOver(multiplyRgb(day, MULTIPLY_INK), VEIL_INK);
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

function paintLamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, look: NightLookV2) {
  ctx.fillStyle = LAMP_HALO;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = look.glow;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = look.lamp;
  ctx.fillRect(x + 1, y + 1, Math.max(3, Math.round(w * 0.55)), Math.max(2, Math.round(h * 0.5)));
}

/** Screen-space wash under the nameplates. Lamps stay warm and do not flicker. */
export function paintNightWashV2(ctx: CanvasRenderingContext2D, input: PaintInput) {
  const look = nightLookV2(input.reduced);
  if (!NIGHT_WASH_V2_ENABLED) return { mode: "off" as const, lamps: 0 };
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = look.multiply;
  ctx.fillRect(0, 0, input.viewW, input.viewH);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = look.veil;
  ctx.fillRect(0, 0, input.viewW, input.viewH);
  const cx = input.viewW / 2;
  const cy = input.viewH / 2;
  const inner = Math.min(input.viewW, input.viewH) * 0.34;
  const outer = Math.max(input.viewW, input.viewH) * 0.72;
  const vignette = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  vignette.addColorStop(0, "rgba(2, 6, 16, 0)");
  vignette.addColorStop(1, look.vignette);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, input.viewW, input.viewH);

  const scale = input.viewW / Math.max(1, input.worldW);
  let lamps = 0;
  for (const house of input.houses) {
    const sx = ((house.x + 2 - input.camX) / input.worldW) * input.viewW;
    const sy = ((house.y + 3 - input.camY) / input.worldH) * input.viewH;
    if (sx < -24 || sy < -24 || sx > input.viewW || sy > input.viewH) continue;
    const w = Math.max(8, 10 * scale);
    const h = Math.max(6, 7 * scale);
    paintLamp(ctx, sx, sy, w, h, look);
    lamps += 1;
  }
  if (lamps === 0) {
    paintLamp(ctx, Math.round(input.viewW * 0.2), Math.round(input.viewH * 0.28), 10, 7, look);
    paintLamp(ctx, Math.round(input.viewW * 0.68), Math.round(input.viewH * 0.62), 10, 7, look);
    lamps = 2;
  }
  ctx.restore();
  return { mode: "active" as const, lamps };
}

export { contrastRatio };
