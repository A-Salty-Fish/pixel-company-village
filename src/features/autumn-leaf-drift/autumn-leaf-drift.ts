/**
 * PV-PM-038 — a few autumn leaves drift along the path tiles.
 * Map paint only. No HUD sentence.
 * Set AUTUMN_LEAF_DRIFT_ENABLED to false to clear the paths.
 */

import type { Pixel } from "@/lib/worldcraft";

export const AUTUMN_LEAF_DRIFT_ENABLED = true;
export const LEAF_COUNT = 5;

const PATHS: ReadonlyArray<{ x: number; y: number; phase: number }> = [
  { x: 180, y: 220, phase: 0.2 },
  { x: 460, y: 228, phase: 1.1 },
  { x: 820, y: 216, phase: 2.2 },
  { x: 320, y: 652, phase: 0.7 },
  { x: 740, y: 660, phase: 1.7 },
];

export function leafDriftOn(seasonId: string, enabled = AUTUMN_LEAF_DRIFT_ENABLED) {
  return enabled && seasonId === "autumn";
}

export function leafDriftMark(seasonId: string, reduced: boolean, enabled = AUTUMN_LEAF_DRIFT_ENABLED): "drift" | "still" | "off" {
  if (!leafDriftOn(seasonId, enabled)) return "off";
  return reduced ? "still" : "drift";
}

/** Path pixels. Reduced motion holds each leaf where it was drawn. */
export function autumnLeafFrame(seasonId: string, reduced: boolean, t: number, enabled = AUTUMN_LEAF_DRIFT_ENABLED): Pixel[] {
  if (!leafDriftOn(seasonId, enabled)) return [];
  const pixels: Pixel[] = [];
  for (const leaf of PATHS) {
    const drift = reduced ? 0 : Math.round(Math.sin(t * 0.45 + leaf.phase) * 5);
    const bob = reduced ? 0 : Math.round(Math.sin(t * 0.3 + leaf.phase) * 2);
    const x = leaf.x + drift;
    const y = leaf.y + bob;
    pixels.push(
      { x, y, w: 4, h: 2, color: "#d46a32" },
      { x: x + 3, y: y - 1, w: 2, h: 2, color: "#8a3a28" },
    );
  }
  return pixels;
}

export function autumnLeafCount(seasonId: string, enabled = AUTUMN_LEAF_DRIFT_ENABLED) {
  if (!leafDriftOn(seasonId, enabled)) return 0;
  return LEAF_COUNT;
}
