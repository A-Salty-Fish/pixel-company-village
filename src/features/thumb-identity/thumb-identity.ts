/**
 * PV-PM-043 — guests get one bottom action, 我是谁.
 * 回家 appears after a name is chosen. The bar stays opaque above the page.
 * Set THUMB_IDENTITY_ENABLED to false to show both buttons again.
 */

export const THUMB_IDENTITY_ENABLED = true;

export function thumbShowsHome(hasIdentity: boolean, enabled = THUMB_IDENTITY_ENABLED) {
  if (!enabled) return true;
  return hasIdentity;
}

export function thumbShowsWho() {
  return true;
}
