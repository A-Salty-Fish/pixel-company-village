/**
 * kindness-footprint-glow — a soft halo around a local bond stake.
 * The player can point at it on the map without opening the card.
 * Set KINDNESS_FOOTPRINT_GLOW_ENABLED to false to keep only the stake.
 */

import type { Pixel } from "@/lib/worldcraft";

export const KINDNESS_FOOTPRINT_GLOW_ENABLED = true;

export function kindnessGlowMark(count: number, enabled = KINDNESS_FOOTPRINT_GLOW_ENABLED): "soft" | "off" {
  if (!enabled || count < 1) return "off";
  return "soft";
}

/** Halo around the stake at the person's feet. No copy, no stored names. */
export function kindnessGlowPixels(x: number, y: number, enabled = KINDNESS_FOOTPRINT_GLOW_ENABLED): Pixel[] {
  if (!enabled) return [];
  const left = Math.round(x);
  const top = Math.round(y);
  return [
    { x: left + 6, y: top - 18, w: 15, h: 14, color: "rgba(242, 209, 92, 0.22)" },
    { x: left + 9, y: top - 15, w: 9, h: 8, color: "rgba(255, 246, 216, 0.2)" },
  ];
}
