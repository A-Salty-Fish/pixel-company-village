/**
 * PV-PM-073 — for the first half-minute the eye lands on the north-path crossing.
 * A short run of warm stones, then nothing. Reduced motion holds them still.
 * The phone camera is unchanged. Set PATH_FOCUS_ENABLED to false to skip it.
 */

import type { Pixel } from "@/lib/worldcraft";

export const PATH_FOCUS_ENABLED = true;
export const PATH_FOCUS_MS = 30_000;

/** Where the north road meets the lane into the fields. */
export const PATH_FOCUS = { x: 608, y: 224 };

const STILL = "#f2d15c";
const HIGH = "#fff1a8";
const LOW = "#e7b14a";

const OFFSETS = [
  { dx: -72, dy: -2, w: 4, h: 3 },
  { dx: -40, dy: 4, w: 4, h: 3 },
  { dx: -8, dy: -2, w: 6, h: 3 },
  { dx: 28, dy: 4, w: 4, h: 3 },
  { dx: 60, dy: -2, w: 4, h: 3 },
  { dx: 0, dy: 28, w: 4, h: 3 },
  { dx: 0, dy: 52, w: 4, h: 3 },
] as const;

export type PathFocus = "pulse" | "still" | "off";

export function pathFocusOn(enabled = PATH_FOCUS_ENABLED) {
  return enabled;
}

export function pathFocusMark(input: { elapsedMs: number; reduced: boolean; enabled?: boolean }): PathFocus {
  const enabled = input.enabled ?? PATH_FOCUS_ENABLED;
  if (!enabled) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= PATH_FOCUS_MS) return "off";
  return input.reduced ? "still" : "pulse";
}

export function pathFocusPixels(mode: PathFocus, t: number, enabled = PATH_FOCUS_ENABLED): Pixel[] {
  if (!enabled || mode === "off") return [];
  const hot = mode === "pulse" && Math.sin(t * 1.6) > 0;
  const stone = mode === "still" ? STILL : hot ? HIGH : LOW;
  const spark = mode === "still" ? "#fff6d8" : hot ? "#fff6d8" : "#c4a060";
  return OFFSETS.flatMap((spot) => [
    { x: PATH_FOCUS.x + spot.dx, y: PATH_FOCUS.y + spot.dy, w: spot.w, h: spot.h, color: stone },
    {
      x: PATH_FOCUS.x + spot.dx + 1,
      y: PATH_FOCUS.y + spot.dy,
      w: 1,
      h: 1,
      color: spark,
    },
  ]);
}

export function pathFocusCount(mode: PathFocus, enabled = PATH_FOCUS_ENABLED) {
  return pathFocusPixels(mode, 0, enabled).length;
}
