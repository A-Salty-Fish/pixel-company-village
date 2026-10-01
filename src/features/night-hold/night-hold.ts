/**
 * PV-PM-065 — the first leave attempt at night shows one soft line.
 * Skip it and the leave continues. The date stamp stops a second bubble that night.
 * Set NIGHT_HOLD_ENABLED to false to leave the way the daytime exit does.
 */

export const NIGHT_HOLD_ENABLED = true;
export const NIGHT_HOLD_KEY = "village:night-hold-v1";
export const NIGHT_HOLD_LINE = "路上慢点";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function readStoredYmd(raw: string | null) {
  if (!raw || !YMD.test(raw)) return null;
  return raw;
}

export function nightHoldOffer(input: { night: boolean; storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? NIGHT_HOLD_ENABLED;
  if (!enabled || !input.night || !YMD.test(input.today)) return false;
  return readStoredYmd(input.storedYmd) !== input.today;
}

export function loadNightHold() {
  if (typeof localStorage === "undefined") return null;
  try {
    return readStoredYmd(localStorage.getItem(NIGHT_HOLD_KEY));
  } catch {
    return null;
  }
}

export function saveNightHold(ymd: string) {
  if (!NIGHT_HOLD_ENABLED || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NIGHT_HOLD_KEY, ymd);
  } catch {
    /* private mode */
  }
}

export function nightHoldCopy() {
  return [NIGHT_HOLD_LINE, "还是走", "再待"];
}
