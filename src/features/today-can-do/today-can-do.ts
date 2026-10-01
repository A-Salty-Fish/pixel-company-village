/**
 * PV-PM-034 — a soft map-corner hint for about the first half-minute after the map is up.
 * Door lamp, one weekly chore, or finding a person. Not a dialog.
 * The clock starts when the map is ready, not while the gate or the boot field is still up.
 * A fresh visit to the gate clears it. Set TODAY_CAN_DO_ENABLED to false to leave the corner without it.
 */

export const TODAY_CAN_DO_ENABLED = true;
export const TODAY_HINT_MS = 30_000;
export const TODAY_FADE_MS = 22_000;

export const TODAY_TITLE = "今日可做";
export const TODAY_LINES = ["点一盏门灯", "做一件本周小事", "找一个人"] as const;

export const HINT_START_KEY = "village:today-hint-start-v1";
export const HINT_DISMISS_KEY = "village:today-hint-dismiss-v1";

/** Milliseconds. Anything smaller is not a clock from this village. */
const MIN_START = 1_700_000_000_000;

export type TodayHintPhase = "show" | "fade" | "off";
export type TodayAction = "lamp" | "chore" | "person" | "other";
export type HintStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function todayHintPhase(input: {
  elapsedMs: number;
  dismissed: boolean;
  enabled?: boolean;
}): TodayHintPhase {
  const enabled = input.enabled ?? TODAY_CAN_DO_ENABLED;
  if (!enabled || input.dismissed) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0) return "off";
  if (input.elapsedMs >= TODAY_HINT_MS) return "off";
  if (input.elapsedMs >= TODAY_FADE_MS) return "fade";
  return "show";
}

/** Lamp, a weekly chore, or finding a person ends the hint. Other clicks do not. */
export function todayHintDismisses(action: TodayAction) {
  return action === "lamp" || action === "chore" || action === "person";
}

export function todayHintCopy() {
  return [TODAY_TITLE, ...TODAY_LINES];
}

function browserHintStorage(): HintStorage | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

function plausibleStart(value: number, now: number) {
  return Number.isFinite(value) && value >= MIN_START && value <= now + 2_000;
}

/**
 * Read this tab's hint clock. A missing, tiny, or future stamp starts now.
 * An already-running stamp is kept, so a refresh does not open another half-minute.
 * Pass storage in tests. Omit it to use sessionStorage.
 */
export function loadHintClock(now: number, storage?: HintStorage | null) {
  const store = storage === undefined ? browserHintStorage() : storage;
  if (!store) return { startedAt: now, dismissed: false };
  try {
    const dismissed = store.getItem(HINT_DISMISS_KEY) === "1";
    const raw = store.getItem(HINT_START_KEY);
    const parsed = raw && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (!plausibleStart(parsed, now)) {
      store.setItem(HINT_START_KEY, String(now));
      return { startedAt: now, dismissed };
    }
    return { startedAt: parsed, dismissed };
  } catch {
    return { startedAt: now, dismissed: false };
  }
}

export function storeHintDismiss(storage?: HintStorage | null) {
  const store = storage === undefined ? browserHintStorage() : storage;
  if (!store) return;
  try {
    store.setItem(HINT_DISMISS_KEY, "1");
  } catch {
    /* this tab only */
  }
}

/** Fresh gate. The next map visit starts its own half-minute. */
export function clearHintClock(storage?: HintStorage | null) {
  const store = storage === undefined ? browserHintStorage() : storage;
  if (!store) return;
  try {
    store.removeItem(HINT_START_KEY);
    store.removeItem(HINT_DISMISS_KEY);
  } catch {
    /* this tab only */
  }
}
