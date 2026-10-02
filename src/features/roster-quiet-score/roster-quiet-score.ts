/**
 * PV-PM-101 — an unscored roster row says 「未评分」 once.
 * The trailing control uses a different word. Set the flag false to echo both.
 */

export const ROSTER_QUIET_SCORE_ENABLED = true;
export const UNSCORED_STATUS = "未评分";
export const UNSCORED_ACTION = "还没分";

export function rosterQuietOn(enabled = ROSTER_QUIET_SCORE_ENABLED) {
  return enabled;
}

export function unscoredStatus() {
  return UNSCORED_STATUS;
}

export function unscoredAction(enabled = ROSTER_QUIET_SCORE_ENABLED) {
  return enabled ? UNSCORED_ACTION : UNSCORED_STATUS;
}

/** Visible copies on one row. The status word should appear at most once. */
export function unscoredEchoCount(status: string, action: string) {
  return `${status}\n${action}`.split(UNSCORED_STATUS).length - 1;
}
