/**
 * PV-PM-050 — one canned dusk chip that can open the lantern.
 * Day and night do not grow this cue. A session shows it at most once.
 * Set DUSK_LANTERN_ENABLED to false to leave the evening map unmarked.
 */

import { lightLabel } from "@/lib/copy";

export const DUSK_LANTERN_ENABLED = true;
export const DUSK_LANTERN_LINE = "灯笼该亮了";

export function duskLanternOffer(input: { hour: number; alreadyShown: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? DUSK_LANTERN_ENABLED;
  if (!enabled || input.alreadyShown) return false;
  return lightLabel(input.hour) === "傍晚";
}

export function duskLanternCopy() {
  return [DUSK_LANTERN_LINE];
}
