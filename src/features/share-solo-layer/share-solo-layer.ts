/**
 * PV-PM-085 — on a narrow phone the share card is the only overlay.
 * Opening it closes 更多, 院子, 图例, and the today sheet.
 * Set SHARE_SOLO_LAYER_ENABLED to false to leave those panels stacked.
 */

export const SHARE_SOLO_LAYER_ENABLED = true;
export const SHARE_SOLO_MAX_PX = 480;

/** Transient panels that must shut so the card does not cover them. */
export const SHARE_SOLO_PANELS = ["more", "yard", "legend", "today"] as const;

/** Native details that also have to fold. */
export const SHARE_SOLO_DETAILS = ["name-legend", "comfort-settings"] as const;

export function shareSoloOn(enabled = SHARE_SOLO_LAYER_ENABLED) {
  return enabled;
}

export function shareSoloActive(open: boolean, width: number, enabled = SHARE_SOLO_LAYER_ENABLED) {
  if (!enabled || !open) return false;
  return Number.isFinite(width) && width > 0 && width <= SHARE_SOLO_MAX_PX;
}

export function shareSoloMark(active: boolean): "1" | "0" {
  return active ? "1" : "0";
}
