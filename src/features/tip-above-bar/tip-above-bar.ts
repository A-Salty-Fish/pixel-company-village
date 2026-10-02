/**
 * PV-PM-109 — the first-visit sentence sits above the bottom bar.
 * Set the flag false to leave the tip in normal flow.
 */

export const TIP_ABOVE_BAR_ENABLED = true;
export const TIP_BAR_GAP_PX = 8;

export function tipAboveBarOn(enabled = TIP_ABOVE_BAR_ENABLED) {
  return enabled;
}

export function tipAboveBarMark(enabled = TIP_ABOVE_BAR_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** The tip's bottom edge clears the bar's top by at least `gap` pixels. */
export function tipClearsBar(tipBottom: number, barTop: number, gap = TIP_BAR_GAP_PX) {
  if (!Number.isFinite(tipBottom) || !Number.isFinite(barTop)) return false;
  return barTop - tipBottom >= gap;
}
