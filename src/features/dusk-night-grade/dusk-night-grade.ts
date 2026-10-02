/**
 * PV-PM-098 — dusk and night each take one thicker step.
 * Source-over only, so a dark pixel moves toward the ink instead of
 * clipping to black. Windows and the hearth paint after this grade.
 * Set DUSK_NIGHT_GRADE_ENABLED to false to keep the shipped washes.
 */

import { blendOver, type Rgb } from "@/features/night-wash/night-wash";
import { DAY_GRASS, VEIL_INK, nightField } from "@/features/night-wash-v2/night-wash-v2";

export const DUSK_NIGHT_GRADE_ENABLED = true;

/** One notch over the dusk film already on the map. */
export const DUSK_NOTCH = { r: 92, g: 42, b: 22, a: 0.1 };
/** One notch over the night veil. Combined alpha stays under the blanking line. */
export const NIGHT_NOTCH = { r: 8, g: 14, b: 40, a: 0.08 };

export type GradePhase = "dusk" | "night" | "off";

export function duskNightGradeOn(enabled = DUSK_NIGHT_GRADE_ENABLED) {
  return enabled;
}

/** Clock hours for 傍晚. Quiet mode does not skip this one notch. */
export function duskNightGradeFor(
  input: { hour: number; night: boolean },
  enabled = DUSK_NIGHT_GRADE_ENABLED,
): GradePhase {
  const hour = Math.floor(input.hour);
  const dusk = hour >= 17 && hour < 20;
  return duskNightGradePhase({ dusk, night: input.night }, enabled);
}

/** Night wins when both are set. The clock does not overlap them. */
export function duskNightGradePhase(
  input: { dusk: boolean; night: boolean },
  enabled = DUSK_NIGHT_GRADE_ENABLED,
): GradePhase {
  if (!enabled) return "off";
  if (input.night) return "night";
  if (input.dusk) return "dusk";
  return "off";
}

export function gradeInk(phase: GradePhase) {
  if (phase === "dusk") return DUSK_NOTCH;
  if (phase === "night") return NIGHT_NOTCH;
  return null;
}

export function notchField(base: Rgb, phase: GradePhase): Rgb {
  const ink = gradeInk(phase);
  if (!ink) return base;
  return blendOver(base, ink);
}

/** Shipped night field, then this one notch. */
export function gradedNightGrass(day: Rgb = DAY_GRASS) {
  return notchField(nightField(day), "night");
}

/** A dark grass pixel after the veil and the notch still has open channels. */
export function gradeKeepsBlacks(shadow: Rgb = { r: 16, g: 22, b: 14 }) {
  const graded = notchField(blendOver(shadow, VEIL_INK), "night");
  return graded.r >= 8 && graded.g >= 10 && graded.b >= 8;
}

export function paintDuskNightGrade(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  phase: GradePhase,
  enabled = DUSK_NIGHT_GRADE_ENABLED,
) {
  const ink = gradeInk(enabled ? phase : "off");
  if (!ink) return "off" as const;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${ink.a})`;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
  return phase;
}
