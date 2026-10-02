/**
 * PV-PM-086 / PV-D-019 — a phone teaches pinch and drag, and keeps a next beat
 * on the first screen before the week board is 3/3.
 * Set NARROW_TEACH_COPY_ENABLED to false to keep the desktop wheel line.
 */

import { pickNextBeat, type NextBeat } from "@/features/week-next-beat/next-beat";

export const NARROW_TEACH_COPY_ENABLED = true;
export const NARROW_TEACH_PX = 480;

export const TEACH_DESKTOP = "拖动画布 · 滚轮缩放 · 点小人看今日信号";
export const TEACH_NARROW = "拖动或双指捏合画布 · 点小人看今日信号";

export const TEACH_ARIA_DESKTOP =
  "像素公司农庄，同事们按当日分数在田里挥锄、浇水或去湖边抛竿。可拖动画布、滚轮缩放。";
export const TEACH_ARIA_NARROW =
  "像素公司农庄，同事们按当日分数在田里挥锄、浇水或去湖边抛竿。可拖动或双指捏合画布。";

export function narrowTeachOn(enabled = NARROW_TEACH_COPY_ENABLED) {
  return enabled;
}

export function teachIsNarrow(width: number, enabled = NARROW_TEACH_COPY_ENABLED) {
  return enabled && Number.isFinite(width) && width > 0 && width <= NARROW_TEACH_PX;
}

export function teachHint(narrow: boolean, enabled = NARROW_TEACH_COPY_ENABLED) {
  if (!enabled) return TEACH_DESKTOP;
  return narrow ? TEACH_NARROW : TEACH_DESKTOP;
}

export function teachAria(narrow: boolean, enabled = NARROW_TEACH_COPY_ENABLED) {
  if (!enabled) return TEACH_ARIA_DESKTOP;
  return narrow ? TEACH_ARIA_NARROW : TEACH_ARIA_DESKTOP;
}

export function teachMentionsWheel(line: string) {
  return line.includes("滚轮");
}

/** Unknown width stays pending so a phone never paints the desktop wheel line first. */
export function teachMode(narrow: boolean | null): "pending" | "pinch" | "wheel" {
  if (narrow == null) return "pending";
  return narrow ? "pinch" : "wheel";
}

export function teachLine(narrow: boolean | null, enabled = NARROW_TEACH_COPY_ENABLED) {
  if (narrow == null) return "";
  return teachHint(narrow, enabled);
}

/** The next-beat chip sits on the map, outside the folded 今日 sheet. */
export function nextBeatFirstScreen(enabled = NARROW_TEACH_COPY_ENABLED) {
  return enabled;
}

/**
 * Nearest landmark for a newcomer. Weekly progress is not an input:
 * 0/3 still gets 去看村口 (or whichever stop is closest).
 */
export function firstScreenBeat(
  self: { x: number; y: number } | null,
  enabled = NARROW_TEACH_COPY_ENABLED,
): NextBeat | null {
  if (!nextBeatFirstScreen(enabled)) return null;
  return pickNextBeat(self);
}

export function teachCopy() {
  return [TEACH_DESKTOP, TEACH_NARROW, TEACH_ARIA_DESKTOP, TEACH_ARIA_NARROW];
}
