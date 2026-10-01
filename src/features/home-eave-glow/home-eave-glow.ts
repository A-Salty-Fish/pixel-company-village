/**
 * PV-PM-066 — the caller's roof pin breathes after a name is chosen.
 * 「回家」 flashes the same glow once. Reduced motion holds a still glow.
 * Set HOME_EAVE_GLOW_ENABLED to false to leave the pin as it was.
 */

import type { Pixel } from "@/lib/worldcraft";

export const HOME_EAVE_GLOW_ENABLED = true;
export const EAVE_FLASH_MS = 700;

export type EaveGlow = "breath" | "flash" | "still" | "off";

export function eaveGlowMark(input: {
  hasSelf: boolean;
  flashing: boolean;
  reduced: boolean;
  enabled?: boolean;
}): EaveGlow {
  const enabled = input.enabled ?? HOME_EAVE_GLOW_ENABLED;
  if (!enabled || !input.hasSelf) return "off";
  if (input.flashing) return "flash";
  return input.reduced ? "still" : "breath";
}

export function eaveFlashOn(at: number | null, now: number, enabled = HOME_EAVE_GLOW_ENABLED) {
  if (!enabled || at == null) return false;
  const elapsed = now - at;
  return elapsed >= 0 && elapsed < EAVE_FLASH_MS;
}

function alphaFor(mode: EaveGlow, t: number) {
  if (mode === "flash") return 0.95;
  if (mode === "still") return 0.5;
  if (mode === "breath") return 0.28 + 0.42 * (0.5 + 0.5 * Math.sin(t * 2.2));
  return 0;
}

export function eaveGlowPixels(
  anchor: { x: number; y: number } | null,
  t: number,
  mode: EaveGlow,
  enabled = HOME_EAVE_GLOW_ENABLED,
): Pixel[] {
  if (!enabled || !anchor || mode === "off") return [];
  const alpha = alphaFor(mode, t);
  const color = `rgba(242, 209, 92, ${alpha.toFixed(3)})`;
  const wide = mode === "flash" ? 3 : 0;
  return [
    { x: anchor.x - 14 - wide, y: anchor.y - 36, w: 16 + wide * 2, h: 3, color },
    { x: anchor.x - 11, y: anchor.y - 39, w: 10, h: 2, color },
    { x: anchor.x - 7, y: anchor.y - 33, w: 4, h: 2, color: `rgba(255, 246, 216, ${Math.min(1, alpha + 0.15).toFixed(3)})` },
  ];
}

export function eaveGlowCopy() {
  return [] as string[];
}
