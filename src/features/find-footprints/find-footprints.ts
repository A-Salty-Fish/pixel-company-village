/**
 * PV-PM-062 — faint footprints after 「找我」 has settled on the caller.
 * Three to five marks fade over about 8 seconds.
 * Reduced motion keeps one still mark and fades it faster.
 * Set FIND_FOOTPRINTS_ENABLED to false to leave the ground clear.
 */

import type { Pixel } from "@/lib/worldcraft";

export const FIND_FOOTPRINTS_ENABLED = true;
export const FIND_PRINT_MS = 8_000;
export const FIND_PRINT_STILL_MS = 2_600;
export const FIND_PRINT_MIN = 3;
export const FIND_PRINT_MAX = 5;

function salt(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export function findPrintCount(name: string, reduced: boolean, enabled = FIND_FOOTPRINTS_ENABLED) {
  if (!enabled) return 0;
  if (reduced) return 1;
  return FIND_PRINT_MIN + (salt(name || "me") % (FIND_PRINT_MAX - FIND_PRINT_MIN + 1));
}

export function findPrintSpan(reduced: boolean) {
  return reduced ? FIND_PRINT_STILL_MS : FIND_PRINT_MS;
}

export function findPrintAlpha(elapsedMs: number, reduced: boolean, enabled = FIND_FOOTPRINTS_ENABLED) {
  if (!enabled) return 0;
  const span = findPrintSpan(reduced);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= span) return 0;
  const fade = 1 - elapsedMs / span;
  return (reduced ? 0.55 : 0.42) * fade;
}

export function findPrintMark(
  at: number | null,
  now: number,
  reduced: boolean,
  enabled = FIND_FOOTPRINTS_ENABLED,
): "live" | "still" | "off" {
  if (findPrintAlpha(at == null ? -1 : now - at, reduced, enabled) <= 0) return "off";
  return reduced ? "still" : "live";
}

export function findPrintPixels(input: {
  origin: { x: number; y: number } | null;
  name: string;
  elapsedMs: number;
  reduced: boolean;
  enabled?: boolean;
}): Pixel[] {
  const enabled = input.enabled ?? FIND_FOOTPRINTS_ENABLED;
  const alpha = findPrintAlpha(input.elapsedMs, input.reduced, enabled);
  if (!input.origin || alpha <= 0) return [];
  const count = findPrintCount(input.name, input.reduced, enabled);
  const color = `rgba(90, 58, 32, ${alpha.toFixed(3)})`;
  const pixels: Pixel[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(input.origin.x - 14 - i * 9);
    const y = Math.round(input.origin.y + 2 + (i % 2) * 4);
    pixels.push({ x, y, w: 3, h: 2, color }, { x: x + 4, y, w: 2, h: 2, color });
  }
  return pixels;
}

export function findPrintCopy() {
  return [] as string[];
}
