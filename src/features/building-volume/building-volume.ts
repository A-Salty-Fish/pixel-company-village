/**
 * PV-PM-069 — a ridge lip, an eave line, and a shaded wall side.
 * The three house sprites stop reading as flat stamps.
 * Paint only. Set BUILDING_VOLUME_ENABLED to false to leave the sprites alone.
 */

import type { Pixel } from "@/lib/worldcraft";

export const BUILDING_VOLUME_ENABLED = true;

const LIP = "#fff1c8";
const EAVE = "rgba(42, 22, 12, 0.55)";
const WALL = "rgba(42, 18, 8, 0.4)";
const LIT = "rgba(255, 236, 196, 0.28)";

type Box = { x: number; y: number; w: number; h: number };

/** Sprite anchors match the atlas. Boxes are local to the top-left of the frame. */
const HOUSES = [
  {
    x: 470,
    y: 214,
    ax: 64,
    ay: 135,
    ridge: { x: 54, y: 3, w: 16, h: 2 },
    eave: { x: 6, y: 46, w: 112, h: 2 },
    wall: { x: 88, y: 94, w: 28, h: 28 },
    lit: { x: 12, y: 98, w: 6, h: 20 },
  },
  {
    x: 760,
    y: 200,
    ax: 40,
    ay: 95,
    ridge: { x: 34, y: 4, w: 12, h: 2 },
    eave: { x: 6, y: 50, w: 68, h: 2 },
    wall: { x: 50, y: 64, w: 20, h: 22 },
    lit: { x: 8, y: 66, w: 5, h: 16 },
  },
  {
    x: 1040,
    y: 980,
    ax: 44,
    ay: 86,
    ridge: { x: 10, y: 1, w: 68, h: 2 },
    eave: { x: 4, y: 29, w: 80, h: 2 },
    wall: { x: 50, y: 62, w: 28, h: 20 },
    lit: { x: 8, y: 64, w: 6, h: 16 },
  },
] as const;

export type VolumeLayer = { sort: number; pixels: Pixel[] };

export function buildingVolumeOn(enabled = BUILDING_VOLUME_ENABLED) {
  return enabled;
}

export function buildingVolumeMark(enabled = BUILDING_VOLUME_ENABLED): "round" | "flat" {
  return enabled ? "round" : "flat";
}

function worldBox(originX: number, originY: number, box: Box, color: string): Pixel {
  return { x: originX + box.x, y: originY + box.y, w: box.w, h: box.h, color };
}

export function buildingVolumeLayers(enabled = BUILDING_VOLUME_ENABLED): VolumeLayer[] {
  if (!buildingVolumeOn(enabled)) return [];
  return HOUSES.map((house) => {
    const left = house.x - house.ax;
    const top = house.y - house.ay;
    return {
      sort: house.y + 2,
      pixels: [
        worldBox(left, top, house.ridge, LIP),
        worldBox(left, top, house.eave, EAVE),
        worldBox(left, top, house.wall, WALL),
        worldBox(left, top, house.lit, LIT),
      ],
    };
  });
}

export function buildingVolumePixels(enabled = BUILDING_VOLUME_ENABLED): Pixel[] {
  return buildingVolumeLayers(enabled).flatMap((layer) => layer.pixels);
}

export function buildingVolumeCount(enabled = BUILDING_VOLUME_ENABLED) {
  return buildingVolumePixels(enabled).length;
}
