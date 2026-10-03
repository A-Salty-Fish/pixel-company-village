/**
 * PV-PM-123 — the map more sheet yields to the first-run strip.
 * The three added buttons stay in their own stack. PV-PM-115 is unchanged.
 * Set SHEET_YIELDS_ENABLED to false to leave the sheet on the lower edge.
 */

export const SHEET_YIELDS_ENABLED = true;

export function sheetYieldsOn(enabled = SHEET_YIELDS_ENABLED) {
  return enabled;
}

export function sheetYieldsMark(enabled = SHEET_YIELDS_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** While the strip is open, the sheet sits above it instead of across it. */
export function sheetYieldsToStrip(guideOpen: boolean, enabled = SHEET_YIELDS_ENABLED) {
  return enabled && guideOpen;
}
