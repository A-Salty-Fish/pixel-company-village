/**
 * PV-D-017 — a tall phone stretched the whole world into the map.
 * Settled plots sat in the top third. The empty lower meadow read as a
 * solid navy slab, day and night. Frame those plots instead.
 * Set NARROW_MAP_FILL_ENABLED to false to show the full world again.
 */

import { clampCamera, viewSpan } from "@/lib/pixel-scene";

export const NARROW_MAP_FILL_ENABLED = true;

/** Canvas taller than this, relative to its width, is a phone map. */
export const PORTRAIT_RATIO = 1.2;

const ROOF = 150;
const FOOT = 64;
const SIDE = 56;

export type MapPoint = { x: number; y: number };

export function narrowMapFillOn(enabled = NARROW_MAP_FILL_ENABLED) {
  return enabled;
}

export function portraitMap(cssW: number, cssH: number) {
  return cssW >= 32 && cssH > cssW * PORTRAIT_RATIO;
}

export function settledBounds(people: readonly MapPoint[]) {
  let x0 = Number.POSITIVE_INFINITY;
  let y0 = Number.POSITIVE_INFINITY;
  let x1 = Number.NEGATIVE_INFINITY;
  let y1 = Number.NEGATIVE_INFINITY;
  for (const person of people) {
    x0 = Math.min(x0, person.x - SIDE);
    x1 = Math.max(x1, person.x + SIDE);
    y0 = Math.min(y0, person.y - ROOF);
    y1 = Math.max(y1, person.y + FOOT);
  }
  return { x0, y0, x1, y1 };
}

/**
 * Close enough that a tall phone is not the whole world.
 * The full-world view is what left the empty meadow in the bottom half.
 */
export function fillZoom(contentH: number) {
  if (contentH <= viewSpan(3).h + 24) return 3;
  return 2;
}

/** The upper half of the settlement. A phone opens there, not on the far meadow. */
export function upperSettlement(people: readonly MapPoint[]) {
  const ys = people.map((person) => person.y).sort((a, b) => a - b);
  const cut = ys[Math.min(ys.length - 1, Math.max(0, Math.ceil(ys.length * 0.5) - 1))] ?? ys[0];
  const upper = people.filter((person) => person.y <= cut + 40);
  return upper.length > 0 ? upper : people;
}

export function narrowMapFillMark(zoom: number, enabled = NARROW_MAP_FILL_ENABLED): "village" | "world" {
  return enabled && zoom > 1 ? "village" : "world";
}

/**
 * Camera for a portrait map. Null on a wide map, or when the flag is off.
 * Always zoomed in. Zoom 1 on a tall phone is the empty lower slab.
 */
export function narrowFillCamera(input: {
  people: readonly MapPoint[];
  cssW: number;
  cssH: number;
  enabled?: boolean;
}) {
  if (!narrowMapFillOn(input.enabled)) return null;
  if (!portraitMap(input.cssW, input.cssH)) return null;
  if (input.people.length === 0) return null;
  const bounds = settledBounds(upperSettlement(input.people));
  const zoom = fillZoom(bounds.y1 - bounds.y0);
  const span = viewSpan(zoom);
  const cam = clampCamera((bounds.x0 + bounds.x1) / 2 - span.w / 2, (bounds.y0 + bounds.y1) / 2 - span.h / 2, zoom);
  return { zoom, x: cam.x, y: cam.y };
}
