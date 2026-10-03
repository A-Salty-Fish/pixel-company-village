/**
 * PV-PM-072 — night keeps a few warm windows and path stones.
 * No pond rectangle and no full-screen fill. The phone camera stays
 * on NARROW_MAP_FILL. Set NIGHT_HEARTH_ENABLED to false to skip this lift.
 *
 * Path stones stay on the same world centers. On a phone the 3×2 chips
 * used to land under 2 CSS pixels; the drawn stone keeps a 3:2 footprint
 * whose short side is at least 4 CSS pixels. Windows are not enlarged.
 */

import type { Pixel } from "@/lib/worldcraft";

export const NIGHT_HEARTH_ENABLED = true;

/** Short side of a path stone, in CSS pixels. Canvas pixels scale with dpr. */
export const HEARTH_STONE_MIN_SHORT_CSS = 4;

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

export const HEARTH_STONE_COLOR = "#e7c48a";

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

export function isHearthStone(pixel: Pixel) {
  return pixel.color === HEARTH_STONE_COLOR && pixel.w === 3 && pixel.h === 2;
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number; dpr?: number };

export type HearthScreenBox = { sx: number; sy: number; sw: number; sh: number };

/**
 * Stone footprint in canvas pixels. Center is the world center.
 * Width:height stays 3:2. The short side is at least 4 CSS pixels,
 * and never smaller than the natural projection.
 */
export function hearthStoneScreenBox(pixel: Pixel, cam: Cam): HearthScreenBox {
  const dpr = Math.max(1, cam.dpr ?? 1);
  const worldCx = pixel.x + pixel.w / 2;
  const worldCy = pixel.y + pixel.h / 2;
  const centerX = ((worldCx - cam.camX) / cam.worldW) * cam.viewW;
  const centerY = ((worldCy - cam.camY) / cam.worldH) * cam.viewH;
  const natW = (pixel.w / cam.worldW) * cam.viewW;
  const natH = (pixel.h / cam.worldH) * cam.viewH;
  const minShort = HEARTH_STONE_MIN_SHORT_CSS * dpr;
  const unit = Math.max(minShort / 2, natW / 3, natH / 2);
  const sw = unit * 3;
  const sh = unit * 2;
  return { sx: centerX - sw / 2, sy: centerY - sh / 2, sw, sh };
}

/** Windows keep the old top-left projection. No CSS minimum. */
export function hearthWindowScreenBox(pixel: Pixel, cam: Cam): HearthScreenBox {
  const sx = ((pixel.x - cam.camX) / cam.worldW) * cam.viewW;
  const sy = ((pixel.y - cam.camY) / cam.worldH) * cam.viewH;
  const sw = Math.max(2, (pixel.w / cam.worldW) * cam.viewW);
  const sh = Math.max(2, (pixel.h / cam.worldH) * cam.viewH);
  return { sx, sy, sw, sh };
}

export function hearthScreenBox(pixel: Pixel, cam: Cam): HearthScreenBox {
  return isHearthStone(pixel) ? hearthStoneScreenBox(pixel, cam) : hearthWindowScreenBox(pixel, cam);
}

/** Still warm marks after the night veil. Reduced motion uses the same pixels. */
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
    const box = hearthScreenBox(pixel, input);
    if (box.sx + box.sw < 0 || box.sy + box.sh < 0 || box.sx > input.viewW || box.sy > input.viewH) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(box.sx, box.sy, box.sw, box.sh);
    lamps += 1;
  }
  ctx.restore();
  return { mode: "warm" as const, lamps };
}
