/**
 * PV-D-014 — wood panels, map tools, and the bottom bar keep their colors
 * and 3px edges, with a shorter shadow and a little more padding.
 * Set SOFT_CHROME_ENABLED to false to restore the harder stamp.
 */

export const SOFT_CHROME_ENABLED = true;

export function softChromeMark(enabled = SOFT_CHROME_ENABLED): "soft" | "hard" {
  return enabled ? "soft" : "hard";
}
