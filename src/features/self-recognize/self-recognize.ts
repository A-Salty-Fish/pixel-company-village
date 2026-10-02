/**
 * PV-PM-089 — after 「我是谁」, the caller's plate and feet warm up at once.
 * No 「找我」 tap. Quiet and reduced motion stay readable and do not flash.
 * Set SELF_RECOGNIZE_ENABLED to false to leave the caller unmarked.
 */

import type { Pixel } from "@/lib/worldcraft";

export const SELF_RECOGNIZE_ENABLED = true;
/** The mark is on the first painted frame, inside this window. */
export const SELF_RECOGNIZE_MS = 2_000;

export type RecognizeMark = "warm" | "still" | "off";

export function selfRecognizeOn(enabled = SELF_RECOGNIZE_ENABLED) {
  return enabled;
}

export function selfRecognizeMark(input: {
  hasSelf: boolean;
  quiet: boolean;
  reduced: boolean;
  enabled?: boolean;
}): RecognizeMark {
  const enabled = input.enabled ?? SELF_RECOGNIZE_ENABLED;
  if (!enabled || !input.hasSelf) return "off";
  if (input.quiet || input.reduced) return "still";
  return "warm";
}

/** Soft oval at the feet. Same pixels for warm and still, so nothing flashes. */
export function selfRecognizeFeet(x: number, y: number, mode: RecognizeMark): Pixel[] {
  if (mode === "off") return [];
  const left = Math.round(x - 8);
  const top = Math.round(y - 2);
  return [
    { x: left, y: top + 1, w: 16, h: 3, color: "#e7b14a" },
    { x: left + 4, y: top, w: 8, h: 2, color: "#f2d15c" },
  ];
}

/** A short dash under the plate, not a second outline. */
export function selfPlateDash(mode: RecognizeMark) {
  return mode !== "off";
}
