/**
 * v1.6.2 — a few grass tufts lean, and the path lantern breathes.
 * Quiet village and reduced motion hold both still.
 * Set IDLE_BREEZE_ENABLED to false to clear the layer.
 */

import type { Pixel } from "@/lib/worldcraft";

export const IDLE_BREEZE_ENABLED = true;

const GRASS: ReadonlyArray<{ x: number; y: number; phase: number }> = [
  { x: 168, y: 292, phase: 0.2 },
  { x: 540, y: 404, phase: 1.4 },
  { x: 980, y: 512, phase: 2.2 },
  { x: 300, y: 860, phase: 0.7 },
];

/** Just above the yard lantern head, so this is a flame and not a second post. */
const LANTERN = { x: 850, y: 324 };

export function idleBreezeMark(
  reduceMotion: boolean,
  quiet: boolean,
  enabled = IDLE_BREEZE_ENABLED,
): "sway" | "still" | "off" {
  if (!enabled) return "off";
  return reduceMotion || quiet ? "still" : "sway";
}

function living(reduceMotion: boolean, quiet: boolean) {
  return !reduceMotion && !quiet;
}

export function idleGrassFrame(
  reduceMotion: boolean,
  quiet: boolean,
  t: number,
  enabled = IDLE_BREEZE_ENABLED,
): Pixel[] {
  if (!enabled) return [];
  const move = living(reduceMotion, quiet);
  const pixels: Pixel[] = [];
  for (const tuft of GRASS) {
    const lean = move ? Math.round(Math.sin(t * 0.8 + tuft.phase)) : 0;
    pixels.push(
      { x: tuft.x, y: tuft.y, w: 1, h: 4, color: "#2f6a3a" },
      { x: tuft.x + lean, y: tuft.y - 2, w: 1, h: 3, color: "#6aaa3a" },
      { x: tuft.x - 1 + lean, y: tuft.y - 1, w: 1, h: 2, color: "#3a7d4a" },
    );
  }
  return pixels;
}

export function idleLanternFrame(
  reduceMotion: boolean,
  quiet: boolean,
  t: number,
  enabled = IDLE_BREEZE_ENABLED,
): Pixel[] {
  if (!enabled) return [];
  const flicker = living(reduceMotion, quiet) ? Math.floor(t * 3) % 3 : 1;
  const glow = flicker === 0 ? "#c4924a" : flicker === 1 ? "#f2d15c" : "#fff6d8";
  return [
    { x: LANTERN.x, y: LANTERN.y, w: 2, h: 2, color: glow },
    { x: LANTERN.x - 1, y: LANTERN.y + 1, w: 1, h: 1, color: flicker === 2 ? "#f2d15c" : "#e7b14a" },
  ];
}

export function idleBreezeCount(enabled = IDLE_BREEZE_ENABLED) {
  return enabled ? GRASS.length : 0;
}
