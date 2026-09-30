/**
 * self-yard-marker — a small still pin on the viewer's own roof.
 * Distinct from the find-me pulse, which stays on the person.
 * Set SELF_YARD_MARKER_ENABLED to false to leave only the find-me ring.
 */

import type { Pixel } from "@/lib/worldcraft";

export const SELF_YARD_MARKER_ENABLED = true;

/** Muted daily pin. The find-me ring uses #fff6d8 and moves. */
export const YARD_PIN_COLOR = "#a68458";
export const YARD_POST_COLOR = "#6a3d18";

export function selfYardMark(hasSelf: boolean, enabled = SELF_YARD_MARKER_ENABLED): "pin" | "off" {
  if (!enabled || !hasSelf) return "off";
  return "pin";
}

export function selfYardPixels(
  anchor: { x: number; y: number } | null,
  enabled = SELF_YARD_MARKER_ENABLED,
): Pixel[] {
  if (!enabled || !anchor) return [];
  return [
    { x: anchor.x - 6, y: anchor.y - 28, w: 1, h: 7, color: YARD_POST_COLOR },
    { x: anchor.x - 8, y: anchor.y - 30, w: 5, h: 2, color: YARD_PIN_COLOR },
  ];
}

export function pixelArea(pixels: readonly Pixel[]) {
  return pixels.reduce((sum, pixel) => sum + pixel.w * pixel.h, 0);
}
