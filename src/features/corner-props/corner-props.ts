/**
 * PV-PM-100 — two or three sparse props in empty grass.
 * A fence post and a wildflower clump. They stay off the roads,
 * off the pond, and off villager tap boxes.
 * Set CORNER_PROPS_ENABLED to false to leave those corners bare.
 */

import type { Pixel } from "@/lib/worldcraft";
import { cornerOnRoad, cornerOnWater } from "@/features/corner-meadow/corner-meadow";

export const CORNER_PROPS_ENABLED = true;

const POST = "#6a3d18";
const CAP = "#8a5528";
const FOOT = "#5a3214";
const STEM = "#2f6a32";
const PETAL = "#f4b4c4";
const CREAM = "#fff6d8";
const BERRY = "#e07a5a";

const PROPS = [
  { kind: "post", x: 336, y: 158 },
  { kind: "flowers", x: 808, y: 160 },
  { kind: "post", x: 900, y: 146 },
] as const;

export function cornerPropsOn(enabled = CORNER_PROPS_ENABLED) {
  return enabled;
}

export function cornerPropsMark(enabled = CORNER_PROPS_ENABLED): "sparse" | "bare" {
  return enabled ? "sparse" : "bare";
}

export function cornerPropAnchors(enabled = CORNER_PROPS_ENABLED) {
  return enabled ? PROPS : [];
}

function post(x: number, y: number): Pixel[] {
  return [
    { x, y, w: 2, h: 12, color: POST },
    { x: x - 1, y, w: 4, h: 2, color: CAP },
    { x, y: y + 12, w: 2, h: 2, color: FOOT },
  ];
}

function flowers(x: number, y: number): Pixel[] {
  return [
    { x: x + 1, y: y + 3, w: 1, h: 5, color: STEM },
    { x, y, w: 3, h: 2, color: PETAL },
    { x: x + 4, y: y + 1, w: 3, h: 2, color: CREAM },
    { x: x + 2, y: y + 4, w: 2, h: 2, color: BERRY },
  ];
}

export function cornerPropPixels(enabled = CORNER_PROPS_ENABLED): Pixel[] {
  if (!cornerPropsOn(enabled)) return [];
  const pixels: Pixel[] = [];
  for (const prop of PROPS) {
    pixels.push(...(prop.kind === "post" ? post(prop.x, prop.y) : flowers(prop.x, prop.y)));
  }
  return pixels;
}

export function cornerPropCount(enabled = CORNER_PROPS_ENABLED) {
  return cornerPropPixels(enabled).length;
}

export function cornerPropClear(x: number, y: number) {
  return !cornerOnRoad(x, y) && !cornerOnWater(x, y);
}
