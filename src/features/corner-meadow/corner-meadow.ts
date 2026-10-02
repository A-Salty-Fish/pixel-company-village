/**
 * PV-PM-077 — two to four weed and pebble clusters in empty corners.
 * They stay off the roads, off the crossing, and off villager tap boxes.
 * Reduced motion holds the blades still.
 * Set CORNER_MEADOW_ENABLED to false to leave the corners bare.
 */

import type { Pixel } from "@/lib/worldcraft";

export const CORNER_MEADOW_ENABLED = true;

const BLADE = "#3f7a3a";
const TIP = "#8fbf6a";
const PEBBLE = "#6a5340";

const CLUSTERS = [
  { x: 4, y: 40, phase: 0.2 },
  { x: 1196, y: 28, phase: 1.1 },
  { x: 6, y: 1092, phase: 2.0 },
  { x: 1202, y: 1104, phase: 0.7 },
] as const;

const TILE = 16;
const COLS = 76;
const ROWS = 70;

export function cornerMeadowOn(enabled = CORNER_MEADOW_ENABLED) {
  return enabled;
}

export function cornerMeadowMark(reduced: boolean, enabled = CORNER_MEADOW_ENABLED): "sway" | "still" | "off" {
  if (!cornerMeadowOn(enabled)) return "off";
  return reduced ? "still" : "sway";
}

export function cornerMeadowAnchors(enabled = CORNER_MEADOW_ENABLED) {
  return enabled ? CLUSTERS : [];
}

/** True on a path tile, including the north road, the lane, and the south road. */
export function cornerOnRoad(x: number, y: number) {
  const c = Math.floor(x / TILE);
  const r = Math.floor(y / TILE);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  if (r >= 13 && r <= 14) return true;
  if (c >= 37 && c <= 38 && r >= 13 && r <= ROWS - 2) return true;
  if (r >= 40 && r <= 41 && c >= 2 && c <= COLS - 3) return true;
  return false;
}

/** Pond tiles plus the sand skirt. Corners stay on grass. */
export function cornerOnWater(x: number, y: number) {
  const c = Math.floor(x / TILE);
  const r = Math.floor(y / TILE);
  return c >= 1 && c <= 14 && r >= 1 && r <= 8;
}

export function cornerMeadowPixels(reduced: boolean, t: number, enabled = CORNER_MEADOW_ENABLED): Pixel[] {
  if (!cornerMeadowOn(enabled)) return [];
  const pixels: Pixel[] = [];
  for (const cluster of CLUSTERS) {
    const lean = reduced ? 0 : Math.round(Math.sin(t * 0.55 + cluster.phase));
    pixels.push(
      { x: cluster.x, y: cluster.y, w: 1, h: 5, color: BLADE },
      { x: cluster.x + 2 + lean, y: cluster.y - 1, w: 1, h: 4, color: TIP },
      { x: cluster.x + 5, y: cluster.y + 4, w: 2, h: 2, color: PEBBLE },
    );
  }
  return pixels;
}

export function cornerMeadowCount(reduced: boolean, t = 0, enabled = CORNER_MEADOW_ENABLED) {
  return cornerMeadowPixels(reduced, t, enabled).length;
}
