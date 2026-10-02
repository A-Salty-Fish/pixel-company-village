/**
 * PV-PM-104 — the map shows a field hold until sprites are ready.
 * Set the flag false to leave the empty green boot frame.
 */

export const MAP_FIELD_HOLD_ENABLED = true;
export const MAP_FIELD_HOLD_LINE = "田还在";

export function mapFieldHoldOn(enabled = MAP_FIELD_HOLD_ENABLED) {
  return enabled;
}

/** "1" while the canvas is not ready. "0" once sprites can show, or when the flag is off. */
export function mapPendingAttr(ready: boolean, enabled = MAP_FIELD_HOLD_ENABLED): "1" | "0" {
  if (!enabled) return "0";
  return ready ? "0" : "1";
}
