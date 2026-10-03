/**
 * PV-PM-072 — night keeps a few warm windows and path stones.
 * No pond rectangle and no full-screen fill. The phone camera stays
 * on NARROW_MAP_FILL. Set NIGHT_HEARTH_ENABLED to false to skip this lift.
 *
 * On a portrait map the five north-path stones read as specks, so they
 * are not painted. Wide maps keep the original 3×2 chips. Windows stay.
 */

import type { Pixel } from "@/lib/worldcraft";
import { portraitMap } from "@/features/narrow-map-fill/narrow-map-fill";

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

/** North-road chips. Hidden on the same portrait map that opens at zoom 2. */
export const NORTH_PATH_STONES = [
  { x: 248, y: 220, w: 3, h: 2, color: "#e7c48a" },
  { x: 360, y: 226, w: 3, h: 2, color: "#e7c48a" },
  { x: 760, y: 220, w: 3, h: 2, color: "#e7c48a" },
  { x: 900, y: 226, w: 3, h: 2, color: "#e7c48a" },
  { x: 1040, y: 220, w: 3, h: 2, color: "#e7c48a" },
] as const;

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

export function isNorthPathStone(pixel: { x: number; y: number; w: number; h: number; color: string }) {
  return NORTH_PATH_STONES.some(
    (stone) =>
      stone.x === pixel.x &&
      stone.y === pixel.y &&
      stone.w === pixel.w &&
      stone.h === pixel.h &&
      stone.color === pixel.color,
  );
}

/** Same portrait test as narrowFillCamera. 390×596 is narrow; a wide map is not. */
export function nightHearthHidesStones(cssW: number, cssH: number) {
  return portraitMap(cssW, cssH);
}

export function nightHearthDrawPixels(
  night: boolean,
  cssW: number,
  cssH: number,
  enabled = NIGHT_HEARTH_ENABLED,
): readonly Pixel[] {
  const pixels = nightHearthPixels(night, enabled);
  if (!nightHearthHidesStones(cssW, cssH)) return pixels;
  return pixels.filter((pixel) => !isNorthPathStone(pixel));
}

type Cam = {
  viewW: number;
  viewH: number;
  camX: number;
  camY: number;
  worldW: number;
  worldH: number;
  /** CSS size of the map. Falls back to view size when omitted. */
  cssW?: number;
  cssH?: number;
};

/** Still warm marks after the night veil. Reduced motion uses the same pixels. */
export function paintNightHearth(
  ctx: CanvasRenderingContext2D,
  input: Cam & { night: boolean; reduced: boolean },
) {
  void input.reduced;
  const cssW = input.cssW ?? input.viewW;
  const cssH = input.cssH ?? input.viewH;
  const pixels = nightHearthDrawPixels(input.night, cssW, cssH);
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
