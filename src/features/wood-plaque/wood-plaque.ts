/**
 * PV-D-024 — panels, chips, and the update log read as cut wood.
 * Square corners, a top lip, and a grain. Ink stays dark.
 * Set WOOD_PLAQUE_ENABLED to false to leave the flat panels.
 */

export const WOOD_PLAQUE_ENABLED = true;

export function woodPlaqueMark(enabled = WOOD_PLAQUE_ENABLED): "plaque" | "flat" {
  return enabled ? "plaque" : "flat";
}
