/**
 * PV-PM-063 — one soft header strip after a name is chosen.
 * 找我, 回家, or today's ritual completes it. A check, then it leaves.
 * Local date stamp only. No board and no comparison.
 * Set TODAY_TOUCH_ENABLED to false to hide the strip.
 */

export const TODAY_TOUCH_ENABLED = true;
export const TODAY_TOUCH_PREFIX = "village:today-touch-v1:";
export const TODAY_TOUCH_LINE = "今日摸一下村里";
export const TODAY_TOUCH_DONE = "✓";
export const TODAY_TOUCH_DISMISS_MS = 1_200;

export const TODAY_TOUCH_ACTIONS = ["find", "home", "ritual"] as const;
export type TodayTouchAction = (typeof TODAY_TOUCH_ACTIONS)[number];

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function todayTouchKey(name: string) {
  return `${TODAY_TOUCH_PREFIX}${name}`;
}

export function readStoredYmd(raw: string | null) {
  if (!raw || !YMD.test(raw)) return null;
  return raw;
}

export function todayTouchOffer(input: { selfName: string | null; storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? TODAY_TOUCH_ENABLED;
  if (!enabled || !input.selfName || !YMD.test(input.today)) return false;
  return readStoredYmd(input.storedYmd) !== input.today;
}

export function todayTouchCompletes(action: string) {
  return (TODAY_TOUCH_ACTIONS as readonly string[]).includes(action);
}

export function loadTodayTouch(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    return readStoredYmd(localStorage.getItem(todayTouchKey(name)));
  } catch {
    return null;
  }
}

export function saveTodayTouch(name: string, ymd: string) {
  if (!TODAY_TOUCH_ENABLED || !name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(todayTouchKey(name), ymd);
  } catch {
    /* private mode */
  }
}

export function todayTouchCopy() {
  return [TODAY_TOUCH_LINE, TODAY_TOUCH_DONE];
}
