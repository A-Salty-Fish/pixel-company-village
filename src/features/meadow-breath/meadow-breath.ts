/**
 * PV-D-017 — a few grass blades lean, and one path lantern breathes.
 * Quiet villages still get this layer. Insects stay on the other switch.
 * Reduced motion holds the blades upright and the flame steady.
 * Set MEADOW_BREATH_ENABLED to false to clear both.
 */

import type { Pixel } from "@/lib/worldcraft";

export const MEADOW_BREATH_ENABLED = true;
export const MEADOW_GRASS = 4;

const BLADES: ReadonlyArray<{ x: number; y: number; phase: number }> = [
  { x: 168, y: 248, phase: 0 },
  { x: 448, y: 252, phase: 1.2 },
  { x: 808, y: 244, phase: 2.1 },
  { x: 308, y: 676, phase: 0.6 },
];

/** Scenic path lantern. Not the yard toy, so turning that lamp off leaves this breath. */
const LANTERN = { x: 610, y: 236 };

const STEM = "#3f7a3a";
const TIP = "#8fbf6a";
const FLAME = "#fff6d8";
const GLOW_STILL = "#e7b14a";
const GLOW_HIGH = "#fff1a8";
const GLOW_LOW = "#c4842a";

export function meadowBreathOn(enabled = MEADOW_BREATH_ENABLED) {
  return enabled;
}

export function meadowBreathMark(reduced: boolean, enabled = MEADOW_BREATH_ENABLED): "sway" | "still" | "off" {
  if (!meadowBreathOn(enabled)) return "off";
  return reduced ? "still" : "sway";
}

export function meadowBreathFrame(
  reduced: boolean,
  t: number,
  enabled = MEADOW_BREATH_ENABLED,
): { grass: Pixel[]; lantern: Pixel[] } {
  if (!meadowBreathOn(enabled)) return { grass: [], lantern: [] };
  const grass: Pixel[] = [];
  for (const blade of BLADES) {
    const lean = reduced ? 0 : Math.round(Math.sin(t * 0.55 + blade.phase));
    grass.push(
      { x: blade.x, y: blade.y, w: 1, h: 4, color: STEM },
      { x: blade.x + lean, y: blade.y - 2, w: 1, h: 3, color: TIP },
    );
  }
  const glow = reduced ? GLOW_STILL : Math.sin(t * 0.8) > 0 ? GLOW_HIGH : GLOW_LOW;
  const lantern: Pixel[] = [
    { x: LANTERN.x - 1, y: LANTERN.y, w: 3, h: 2, color: glow },
    { x: LANTERN.x, y: LANTERN.y - 2, w: 1, h: 2, color: FLAME },
  ];
  return { grass, lantern };
}

export function meadowBreathCount(reduced: boolean, enabled = MEADOW_BREATH_ENABLED) {
  const frame = meadowBreathFrame(reduced, 0, enabled);
  return frame.grass.length + frame.lantern.length;
}
