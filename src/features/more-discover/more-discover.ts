/**
 * PV-PM-048 — one cue on 更多 after the map is ready.
 * Pulse lights the whole button. Reduced motion keeps a still dot.
 * Opening 更多 or ~8s clears it.
 * The mark is the single character "1" on this browser, so the next visit stays quiet.
 * Set MORE_DISCOVER_ENABLED to false to leave 更多 unmarked.
 */

import { NARROW_CHROME_MAX_PX } from "@/features/narrow-chrome/narrow-chrome";

export const MORE_DISCOVER_ENABLED = true;
export const MORE_DISCOVER_KEY = "village:more-discover-v1";
export const MORE_DISCOVER_MS = 8_000;

export type MoreCue = "pulse" | "dot" | "off";

export function moreDiscoverStored() {
  return "1" as const;
}

export function moreCueMode(input: {
  stored: string | null;
  width: number;
  mapReady: boolean;
  opened: boolean;
  elapsedMs: number;
  reduceMotion: boolean;
  enabled?: boolean;
  maxPx?: number;
}): MoreCue {
  const enabled = input.enabled ?? MORE_DISCOVER_ENABLED;
  const max = input.maxPx ?? NARROW_CHROME_MAX_PX;
  if (!enabled || !input.mapReady || input.opened) return "off";
  if (input.stored === moreDiscoverStored()) return "off";
  if (!Number.isFinite(input.width) || input.width > max) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= MORE_DISCOVER_MS) return "off";
  return input.reduceMotion ? "dot" : "pulse";
}
