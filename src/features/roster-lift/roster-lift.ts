/**
 * PV-PM-106 — on a phone, the roster sits above the settings and log drawers.
 * Set the flag false to leave the roster under that wall.
 */

export const ROSTER_LIFT_ENABLED = true;
export const ROSTER_LIFT_PX = 480;

export function rosterLiftOn(enabled = ROSTER_LIFT_ENABLED) {
  return enabled;
}

export function rosterLiftMark(enabled = ROSTER_LIFT_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function rosterLiftsAt(width: number, enabled = ROSTER_LIFT_ENABLED) {
  return enabled && Number.isFinite(width) && width > 0 && width <= ROSTER_LIFT_PX;
}
