/**
 * PV-PM-068 — a few tufts and flowers sit on the grass beside the paths.
 * The crossing stays empty so the first glance still has one place to land.
 * Set PATH_MEADOW_ENABLED to false to leave the path edges bare.
 */

import type { Pixel } from "@/lib/worldcraft";

export const PATH_MEADOW_ENABLED = true;

/** North-road crossing. Flowers stop short of this so it stays readable. */
export const PATH_CLEAR = { x0: 548, y0: 188, x1: 668, y1: 260 };

type Kind = "tuft" | "flower";

type Anchor = { x: number; y: number; kind: Kind; petal: string };

const PETALS = ["#f4b4c4", "#fff6d8", "#f2d15c", "#e07a5a"] as const;
const STEM = "#2f6a32";
const TIP = "#8fbf6a";
const BLADE = "#3f7a3a";

const ANCHORS: readonly Anchor[] = [
  { x: 96, y: 196, kind: "tuft", petal: PETALS[0] },
  { x: 200, y: 248, kind: "flower", petal: PETALS[1] },
  { x: 304, y: 196, kind: "flower", petal: PETALS[2] },
  { x: 400, y: 250, kind: "tuft", petal: PETALS[3] },
  { x: 820, y: 198, kind: "flower", petal: PETALS[0] },
  { x: 920, y: 248, kind: "tuft", petal: PETALS[1] },
  { x: 1024, y: 196, kind: "flower", petal: PETALS[2] },
  { x: 1120, y: 248, kind: "tuft", petal: PETALS[3] },
  { x: 568, y: 300, kind: "flower", petal: PETALS[1] },
  { x: 640, y: 360, kind: "tuft", petal: PETALS[2] },
  { x: 566, y: 440, kind: "flower", petal: PETALS[0] },
  { x: 642, y: 520, kind: "tuft", petal: PETALS[3] },
  { x: 568, y: 780, kind: "tuft", petal: PETALS[2] },
  { x: 640, y: 880, kind: "flower", petal: PETALS[1] },
  { x: 140, y: 628, kind: "flower", petal: PETALS[0] },
  { x: 300, y: 684, kind: "tuft", petal: PETALS[2] },
  { x: 460, y: 626, kind: "flower", petal: PETALS[3] },
  { x: 820, y: 684, kind: "tuft", petal: PETALS[1] },
  { x: 1000, y: 628, kind: "flower", petal: PETALS[2] },
  { x: 1140, y: 682, kind: "tuft", petal: PETALS[0] },
];

let cached: Pixel[] | null = null;

export function pathMeadowOn(enabled = PATH_MEADOW_ENABLED) {
  return enabled;
}

export function pathMeadowMark(enabled = PATH_MEADOW_ENABLED): "edged" | "bare" {
  return enabled ? "edged" : "bare";
}

export function pathMeadowAnchors(enabled = PATH_MEADOW_ENABLED): readonly Anchor[] {
  return enabled ? ANCHORS : [];
}

function flower(anchor: Anchor): Pixel[] {
  return [
    { x: anchor.x + 1, y: anchor.y + 2, w: 1, h: 4, color: STEM },
    { x: anchor.x, y: anchor.y, w: 3, h: 2, color: anchor.petal },
    { x: anchor.x + 1, y: anchor.y, w: 1, h: 1, color: "#fff6d8" },
  ];
}

function tuft(anchor: Anchor): Pixel[] {
  return [
    { x: anchor.x, y: anchor.y, w: 1, h: 5, color: BLADE },
    { x: anchor.x + 2, y: anchor.y + 1, w: 1, h: 4, color: TIP },
  ];
}

export function pathMeadowPixels(enabled = PATH_MEADOW_ENABLED): Pixel[] {
  if (!pathMeadowOn(enabled)) return [];
  if (!cached) {
    const pixels: Pixel[] = [];
    for (const anchor of ANCHORS) {
      pixels.push(...(anchor.kind === "flower" ? flower(anchor) : tuft(anchor)));
    }
    cached = pixels;
  }
  return cached;
}

export function pathMeadowCount(enabled = PATH_MEADOW_ENABLED) {
  return pathMeadowPixels(enabled).length;
}
