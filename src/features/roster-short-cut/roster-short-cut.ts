/**
 * PV-PM-112 — the roster opens as a short cut: self, scored people, and the rest.
 * Ticket 106 still lifts this block above the drawers. Set the flag false to show every row.
 */

export const ROSTER_SHORT_CUT_ENABLED = true;
export const ROSTER_MORE_LABEL = "还有";

export function rosterShortOn(enabled = ROSTER_SHORT_CUT_ENABLED) {
  return enabled;
}

export function rosterShortMark(enabled = ROSTER_SHORT_CUT_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function rosterMoreLabel(hidden: number) {
  const count = Number.isFinite(hidden) ? Math.max(0, Math.floor(hidden)) : 0;
  return `还有 ${count} 人`;
}

export function rosterShortList<T extends { name: string; scored: boolean }>(
  people: T[],
  selfName: string | null,
  expanded: boolean,
  enabled = ROSTER_SHORT_CUT_ENABLED,
) {
  if (!enabled || expanded) return { shown: people, hidden: 0, folded: false };
  const self = selfName ? people.filter((person) => person.name === selfName) : [];
  const scored = people.filter((person) => person.scored && person.name !== selfName);
  const shown = [...self, ...scored];
  const hidden = Math.max(0, people.length - shown.length);
  return { shown, hidden, folded: true };
}

/** Page offset of 「村里」 fits in this many viewports. */
export function reachesWithinScreens(offsetTop: number, viewport: number, screens = 2) {
  if (!Number.isFinite(offsetTop) || !Number.isFinite(viewport) || viewport <= 0) return false;
  return offsetTop <= viewport * screens;
}
