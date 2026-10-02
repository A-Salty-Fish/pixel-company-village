/**
 * PV-PM-107 — after the log is opened, or on the second cold start,
 * the header keeps the village name. The ship title stays on the log.
 * Set the flag false to keep the title beside the name.
 */

export const SLOGAN_REST_ENABLED = true;
export const SLOGAN_SEEN_KEY = "village:release-seen-v1";
export const COLD_START_KEY = "village:cold-start-v1";

export function sloganRestOn(enabled = SLOGAN_REST_ENABLED) {
  return enabled;
}

export function applyColdStart(previous: number, alreadyNoted: boolean) {
  const prev = Number.isFinite(previous) && previous > 0 ? Math.floor(previous) : 0;
  if (alreadyNoted) return prev;
  return prev + 1;
}

export function sloganShouldRest(input: { coldStarts: number; releaseSeen: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? SLOGAN_REST_ENABLED;
  if (!enabled) return false;
  return input.releaseSeen || input.coldStarts >= 2;
}

export function readCount(raw: string | null) {
  const value = Number(raw ?? "0");
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

const listeners = new Set<() => void>();
let restCache = false;
let notedThisPage = false;

function emitSlogan() {
  listeners.forEach((listener) => listener());
}

export function subscribeSloganRest(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sloganRestSnapshot() {
  return restCache;
}

export function syncSloganRest(storage: Pick<Storage, "getItem" | "setItem"> | null) {
  if (!storage || !sloganRestOn()) {
    restCache = false;
    emitSlogan();
    return false;
  }
  const prev = readCount(storage.getItem(COLD_START_KEY));
  const starts = applyColdStart(prev, notedThisPage);
  notedThisPage = true;
  if (starts !== prev) {
    try {
      storage.setItem(COLD_START_KEY, String(starts));
    } catch {
      /* private mode */
    }
  }
  const seen = storage.getItem(SLOGAN_SEEN_KEY) === "1";
  restCache = sloganShouldRest({ coldStarts: starts, releaseSeen: seen });
  emitSlogan();
  return restCache;
}

export function markSloganSeen(storage: Pick<Storage, "getItem" | "setItem"> | null) {
  if (!sloganRestOn()) return;
  try {
    storage?.setItem(SLOGAN_SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
  const starts = storage ? readCount(storage.getItem(COLD_START_KEY)) : 1;
  restCache = sloganShouldRest({ coldStarts: Math.max(1, starts), releaseSeen: true });
  emitSlogan();
}
