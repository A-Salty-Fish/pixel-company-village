/**
 * PV-PM-111 — 「我是谁」 drops a name picker on the current screen.
 * It does not open the long settings essay. Set the flag false to jump there again.
 */

export const WHO_ON_SCREEN_ENABLED = true;
export const QUIET_VILLAGE_LINE = "安静村子";

export function whoOnScreenOn(enabled = WHO_ON_SCREEN_ENABLED) {
  return enabled;
}

export function whoOnScreenMark(enabled = WHO_ON_SCREEN_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Opening the picker must not travel a full screen. */
export function scrollStaysOnScreen(before: number, after: number, viewport: number) {
  if (!Number.isFinite(before) || !Number.isFinite(after) || !Number.isFinite(viewport) || viewport <= 0) return false;
  return Math.abs(after - before) < viewport;
}

export function quietLineInView(top: number, bottom: number, viewport: number) {
  if (bottom <= 0 || top >= viewport) return false;
  return bottom - top > 0;
}
