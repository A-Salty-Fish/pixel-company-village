/**
 * LANDMARK_SETTLE — arriving at a landmark eases the camera to rest.
 * Zoom locks once so a 390-wide map does not rescale every frame.
 * On that narrow width the pan stays on whole pixels.
 * Quiet mode and reduced motion snap to the settled frame at once.
 * Set LANDMARK_SETTLE_ENABLED to false to snap the old way.
 */

import { microMotionStill } from "@/features/micro-still/micro-still";

export const LANDMARK_SETTLE_ENABLED = true;
export const LANDMARK_SETTLE_MS = 440;
/** Phone width the map room already treats as the narrow layout. */
export const NARROW_SETTLE_WIDTH = 390;

export type LandmarkSettleMode = "ease" | "still" | "off";

export function landmarkSettleMode(input: { quiet: boolean; reduced?: boolean; enabled?: boolean }): LandmarkSettleMode {
  const enabled = input.enabled ?? LANDMARK_SETTLE_ENABLED;
  if (!enabled) return "off";
  if (microMotionStill(input.quiet, input.reduced)) return "still";
  return "ease";
}

export function landmarkSettleNarrow(width: number) {
  return Number.isFinite(width) && width > 0 && width <= NARROW_SETTLE_WIDTH;
}

/** Smoothstep. Soft at both ends so a short phone frame does not leap. */
export function landmarkSettleEase(t: number) {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 1));
  return x * x * (3 - 2 * x);
}

export function landmarkSettleFrame(input: {
  elapsedMs: number;
  narrow: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  durationMs?: number;
}) {
  const duration = input.durationMs ?? LANDMARK_SETTLE_MS;
  const t = landmarkSettleEase(duration <= 0 ? 1 : input.elapsedMs / duration);
  let x = input.from.x + (input.to.x - input.from.x) * t;
  let y = input.from.y + (input.to.y - input.from.y) * t;
  if (input.narrow) {
    x = Math.round(x);
    y = Math.round(y);
  }
  const done = !Number.isFinite(input.elapsedMs) || input.elapsedMs >= duration;
  return {
    x: done ? input.to.x : x,
    y: done ? input.to.y : y,
    done,
  };
}
