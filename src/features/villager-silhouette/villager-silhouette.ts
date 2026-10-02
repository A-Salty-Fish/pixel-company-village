/**
 * PV-PM-095 — a broken ink rim and a short grass shadow so a cat
 * separates from the meadow. Not a sticker box. The idle bob stays
 * on villager-read. Reduced motion uses the same pixels.
 * Set SILHOUETTE_RIM_ENABLED to false to leave the earlier shadow.
 */

import type { Pixel } from "@/lib/worldcraft";

export const SILHOUETTE_RIM_ENABLED = true;

const INK = "rgba(36, 22, 12, 0.7)";
const SHADE = "rgba(20, 32, 14, 0.34)";

export function villagerSilhouetteOn(enabled = SILHOUETTE_RIM_ENABLED) {
  return enabled;
}

export function villagerSilhouetteMark(enabled = SILHOUETTE_RIM_ENABLED): "rim" | "off" {
  return enabled ? "rim" : "off";
}

/** Feet sit on y. The rim is outside the cat's opaque pixels, with a gap on the face. */
export function villagerSilhouettePixels(x: number, y: number, enabled = SILHOUETTE_RIM_ENABLED): Pixel[] {
  if (!villagerSilhouetteOn(enabled)) return [];
  const left = Math.round(x);
  const foot = Math.round(y);
  return [
    { x: left - 14, y: foot + 1, w: 28, h: 2, color: SHADE },
    { x: left - 13, y: foot - 36, w: 1, h: 5, color: INK },
    { x: left + 12, y: foot - 36, w: 1, h: 5, color: INK },
    { x: left - 14, y: foot - 24, w: 1, h: 8, color: INK },
    { x: left + 13, y: foot - 24, w: 1, h: 8, color: INK },
    { x: left - 11, y: foot - 38, w: 5, h: 1, color: INK },
    { x: left + 6, y: foot - 38, w: 5, h: 1, color: INK },
  ];
}
