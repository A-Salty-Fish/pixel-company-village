/**
 * PV-PM-082 — 相伴 shows whether it is on, and a wave leaves a short cue.
 * The cue sits on the map for a couple of seconds. It is not the week board.
 * Set COMPANION_READ_ENABLED to false to keep the quiet toggle.
 */

import type { Pixel } from "@/lib/worldcraft";

export const COMPANION_READ_ENABLED = true;
export const COMPANION_CUE_MS = 2_800;

export function companionReadOn(enabled = COMPANION_READ_ENABLED) {
  return enabled;
}

export function companionLabel(on: boolean, enabled = COMPANION_READ_ENABLED) {
  if (!enabled) return "相伴";
  return on ? "相伴 · 开着" : "相伴";
}

export function companionMark(on: boolean, enabled = COMPANION_READ_ENABLED): "on" | "off" {
  if (!enabled) return "off";
  return on ? "on" : "off";
}

export function waveCueVisible(elapsedMs: number, enabled = COMPANION_READ_ENABLED) {
  if (!enabled) return false;
  return Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < COMPANION_CUE_MS;
}

/** A small warm ring. Reduced motion uses the same still pixels. */
export function waveCuePixels(x: number, y: number, enabled = COMPANION_READ_ENABLED): Pixel[] {
  if (!enabled) return [];
  return [
    { x: x - 8, y: y - 2, w: 16, h: 2, color: "#fff6d8" },
    { x: x - 6, y: y - 6, w: 2, h: 8, color: "#f2d15c" },
    { x: x + 4, y: y - 6, w: 2, h: 8, color: "#f2d15c" },
  ];
}

export function companionCopy() {
  return [companionLabel(true), companionLabel(false)];
}
