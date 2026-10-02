/**
 * PV-PM-072 — night keeps a few warm windows and path stones.
 * No pond rectangle and no full-screen fill. The phone camera stays
 * on NARROW_MAP_FILL. Set NIGHT_HEARTH_ENABLED to false to skip this lift.
 */

import type { Pixel } from "@/lib/worldcraft";

export const NIGHT_HEARTH_ENABLED = true;

/** Windows and a handful of path stones. Nothing here is a slab. */
const HEARTH: readonly Pixel[] = [
  { x: 467, y: 143, w: 6, h: 6, color: "#fff6d8" },
  { x: 434, y: 171, w: 8, h: 6, color: "#f2d15c" },
  { x: 756, y: 176, w: 5, h: 4, color: "#fff6d8" },
  { x: 1016, y: 960, w: 6, h: 5, color: "#f2d15c" },
  { x: 248, y: 220, w: 3, h: 2, color: "#e7c48a" },
  { x: 360, y: 226, w: 3, h: 2, color: "#e7c48a" },
  { x: 760, y: 220, w: 3, h: 2, color: "#e7c48a" },
  { x: 900, y: 226, w: 3, h: 2, color: "#e7c48a" },
  { x: 1040, y: 220, w: 3, h: 2, color: "#e7c48a" },
];

export function nightHearthOn(enabled = NIGHT_HEARTH_ENABLED) {
  return enabled;
}

export function nightHearthMark(night: boolean, enabled = NIGHT_HEARTH_ENABLED): "warm" | "off" {
  return enabled && night ? "warm" : "off";
}

export function nightHearthPixels(night: boolean, enabled = NIGHT_HEARTH_ENABLED): readonly Pixel[] {
  if (nightHearthMark(night, enabled) !== "warm") return [];
  return HEARTH;
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number };

/** Still warm specks after the night veil. Reduced motion uses the same pixels. */
export function paintNightHearth(
  ctx: CanvasRenderingContext2D,
  input: Cam & { night: boolean; reduced: boolean },
) {
  void input.reduced;
  const pixels = nightHearthPixels(input.night);
  if (pixels.length === 0) return { mode: "off" as const, lamps: 0 };
  ctx.save();
  ctx.globalAlpha = 0.92;
  let lamps = 0;
  for (const pixel of pixels) {
    const sx = ((pixel.x - input.camX) / input.worldW) * input.viewW;
    const sy = ((pixel.y - input.camY) / input.worldH) * input.viewH;
    const sw = (pixel.w / input.worldW) * input.viewW;
    const sh = (pixel.h / input.worldH) * input.viewH;
    if (sx + sw < 0 || sy + sh < 0 || sx > input.viewW || sy > input.viewH) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(sx, sy, Math.max(2, sw), Math.max(2, sh));
    lamps += 1;
  }
  ctx.restore();
  return { mode: "warm" as const, lamps };
}
