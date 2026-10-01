/**
 * PV-D-015 — zoom, 找我, 回家, 更多, and the bottom bar sink the same way.
 * One pixel down, warm face, dark ink. Reduced motion skips the ease, not the press.
 * Set PRESS_FEEL_ENABLED to false to leave presses plain.
 */

export const PRESS_FEEL_ENABLED = true;

export function pressFeelMark(enabled = PRESS_FEEL_ENABLED): "shared" | "plain" {
  return enabled ? "shared" : "plain";
}
