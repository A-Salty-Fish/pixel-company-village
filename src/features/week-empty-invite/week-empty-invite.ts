/**
 * PV-PM-105 — a week at 0/3 offers a soft line, not only the fraction.
 * One tap on that line opens the week sheet. Set the flag false to keep the fraction.
 */

export const WEEK_EMPTY_INVITE_ENABLED = true;
export const WEEK_INVITE_LINE = "今日还空着，先做一件小事";

export function weekInviteOn(enabled = WEEK_EMPTY_INVITE_ENABLED) {
  return enabled;
}

export function weekInviteShows(done: number, weekOn: boolean, enabled = WEEK_EMPTY_INVITE_ENABLED) {
  return enabled && weekOn && done <= 0;
}

export function weekInviteCopy(shown: boolean) {
  return shown ? WEEK_INVITE_LINE : "";
}

/** Opening the today sheet from the invite also opens the week list. */
export function weekInviteOpensList(opening: boolean, shown: boolean) {
  return opening && shown;
}
