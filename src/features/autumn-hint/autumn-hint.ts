/**
 * PV-PM-067 — a few soft autumn leaves.
 * October draws a small drift. Other months stay even softer.
 * Quiet village turns them off. Reduced motion holds each leaf still.
 * Set AUTUMN_HINT_ENABLED to false to clear them.
 */

import type { Pixel } from "@/lib/worldcraft";

export const AUTUMN_HINT_ENABLED = true;

const LEAVES: ReadonlyArray<{ x: number; y: number; phase: number }> = [
  { x: 240, y: 140, phase: 0.4 },
  { x: 520, y: 168, phase: 1.3 },
  { x: 880, y: 150, phase: 2.1 },
  { x: 400, y: 470, phase: 0.8 },
  { x: 700, y: 430, phase: 1.9 },
];

export function autumnHintCount(month: number, quiet: boolean, enabled = AUTUMN_HINT_ENABLED) {
  if (!enabled || quiet) return 0;
  if (month === 10) return LEAVES.length;
  return 2;
}

export function autumnHintMark(input: {
  month: number;
  quiet: boolean;
  reduced: boolean;
  enabled?: boolean;
}): "drift" | "still" | "off" {
  const enabled = input.enabled ?? AUTUMN_HINT_ENABLED;
  if (autumnHintCount(input.month, input.quiet, enabled) === 0) return "off";
  return input.reduced ? "still" : "drift";
}

export function autumnHintFrame(input: {
  month: number;
  quiet: boolean;
  reduced: boolean;
  t: number;
  enabled?: boolean;
}): Pixel[] {
  const enabled = input.enabled ?? AUTUMN_HINT_ENABLED;
  const count = autumnHintCount(input.month, input.quiet, enabled);
  if (count === 0) return [];
  const soft = input.month === 10 ? 0.72 : 0.38;
  const pixels: Pixel[] = [];
  for (const leaf of LEAVES.slice(0, count)) {
    const drift = input.reduced ? 0 : Math.round(Math.sin(input.t * 0.4 + leaf.phase) * 4);
    const bob = input.reduced ? 0 : Math.round(Math.sin(input.t * 0.25 + leaf.phase) * 3);
    const x = leaf.x + drift;
    const y = leaf.y + bob;
    pixels.push(
      { x, y, w: 3, h: 2, color: `rgba(212, 106, 50, ${soft})` },
      { x: x + 2, y: y - 1, w: 2, h: 2, color: `rgba(138, 58, 40, ${soft})` },
    );
  }
  return pixels;
}

export function autumnHintCopy() {
  return [] as string[];
}
