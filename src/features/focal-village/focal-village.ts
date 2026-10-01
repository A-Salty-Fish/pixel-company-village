/**
 * PV-D-025 — the first look is the farm, not a sky bar or a floating header.
 * Night wash stays the other module's job.
 * Set FOCAL_VILLAGE_ENABLED to false to bring the sky stripe back.
 */

export const FOCAL_VILLAGE_ENABLED = true;

export function focalVillageMark(enabled = FOCAL_VILLAGE_ENABLED): "village" | "chrome" {
  return enabled ? "village" : "chrome";
}
