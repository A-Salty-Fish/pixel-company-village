/**
 * PV-PM-078 — score chips and map controls read as warm wood.
 * Material, radius, stroke, and tint only. Chrome stays the same height.
 * Set WARM_HUD_ENABLED to false to keep the previous look.
 */

export const WARM_HUD_ENABLED = true;

const LAYOUT =
  /\b(?:min-height|max-height|height|width|min-width|max-width|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|font-size|line-height|gap|display|position|flex(?:-[a-z]+)?|transform|z-index|top|bottom|left|right|inset)\s*:/;

export function warmHudOn(enabled = WARM_HUD_ENABLED) {
  return enabled;
}

export function warmHudMark(enabled = WARM_HUD_ENABLED): "warm" | "flat" {
  return enabled ? "warm" : "flat";
}

/** True when a warm-hud rule does not change chrome size or the phone stack. */
export function warmHudLayoutSafe(css: string) {
  return css.includes("data-warm-hud") && !LAYOUT.test(css) && !css.includes("village-map-slot");
}
