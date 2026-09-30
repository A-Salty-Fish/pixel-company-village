/**
 * ambient-life — a few idle sparkles and insects.
 * Only when 减少动作 is off and 安静村子 is off.
 * No sentences. Set AMBIENT_LIFE_ENABLED to false to remove the layer.
 */

import type { Pixel } from "@/lib/worldcraft";

export const AMBIENT_LIFE_ENABLED = true;

export const AMBIENT_SPARKS = 3;
export const AMBIENT_INSECTS = 2;

export type AmbientKind = "spark" | "insect";

export type AmbientSpeck = {
  kind: AmbientKind;
  x: number;
  y: number;
  phase: number;
};

const SPECKS: readonly AmbientSpeck[] = [
  { kind: "spark", x: 360, y: 460, phase: 0.2 },
  { kind: "spark", x: 720, y: 280, phase: 1.1 },
  { kind: "spark", x: 980, y: 640, phase: 2.4 },
  { kind: "insect", x: 440, y: 760, phase: 0.6 },
  { kind: "insect", x: 860, y: 520, phase: 1.8 },
];

export function ambientLifeOn(quiet: boolean, reduceMotion: boolean, enabled = AMBIENT_LIFE_ENABLED) {
  return enabled && !quiet && !reduceMotion;
}

export function ambientLifeMark(quiet: boolean, reduceMotion: boolean, enabled = AMBIENT_LIFE_ENABLED): "on" | "off" {
  return ambientLifeOn(quiet, reduceMotion, enabled) ? "on" : "off";
}

export function ambientSpecks(quiet: boolean, reduceMotion: boolean, enabled = AMBIENT_LIFE_ENABLED): AmbientSpeck[] {
  if (!ambientLifeOn(quiet, reduceMotion, enabled)) return [];
  return SPECKS.map((speck) => ({ ...speck }));
}

export function ambientSpeckCount(quiet: boolean, reduceMotion: boolean, enabled = AMBIENT_LIFE_ENABLED) {
  return ambientSpecks(quiet, reduceMotion, enabled).length;
}

/** Screen pixels for one frame. Empty when the layer is off, so nothing twinkles. */
export function ambientPixels(specks: readonly AmbientSpeck[], t: number): Pixel[] {
  const pixels: Pixel[] = [];
  for (const speck of specks) {
    if (speck.kind === "spark") {
      const lit = Math.floor(t * 2 + speck.phase) % 3 !== 0;
      pixels.push({
        x: speck.x,
        y: speck.y,
        w: 2,
        h: 2,
        color: lit ? "#f2d15c" : "#c4a060",
      });
      continue;
    }
    const bob = Math.round(Math.sin(t + speck.phase) * 2);
    pixels.push(
      { x: speck.x - 2, y: speck.y + bob, w: 2, h: 1, color: "#3a7d4a" },
      { x: speck.x + 1, y: speck.y + bob, w: 2, h: 1, color: "#6aaa3a" },
      { x: speck.x, y: speck.y + bob, w: 1, h: 1, color: "#2a1a10" },
    );
  }
  return pixels;
}
