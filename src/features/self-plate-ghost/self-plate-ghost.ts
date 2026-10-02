/**
 * PV-PM-091 — the yellow corner brackets under the caller's plate are not painted.
 * Find-me, go-home, and idle all stay clear. Neighbor plates are not touched.
 * Set SELF_PLATE_GHOST_ENABLED to false to put the brackets back.
 */

import { findMeRing, type Pixel } from "@/lib/worldcraft";

export const SELF_PLATE_GHOST_ENABLED = true;

export function selfGhostOn(enabled = SELF_PLATE_GHOST_ENABLED) {
  return enabled;
}

/** True when the self bracket is kept off the plate. */
export function selfGhostSuppressed(enabled = SELF_PLATE_GHOST_ENABLED) {
  return enabled;
}

/**
 * Pixels drawn on the caller only. Empty while the fix is on,
 * including the second gold ring that used to stack on find-me.
 */
export function selfBracketPixels(
  x: number,
  y: number,
  reduced: boolean,
  t: number,
  highlight: boolean,
  enabled = SELF_PLATE_GHOST_ENABLED,
): Pixel[] {
  if (enabled) return [];
  const base = findMeRing(x, y, reduced, t);
  if (!highlight) return base;
  const gold = findMeRing(x, y, true, 0).map((pixel) => ({ ...pixel, color: "#f2d15c" }));
  return base.concat(gold);
}
