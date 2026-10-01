/**
 * v1.6.2 — map tools and the bottom bar answer with the same warm gold
 * as 「更多」, 「找我」, and 「回家」. Reduced motion keeps the gold and skips the scale.
 * Set PRESS_GLOW_ENABLED to false to leave presses still.
 */

export const PRESS_GLOW_ENABLED = true;

export function pressGlowMark(reduceMotion: boolean, enabled = PRESS_GLOW_ENABLED): "press" | "still" | "off" {
  if (!enabled) return "off";
  return reduceMotion ? "still" : "press";
}
