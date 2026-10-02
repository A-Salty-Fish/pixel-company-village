/**
 * PV-PM-097 — path stones share one honey warmth.
 * A thin wash pulls the cool green flecks in some path tiles toward
 * the same terracotta, and every grit chip uses the hearth stone.
 * Set PATH_STONE_WARM_ENABLED to false to keep the mixed tiles.
 */

import { blendOver, type Rgb } from "@/features/night-wash/night-wash";

export const PATH_STONE_WARM_ENABLED = true;

/** Cool grass speck measured on path_1. The wash has to warm this one. */
export const PATH_FLECK: Rgb = { r: 128, g: 144, b: 64 };
/** The common path tile body. */
export const PATH_BODY: Rgb = { r: 165, g: 120, b: 85 };

export const PATH_WASH = { r: 176, g: 104, b: 56, a: 0.28 };

/** Daytime chip. The lit edge matches the night hearth stones. */
export const PATH_GRIT = "#c4a060";
export const PATH_GRIT_LIT = "#e7c48a";

export function pathStoneWarmOn(enabled = PATH_STONE_WARM_ENABLED) {
  return enabled;
}

export function pathStoneWarmMark(enabled = PATH_STONE_WARM_ENABLED): "honey" | "mixed" {
  return enabled ? "honey" : "mixed";
}

export function pathStoneWash(enabled = PATH_STONE_WARM_ENABLED) {
  return enabled ? PATH_WASH : null;
}

export function pathStoneGrit(enabled = PATH_STONE_WARM_ENABLED) {
  return enabled ? PATH_GRIT : "rgba(92, 58, 28, 0.45)";
}

export function pathStoneGritLit(enabled = PATH_STONE_WARM_ENABLED) {
  return enabled ? PATH_GRIT_LIT : null;
}

export function warmedPath(pixel: Rgb, enabled = PATH_STONE_WARM_ENABLED): Rgb {
  if (!enabled) return pixel;
  return blendOver(pixel, PATH_WASH);
}

export function pathWarmth(pixel: Rgb) {
  return pixel.r - pixel.b;
}
