/**
 * PV-PM-076 — a tap on a person is a short hop and a puff of dust.
 * It ends within 200ms and does not hold the map. The signal card is separate.
 * Set VILLAGER_TAP_FEEDBACK_ENABLED to false to leave the sprite still.
 */

import type { Pixel } from "@/lib/worldcraft";

export const VILLAGER_TAP_FEEDBACK_ENABLED = true;
export const TAP_FEEDBACK_MS = 200;

export type TapMark = "bounce" | "dust" | "off";

export function tapFeedbackOn(enabled = VILLAGER_TAP_FEEDBACK_ENABLED) {
  return enabled;
}

export function tapFeedbackMark(input: { elapsedMs: number; reduced: boolean; enabled?: boolean }): TapMark {
  const enabled = input.enabled ?? VILLAGER_TAP_FEEDBACK_ENABLED;
  if (!enabled) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= TAP_FEEDBACK_MS) return "off";
  return input.reduced ? "dust" : "bounce";
}

/** Pixel hop. Reduced motion stays on the ground and only shows dust. */
export function tapHop(elapsedMs: number, reduced: boolean, enabled = VILLAGER_TAP_FEEDBACK_ENABLED) {
  if (tapFeedbackMark({ elapsedMs, reduced, enabled }) !== "bounce") return 0;
  const t = elapsedMs / TAP_FEEDBACK_MS;
  return Math.max(0, Math.round(Math.sin(t * Math.PI) * 2));
}

export function tapDustPixels(
  x: number,
  y: number,
  elapsedMs: number,
  reduced: boolean,
  enabled = VILLAGER_TAP_FEEDBACK_ENABLED,
): Pixel[] {
  const mark = tapFeedbackMark({ elapsedMs, reduced, enabled });
  if (mark === "off") return [];
  const rise = mark === "bounce" ? tapHop(elapsedMs, false, enabled) : 0;
  return [
    { x: Math.round(x - 6), y: Math.round(y - rise), w: 2, h: 2, color: "#e7c48a" },
    { x: Math.round(x + 4), y: Math.round(y - 1 - rise), w: 2, h: 2, color: "#c4a060" },
    { x: Math.round(x - 1), y: Math.round(y + 1), w: 3, h: 2, color: "#f2d15c" },
  ];
}
