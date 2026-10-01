/**
 * PV-PM-061 — a soft header chip when the same local day is opened again.
 * The only stored value is a date stamp. No chat text.
 * Set AGAIN_TODAY_ENABLED to false to skip the chip and the stamp.
 */

export const AGAIN_TODAY_ENABLED = true;
export const AGAIN_TODAY_KEY = "village:again-today-v1";
export const AGAIN_TODAY_MS = 2_000;
export const AGAIN_TODAY_LINE = "又见面了";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** One decision per calendar day for this document, so a strict remount does not flip the chip. */
let visitCache: { today: string; show: boolean } | null = null;

export function resetAgainTodayVisit() {
  visitCache = null;
}

export function readStoredYmd(raw: string | null) {
  if (!raw || !YMD.test(raw)) return null;
  return raw;
}

export function againTodayOffer(input: { storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? AGAIN_TODAY_ENABLED;
  if (!enabled || !YMD.test(input.today)) return false;
  const stored = readStoredYmd(input.storedYmd);
  return stored === input.today;
}

export function againTodayVisit(today: string, stored: string | null) {
  if (!AGAIN_TODAY_ENABLED) return false;
  if (visitCache?.today === today) return visitCache.show;
  const show = againTodayOffer({ storedYmd: stored, today });
  visitCache = { today, show };
  return show;
}

export function loadAgainToday() {
  if (typeof localStorage === "undefined") return null;
  try {
    return readStoredYmd(localStorage.getItem(AGAIN_TODAY_KEY));
  } catch {
    return null;
  }
}

export function saveAgainToday(ymd: string) {
  if (!AGAIN_TODAY_ENABLED || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AGAIN_TODAY_KEY, ymd);
  } catch {
    /* private mode */
  }
}

export function againTodayCopy() {
  return [AGAIN_TODAY_LINE];
}
