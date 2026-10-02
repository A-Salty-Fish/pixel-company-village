/**
 * PV-PM-071 — panels and buttons read as warm cut wood.
 * Ink stays #2a1a10 / #fff6d8. Square corners stay with the wood plaque.
 * Set WARM_PLAQUE_ENABLED to false to leave the greener buttons.
 */

export const WARM_PLAQUE_ENABLED = true;

export function warmPlaqueMark(enabled = WARM_PLAQUE_ENABLED): "warm" | "flat" {
  return enabled ? "warm" : "flat";
}
