/**
 * WAVE_GIFT — the wave button shows a clearer press, and the neighbor receipt
 * arrives like a small gift: a short wait, a soft open, a hold, then a fade.
 * The canned line is unchanged. Quiet mode and reduced motion show that line
 * at rest immediately, with no wait and no fade.
 * Set WAVE_GIFT_ENABLED to false to keep the old toast timing.
 */

import { microMotionStill } from "@/features/micro-still/micro-still";

export const WAVE_GIFT_ENABLED = true;

/** Hand-off before the line is drawn. Skipped when motion is still. */
export const WAVE_GIFT_DELAY_MS = 180;
export const WAVE_GIFT_OPEN_MS = 260;
export const WAVE_GIFT_HOLD_MS = 1500;
export const WAVE_GIFT_FADE_MS = 420;

export const WAVE_GIFT_MOTION_MS = WAVE_GIFT_DELAY_MS + WAVE_GIFT_OPEN_MS + WAVE_GIFT_HOLD_MS + WAVE_GIFT_FADE_MS;

export type WaveGiftPhase = "wait" | "open" | "hold" | "fade" | "still" | "off";

export function waveGiftOn(enabled = WAVE_GIFT_ENABLED) {
  return enabled;
}

export function waveGiftPhase(elapsedMs: number, still: boolean, enabled = WAVE_GIFT_ENABLED): WaveGiftPhase {
  if (!enabled) return "off";
  if (microMotionStill(still)) return Number.isFinite(elapsedMs) ? "still" : "off";
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "off";
  if (elapsedMs < WAVE_GIFT_DELAY_MS) return "wait";
  const openEnd = WAVE_GIFT_DELAY_MS + WAVE_GIFT_OPEN_MS;
  if (elapsedMs < openEnd) return "open";
  const holdEnd = openEnd + WAVE_GIFT_HOLD_MS;
  if (elapsedMs < holdEnd) return "hold";
  if (elapsedMs < WAVE_GIFT_MOTION_MS) return "fade";
  return "off";
}

/** The line is on screen. Wait and off stay hidden so it does not pop like a toast. */
export function waveGiftVisible(phase: WaveGiftPhase, enabled = WAVE_GIFT_ENABLED) {
  if (!enabled) return true;
  return phase === "open" || phase === "hold" || phase === "fade" || phase === "still";
}

export function wavePressMark(down: boolean, enabled = WAVE_GIFT_ENABLED): "down" | "up" | "off" {
  if (!enabled) return "off";
  return down ? "down" : "up";
}
