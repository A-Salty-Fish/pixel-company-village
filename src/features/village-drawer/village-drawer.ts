/**
 * PV-PM-039 — secondary panels live in one 「村里」 drawer, closed at first.
 * Set VILLAGE_DRAWER_ENABLED to false to put the panels back on the page.
 */

export const VILLAGE_DRAWER_ENABLED = true;
export const VILLAGE_DRAWER_LABEL = "村里";

/** The drawer itself starts closed. Inner panels keep their own summaries. */
export function drawerStartsOpen(enabled = VILLAGE_DRAWER_ENABLED) {
  return enabled ? false : false;
}

export function drawerWrapsPanels(enabled = VILLAGE_DRAWER_ENABLED) {
  return enabled;
}

export function drawerCopy() {
  return [VILLAGE_DRAWER_LABEL];
}
