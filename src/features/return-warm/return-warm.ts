/**
 * PV-PM-054 — a short canned line when the same person comes back on a later day.
 * Same-day reloads stay quiet. First visit has no previous day, so it only stores today.
 * Set RETURN_WARM_ENABLED to false to skip the line and the stored day.
 */

export const RETURN_WARM_ENABLED = true;
export const RETURN_WARM_PREFIX = "village:return-warm-v1:";
export const RETURN_WARM_MS = 10_000;

export const RETURN_WARM_LINES = ["又回来了。", "村里还在。", "屋檐还认你。"] as const;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function returnWarmKey(name: string) {
  return `${RETURN_WARM_PREFIX}${name}`;
}

export function readStoredYmd(raw: string | null) {
  if (!raw || !YMD.test(raw)) return null;
  return raw;
}

export function returnWarmOffer(input: { storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? RETURN_WARM_ENABLED;
  if (!enabled) return false;
  const stored = readStoredYmd(input.storedYmd);
  if (!stored || !YMD.test(input.today)) return false;
  return stored !== input.today;
}

function salt(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export function returnWarmLine(name: string, ymd: string) {
  const index = salt(`${name}:${ymd}`) % RETURN_WARM_LINES.length;
  return RETURN_WARM_LINES[index] ?? RETURN_WARM_LINES[0];
}

export function loadReturnVisit(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    return readStoredYmd(localStorage.getItem(returnWarmKey(name)));
  } catch {
    return null;
  }
}

export function saveReturnVisit(name: string, ymd: string) {
  if (!name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(returnWarmKey(name), ymd);
  } catch {
    /* private mode */
  }
}

/** One map line. Return wins, then dusk, dawn, and night. */
export function pickLineCue(input: { returnWarm: boolean; dusk: boolean; dawn: boolean; night: boolean }) {
  if (input.returnWarm) return "return" as const;
  if (input.dusk) return "dusk" as const;
  if (input.dawn) return "dawn" as const;
  if (input.night) return "night" as const;
  return null;
}

export function returnWarmCopy() {
  return [...RETURN_WARM_LINES];
}
