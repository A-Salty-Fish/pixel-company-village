/**
 * PV-PM-093 — 「回家」 answers with one short village line.
 * Quiet village still shows the words. Nothing flashes.
 * Set HOME_VILLAGE_LINE_ENABLED to false to keep the older home toast.
 */

export const HOME_VILLAGE_LINE_ENABLED = true;
export const HOME_VILLAGE_LINE = "灶还温着。";
export const HOME_VILLAGE_MS = 2_000;

export function homeVillageOn(enabled = HOME_VILLAGE_LINE_ENABLED) {
  return enabled;
}

/** Quiet does not hide the line. */
export function homeVillageVisible(input: { quiet: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? HOME_VILLAGE_LINE_ENABLED;
  void input.quiet;
  return enabled;
}

export function homeVillageFlashes(enabled = HOME_VILLAGE_LINE_ENABLED) {
  void enabled;
  return false;
}

export function homeVillageCopy() {
  return [HOME_VILLAGE_LINE];
}
