/**
 * PV-PM-061 — a soft top-bar chip when the same person returns on the same local day.
 * The first visit of the day only stores the date. Later loads that day show 「又见面了」.
 * Storage is the calendar date only. No chat text.
 * Set SAME_DAY_AGAIN_ENABLED to false to skip the chip and the stored day.
 */

export const SAME_DAY_AGAIN_ENABLED = true;
export const SAME_DAY_AGAIN_PREFIX = "village:same-day-v1:";
export const SAME_DAY_AGAIN_MS = 1_800;
export const SAME_DAY_AGAIN_LINE = "又见面了";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const claimed = new Map<string, boolean>();

export function sameDayKey(name: string) {
  return `${SAME_DAY_AGAIN_PREFIX}${name}`;
}

export function readStoredYmd(raw: string | null) {
  if (!raw || !YMD.test(raw)) return null;
  return raw;
}

export function sameDayOffer(input: { storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? SAME_DAY_AGAIN_ENABLED;
  if (!enabled) return false;
  const stored = readStoredYmd(input.storedYmd);
  if (!stored || !YMD.test(input.today)) return false;
  return stored === input.today;
}

export function loadSameDay(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    return readStoredYmd(localStorage.getItem(sameDayKey(name)));
  } catch {
    return null;
  }
}

export function saveSameDay(name: string, ymd: string) {
  if (!name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(sameDayKey(name), ymd);
  } catch {
    /* private mode */
  }
}

/**
 * One decision per name and day for this page load.
 * A second call returns the same answer, so a remount does not restamp the visit.
 */
export function claimSameDayVisit(name: string, today: string, enabled = SAME_DAY_AGAIN_ENABLED) {
  if (!enabled || !name || !YMD.test(today)) return false;
  const key = `${name}:${today}`;
  const prior = claimed.get(key);
  if (prior !== undefined) return prior;
  const show = sameDayOffer({ storedYmd: loadSameDay(name), today, enabled });
  saveSameDay(name, today);
  claimed.set(key, show);
  return show;
}

export function sameDayCopy() {
  return [SAME_DAY_AGAIN_LINE];
}
