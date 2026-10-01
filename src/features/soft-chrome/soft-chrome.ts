/**
 * v1.6.2 — softer parchment chrome on the village page.
 * Borders, shadows, and the narrow “more” sheet stay readable.
 * Set SOFT_CHROME_ENABLED to false to restore the harder HUD.
 */

export const SOFT_CHROME_ENABLED = true;

export function softChromeMark(enabled = SOFT_CHROME_ENABLED): "soft" | "off" {
  return enabled ? "soft" : "off";
}
