/**
 * CARD_OPEN_SQUASH — opening a person card squashes the top edge, then bounces back.
 * The whole feel stays inside 40–80ms. Quiet mode and reduced motion hold still.
 * Set CARD_OPEN_SQUASH_ENABLED to false to open the card flat.
 */

import { microMotionStill } from "@/features/micro-still/micro-still";

export const CARD_OPEN_SQUASH_ENABLED = true;
/** Inside the 40–80ms window. One short squash, then the edge is back. */
export const CARD_SQUASH_MS = 64;

export type CardSquashMark = "squash" | "still" | "off";

export function cardSquashOn(enabled = CARD_OPEN_SQUASH_ENABLED) {
  return enabled;
}

export function cardSquashMark(input: {
  elapsedMs: number;
  quiet: boolean;
  reduced?: boolean;
  enabled?: boolean;
}): CardSquashMark {
  const enabled = input.enabled ?? CARD_OPEN_SQUASH_ENABLED;
  if (!enabled) return "off";
  if (microMotionStill(input.quiet, input.reduced)) return "still";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= CARD_SQUASH_MS) return "off";
  return "squash";
}

/**
 * Vertical scale of the card edge. 1 is rest.
 * Quiet, reduced, finished, and the flag off all stay at 1 — no leftover squash.
 */
export function cardEdgeScale(elapsedMs: number, quiet: boolean, reduced = false, enabled = CARD_OPEN_SQUASH_ENABLED) {
  if (cardSquashMark({ elapsedMs, quiet, reduced, enabled }) !== "squash") return 1;
  const t = elapsedMs / CARD_SQUASH_MS;
  const wave = Math.sin(t * Math.PI);
  const dip = t < 0.5 ? wave : -wave * 0.35;
  return 1 - dip * 0.06;
}
