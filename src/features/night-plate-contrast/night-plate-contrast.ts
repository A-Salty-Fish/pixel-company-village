/**
 * PV-PM-092 — around 22:00, the caller's plate and a near neighbor read one notch clearer.
 * Far plates stay as they were. Quiet village does not turn them into a billboard.
 * Set NIGHT_PLATE_CONTRAST_ENABLED to false to leave night plates alone.
 */

export const NIGHT_PLATE_CONTRAST_ENABLED = true;

export type NightPlateMark = "lift" | "quiet" | "off";
export type NightPlateRole = "self" | "neighbor" | "far";

export function nightPlateOn(enabled = NIGHT_PLATE_CONTRAST_ENABLED) {
  return enabled;
}

/** Deep night, starting at 22:00. Earlier evening stays on the old plates. */
export function nightPlateHour(hour: number) {
  return Number.isFinite(hour) && (hour >= 22 || hour < 5);
}

export function nightPlateMark(hour: number, quiet: boolean, enabled = NIGHT_PLATE_CONTRAST_ENABLED): NightPlateMark {
  if (!enabled || !nightPlateHour(hour)) return "off";
  return quiet ? "quiet" : "lift";
}

export function nightPlateAlpha(base: number, role: NightPlateRole, mark: NightPlateMark) {
  if (mark === "off" || role === "far") return base;
  const notch = mark === "quiet" ? 0.08 : 0.16;
  return Math.min(1, Math.round((base + notch) * 1000) / 1000);
}
