/**
 * PV-PM-063 — a quiet header strip after a name is chosen.
 * 找我, 回家, or today's ritual each complete it. A checkmark, then it leaves.
 * Stored value is the local date only. There is no missed-day board.
 * Set TODAY_TOUCH_ENABLED to false to hide the strip.
 */

export const TODAY_TOUCH_ENABLED = true;
export const TODAY_TOUCH_PREFIX = "village:today-touch-v1:";
export const TODAY_TOUCH_LINE = "今日摸一下村里";
export const TODAY_TOUCH_DISMISS_MS = 1_400;

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const COMPLETES = new Set(["find", "home", "ritual"]);

export function todayTouchKey(name: string) {
  return `${TODAY_TOUCH_PREFIX}${name}`;
}

export function todayTouchCompletes(action: string) {
  return COMPLETES.has(action);
}

export function todayTouchPhase(input: {
  hasSelf: boolean;
  storedYmd: string | null;
  today: string;
  justDone?: boolean;
  enabled?: boolean;
}): "open" | "done" | "off" {
  const enabled = input.enabled ?? TODAY_TOUCH_ENABLED;
  if (!enabled || !input.hasSelf || !YMD.test(input.today)) return "off";
  if (input.justDone) return "done";
  if (input.storedYmd === input.today) return "off";
  return "open";
}

export function loadTodayTouch(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(todayTouchKey(name));
    return raw && YMD.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveTodayTouch(name: string, ymd: string) {
  if (!name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(todayTouchKey(name), ymd);
  } catch {
    /* private mode */
  }
}

export function todayTouchCopy() {
  return [TODAY_TOUCH_LINE];
}
