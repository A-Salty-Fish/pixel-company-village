/**
 * PV-PM-041 / PV-PM-044 / PV-PM-047 — fold the header and the ritual trio
 * through tablet widths. Desktop stays above NARROW_CHROME_MAX_PX.
 * The matching CSS query is max-width: 900px. Keep the two numbers equal.
 * Set NARROW_CHROME_ENABLED to false to put the three badges back on the page.
 */

export const NARROW_CHROME_ENABLED = true;
export const NARROW_CHROME_MAX_PX = 900;
export const TODAY_ROW_MAX_PX = 48;

export function todayEntryLabel(done: number, total: number, weekOn: boolean) {
  if (!weekOn) return "今日";
  const safeDone = Math.max(0, Math.floor(done));
  const safeTotal = Math.max(0, Math.floor(total));
  return `今日 · 周事 ${safeDone}/${safeTotal}`;
}

/** True when the trio should be inside the 今日 sheet instead of the first screen. */
export function ritualTrioFolded(width: number, enabled = NARROW_CHROME_ENABLED) {
  return enabled && width <= NARROW_CHROME_MAX_PX;
}

export function todayRowFits(height: number, max = TODAY_ROW_MAX_PX) {
  return height > 0 && height <= max;
}
