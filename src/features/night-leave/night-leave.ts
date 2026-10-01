/**
 * PV-PM-065 — one soft night line when leaving.
 * 「路上慢点」 shows once per local night and can be skipped.
 * The stored value is the calendar date only. Daytime leave is unchanged.
 * Set NIGHT_LEAVE_ENABLED to false to leave with no extra line.
 */

import { lightLabel } from "@/lib/copy";

export const NIGHT_LEAVE_ENABLED = true;
export const NIGHT_LEAVE_PREFIX = "village:night-leave-v1:";
export const NIGHT_LEAVE_LINE = "路上慢点";
export const NIGHT_LEAVE_SKIP = "先走";
/** Extra pause on top of the existing bye. Skip ends it early. Daytime leave stays the same. */
export const NIGHT_LEAVE_HOLD_MS = 800;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function nightLeaveKey(name: string) {
  return `${NIGHT_LEAVE_PREFIX}${name || "_"}`;
}

export function nightLeaveOffer(input: { hour: number; storedYmd: string | null; today: string; enabled?: boolean }) {
  const enabled = input.enabled ?? NIGHT_LEAVE_ENABLED;
  if (!enabled) return false;
  if (lightLabel(input.hour) !== "夜里") return false;
  if (!YMD.test(input.today)) return false;
  if (input.storedYmd === input.today) return false;
  return true;
}

export function loadNightLeave(name: string) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(nightLeaveKey(name));
    return raw && YMD.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveNightLeave(name: string, ymd: string) {
  if (!YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(nightLeaveKey(name), ymd);
  } catch {
    /* private mode */
  }
}

export function nightLeaveCopy() {
  return [NIGHT_LEAVE_LINE, NIGHT_LEAVE_SKIP];
}
