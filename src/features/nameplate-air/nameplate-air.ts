/**
 * v1.6.2 — nameplates breathe a pixel and far plates sit quieter.
 * Self and pinned plates stay fully readable.
 * Set NAMEPLATE_AIR_ENABLED to false to pack glyphs the old way.
 */

import type { PlateRole } from "@/features/nameplate-clear/nameplate-clear";

export const NAMEPLATE_AIR_ENABLED = true;
export const NAMEPLATE_TRACK_PX = 1;

export function nameplateTrack(enabled = NAMEPLATE_AIR_ENABLED) {
  return enabled ? NAMEPLATE_TRACK_PX : 0;
}

/** Far plates fade a little more so the near names stay the ones you read. */
export function nameplateAirAlpha(role: PlateRole, enabled = NAMEPLATE_AIR_ENABLED) {
  if (!enabled) return 1;
  if (role === "self" || role === "pinned") return 1;
  if (role === "neighbor") return 0.92;
  if (role === "scored") return 0.84;
  return 0.72;
}

export function shortPlateAlpha(base: number, enabled = NAMEPLATE_AIR_ENABLED) {
  if (!enabled) return base;
  return base * 0.82;
}
