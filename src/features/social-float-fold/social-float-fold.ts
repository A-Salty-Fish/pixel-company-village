/**
 * PV-PM-108 — after a name is chosen, wave and 相伴 share one chip.
 * A second tap still reaches either one. Set the flag false to keep both floats.
 */

export const SOCIAL_FLOAT_FOLD_ENABLED = true;
export const SOCIAL_FLOAT_FOLD_PX = 480;
export const SOCIAL_FLOAT_CHIP = "招呼";

export function socialFloatFoldOn(enabled = SOCIAL_FLOAT_FOLD_ENABLED) {
  return enabled;
}

export function socialFloatFolds(hasSelf: boolean, width: number, enabled = SOCIAL_FLOAT_FOLD_ENABLED) {
  return enabled && hasSelf && Number.isFinite(width) && width > 0 && width <= SOCIAL_FLOAT_FOLD_PX;
}

/** Closed chip is the only bottom-right float. Open still reaches wave and 相伴. */
export function floatBlockCount(input: { folded: boolean; open: boolean; extras: number }) {
  if (!input.folded) return 2 + input.extras;
  if (!input.open) return 1 + input.extras;
  return 3 + input.extras;
}

export function floatReachableIn(open: boolean) {
  return open ? 1 : 2;
}
