/**
 * PV-PM-099 — wood panels get a cut bevel and a fine grain.
 * Material only. Chrome stays the same size.
 * Set WOOD_BEVEL_ENABLED to false to leave the flatter plaques.
 */

export const WOOD_BEVEL_ENABLED = true;

const LAYOUT =
  /\b(?:min-height|max-height|height|width|min-width|max-width|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|font-size|line-height|gap|display|position|flex(?:-[a-z]+)?|transform|z-index|top|bottom|left|right|inset)\s*:/;

export function woodBevelOn(enabled = WOOD_BEVEL_ENABLED) {
  return enabled;
}

export function woodBevelMark(enabled = WOOD_BEVEL_ENABLED): "cut" | "flat" {
  return enabled ? "cut" : "flat";
}

/** True when a bevel rule does not change chrome size. */
export function woodBevelLayoutSafe(css: string) {
  return css.includes("data-wood-bevel") && !LAYOUT.test(css);
}
