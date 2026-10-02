/**
 * PV-PM-070 — a soft contact shadow and a short ink rim, not a sticker box.
 * The idle bob stays on villager-read. Reduced motion keeps the same pixels.
 * Set VILLAGER_GROUND_ENABLED to false to fall back to the oval shadow.
 */

import type { Pixel } from "@/lib/worldcraft";

export const VILLAGER_GROUND_ENABLED = true;

const SHADE = "rgba(42, 28, 16, 0.2)";
const SHADE_MID = "rgba(42, 28, 16, 0.12)";
const SHADE_EDGE = "rgba(42, 28, 16, 0.07)";
const RIM = "rgba(42, 26, 16, 0.72)";

export function villagerGroundOn(enabled = VILLAGER_GROUND_ENABLED) {
  return enabled;
}

export function villagerGroundMark(enabled = VILLAGER_GROUND_ENABLED): "soft" | "hard" {
  return enabled ? "soft" : "hard";
}

/** Feet sit on y. The rim follows the cat sprite, just outside the ears and sleeves. */
export function villagerGroundPixels(x: number, y: number, enabled = VILLAGER_GROUND_ENABLED): Pixel[] {
  if (!villagerGroundOn(enabled)) return [];
  const left = Math.round(x);
  const foot = Math.round(y);
  return [
    { x: left - 16, y: foot - 1, w: 32, h: 2, color: SHADE },
    { x: left - 11, y: foot + 1, w: 22, h: 2, color: SHADE_MID },
    { x: left - 6, y: foot + 3, w: 12, h: 1, color: SHADE_EDGE },
    { x: left - 12, y: foot - 36, w: 2, h: 3, color: RIM },
    { x: left + 10, y: foot - 36, w: 2, h: 3, color: RIM },
    { x: left - 13, y: foot - 14, w: 1, h: 6, color: RIM },
    { x: left + 12, y: foot - 16, w: 1, h: 6, color: RIM },
  ];
}
