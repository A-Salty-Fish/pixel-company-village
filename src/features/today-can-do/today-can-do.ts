/**
 * PV-PM-034 — a soft map-corner hint for about the first half-minute after login.
 * Door lamp, one weekly chore, or finding a person. Not a dialog.
 * Set TODAY_CAN_DO_ENABLED to false to leave the corner without it.
 */

export const TODAY_CAN_DO_ENABLED = true;
export const TODAY_HINT_MS = 30_000;
export const TODAY_FADE_MS = 22_000;

export const TODAY_TITLE = "今日可做";
export const TODAY_LINES = ["点一盏门灯", "做一件本周小事", "找一个人"] as const;

export type TodayHintPhase = "show" | "fade" | "off";
export type TodayAction = "lamp" | "chore" | "person" | "other";

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

const START_KEY = "village:today-hint-start-v1";
const DISMISS_KEY = "village:today-hint-dismiss-v1";

export function loadHintClock(now: number) {
  if (typeof sessionStorage === "undefined") return { startedAt: now, dismissed: false };
  try {
    const raw = sessionStorage.getItem(START_KEY);
    const parsed = raw && /^\d+$/.test(raw) ? Number(raw) : now;
    if (raw == null) sessionStorage.setItem(START_KEY, String(parsed));
    return { startedAt: parsed, dismissed: sessionStorage.getItem(DISMISS_KEY) === "1" };
  } catch {
    return { startedAt: now, dismissed: false };
  }
}

export function storeHintDismiss() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* this tab only */
  }
}
