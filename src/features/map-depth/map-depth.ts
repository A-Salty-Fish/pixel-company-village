/**
 * PV-D-022 — roof lips, foot shadows, fence ticks, and path grit.
 * Paint only. hitTest is unchanged.
 * Set MAP_DEPTH_ENABLED to false to leave the meadow flat.
 */

import type { Pixel } from "@/lib/worldcraft";

export const MAP_DEPTH_ENABLED = true;

/** Sprite anchors from the atlas. The lip sits on the roof, the shadow at the feet. */
const HOUSES = [
  { x: 470, y: 214, ax: 64, ay: 135, w: 128 },
  { x: 760, y: 200, ax: 40, ay: 95, w: 80 },
  { x: 1040, y: 980, ax: 44, ay: 86, w: 88 },
] as const;

const GRIT = [
  { x: 280, y: 220 },
  { x: 420, y: 228 },
  { x: 700, y: 222 },
  { x: 900, y: 230 },
  { x: 260, y: 652 },
  { x: 480, y: 658 },
  { x: 820, y: 650 },
  { x: 1000, y: 656 },
] as const;

const TUFTS = [
  { x: 300, y: 360 },
  { x: 380, y: 420 },
  { x: 860, y: 380 },
  { x: 980, y: 460 },
  { x: 240, y: 780 },
  { x: 400, y: 840 },
  { x: 780, y: 800 },
  { x: 920, y: 880 },
] as const;

const FENCES = [
  { x: 140, y: 300 },
  { x: 360, y: 300 },
  { x: 140, y: 520 },
  { x: 900, y: 520 },
] as const;

const SHADOW = "rgba(42, 26, 16, 0.34)";
const LIP = "#fff1c8";
const EAVE = "#8a5528";
const PEBBLE = "#6a5340";
const SPARK = "#c4a060";
const GRASS = "#2f6a32";
const TIP = "#6aaa3a";

export function mapDepthOn(enabled = MAP_DEPTH_ENABLED) {
  return enabled;
}

export function mapDepthMark(enabled = MAP_DEPTH_ENABLED): "layered" | "flat" {
  return enabled ? "layered" : "flat";
}

export type RoofLayer = { sort: number; pixels: Pixel[] };

/** Ground sits under people. Each roof lip sorts with that house. */
export function mapDepthPixels(enabled = MAP_DEPTH_ENABLED): { ground: Pixel[]; roofs: Pixel[] } {
  const layers = mapDepthRoofLayers(enabled);
  return {
    ground: mapDepthGround(enabled),
    roofs: layers.flatMap((layer) => layer.pixels),
  };
}

export function mapDepthGround(enabled = MAP_DEPTH_ENABLED): Pixel[] {
  if (!mapDepthOn(enabled)) return [];
  const ground: Pixel[] = [];
  for (const house of HOUSES) {
    const half = Math.round(house.w * 0.36);
    ground.push(
      { x: house.x - half, y: house.y - 1, w: half * 2, h: 4, color: SHADOW },
      { x: house.x - half + 8, y: house.y + 3, w: half * 2 - 16, h: 2, color: "rgba(42, 26, 16, 0.18)" },
    );
  }
  for (const grit of GRIT) {
    ground.push(
      { x: grit.x, y: grit.y, w: 3, h: 2, color: PEBBLE },
      { x: grit.x + 6, y: grit.y + 3, w: 2, h: 2, color: SPARK },
    );
  }
  for (const tuft of TUFTS) {
    ground.push(
      { x: tuft.x, y: tuft.y, w: 2, h: 6, color: GRASS },
      { x: tuft.x + 3, y: tuft.y + 2, w: 2, h: 5, color: TIP },
    );
  }
  for (let i = 0; i < 14; i += 1) {
    const x = 248 + ((i * 67) % 900);
    const y = 280 + ((i * 43) % 700);
    if (x >= 32 && x <= 224 && y >= 32 && y <= 128) continue;
    ground.push(
      { x, y, w: 2, h: 5, color: i % 2 === 0 ? GRASS : "#245428" },
      { x: x + 3, y: y + 1, w: 2, h: 4, color: TIP },
    );
  }
  for (const fence of FENCES) {
    ground.push(
      { x: fence.x, y: fence.y, w: 18, h: 2, color: EAVE },
      { x: fence.x, y: fence.y + 2, w: 2, h: 8, color: "#5a3a22" },
      { x: fence.x + 16, y: fence.y + 2, w: 2, h: 8, color: "#5a3a22" },
    );
  }
  return ground;
}

export function mapDepthRoofLayers(enabled = MAP_DEPTH_ENABLED): RoofLayer[] {
  if (!mapDepthOn(enabled)) return [];
  return HOUSES.map((house) => {
    const top = house.y - house.ay;
    return {
      sort: house.y + 1,
      pixels: [
        { x: house.x - 18, y: top + 4, w: 36, h: 2, color: LIP },
        { x: house.x - 22, y: top + 6, w: 44, h: 1, color: EAVE },
      ],
    };
  });
}

export function mapDepthCount(enabled = MAP_DEPTH_ENABLED) {
  const frame = mapDepthPixels(enabled);
  return frame.ground.length + frame.roofs.length;
}
