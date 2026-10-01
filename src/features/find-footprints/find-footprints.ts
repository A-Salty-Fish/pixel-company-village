/**
 * PV-PM-062 — faint footprints under the avatar after 找我 settles.
 * Reduced motion keeps one still mark and fades it sooner.
 * Set FIND_FOOTPRINTS_ENABLED to false to leave the ground clear.
 */

import type { Pixel } from "@/lib/worldcraft";

export const FIND_FOOTPRINTS_ENABLED = true;
export const FIND_SETTLE_MS = 450;
export const FIND_FOOTPRINT_MS = 8_000;
export const FIND_FOOTPRINT_REDUCED_MS = 2_200;
export const FIND_FOOTPRINT_COUNT = 4;
export const FIND_FOOTPRINT_REDUCED_COUNT = 1;

const STEPS = [
  { dx: -8, dy: 4 },
  { dx: -2, dy: 8 },
  { dx: 6, dy: 5 },
  { dx: 11, dy: 9 },
  { dx: 15, dy: 3 },
] as const;

export function findFootprintFadeMs(reduced: boolean) {
  return reduced ? FIND_FOOTPRINT_REDUCED_MS : FIND_FOOTPRINT_MS;
}

export function findFootprintCount(reduced: boolean, enabled = FIND_FOOTPRINTS_ENABLED) {
  if (!enabled) return 0;
  return reduced ? FIND_FOOTPRINT_REDUCED_COUNT : FIND_FOOTPRINT_COUNT;
}

export function findFootprintMark(
  elapsedMs: number,
  reduced: boolean,
  enabled = FIND_FOOTPRINTS_ENABLED,
): "wait" | "show" | "off" {
  if (!enabled || !Number.isFinite(elapsedMs) || elapsedMs < 0) return "off";
  if (elapsedMs < FIND_SETTLE_MS) return "wait";
  if (elapsedMs >= FIND_SETTLE_MS + findFootprintFadeMs(reduced)) return "off";
  return "show";
}

function ink(alpha: number) {
  const a = Math.max(0.05, Math.min(0.42, alpha)).toFixed(2);
  return `rgba(74, 48, 24, ${a})`;
}

/** World pixels. Empty until the camera has settled, then they fade. */
export function findFootprintPixels(
  x: number,
  y: number,
  elapsedMs: number,
  reduced: boolean,
  enabled = FIND_FOOTPRINTS_ENABLED,
): Pixel[] {
  if (findFootprintMark(elapsedMs, reduced, enabled) !== "show") return [];
  const life = elapsedMs - FIND_SETTLE_MS;
  const fade = findFootprintFadeMs(reduced);
  const alpha = 0.4 * (1 - life / fade);
  const count = findFootprintCount(reduced, enabled);
  const pixels: Pixel[] = [];
  for (let i = 0; i < count; i += 1) {
    const step = STEPS[i];
    if (!step) break;
    const left = Math.round(x + step.dx);
    const top = Math.round(y + step.dy);
    pixels.push(
      { x: left, y: top, w: 3, h: 2, color: ink(alpha) },
      { x: left + 1, y: top + 2, w: 1, h: 1, color: ink(alpha * 0.7) },
    );
  }
  return pixels;
}
