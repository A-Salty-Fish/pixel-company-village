/**
 * PV-PM-066 — the own-roof pin breathes after a name is chosen.
 * 回家 flashes it once. Reduced motion keeps a still glow and a still flash.
 * Set HOME_BREATH_ENABLED to false to leave the pin as it was.
 */

import type { Pixel } from "@/lib/worldcraft";

export const HOME_BREATH_ENABLED = true;
export const HOME_FLASH_MS = 700;

export function homeBreathMark(input: {
  hasSelf: boolean;
  flashAt: number | null;
  now: number;
  enabled?: boolean;
}): "off" | "glow" | "flash" {
  const enabled = input.enabled ?? HOME_BREATH_ENABLED;
  if (!enabled || !input.hasSelf) return "off";
  if (input.flashAt != null && input.now >= input.flashAt && input.now - input.flashAt < HOME_FLASH_MS) return "flash";
  return "glow";
}

export function homeBreathPixels(
  anchor: { x: number; y: number } | null,
  t: number,
  mark: "off" | "glow" | "flash",
  reduced: boolean,
): Pixel[] {
  if (!anchor || mark === "off") return [];
  const breathe = reduced || mark === "flash" ? 0 : Math.sin(t * 1.7);
  const color = mark === "flash" ? "#fff6d8" : breathe > 0 ? "#f2d15c" : "#c4a06a";
  const spread = mark === "flash" ? 2 : breathe > 0.4 ? 1 : 0;
  return [
    { x: anchor.x - 11 - spread, y: anchor.y - 33, w: 11 + spread * 2, h: 1, color },
    { x: anchor.x - 8, y: anchor.y - 35 - spread, w: 5, h: 2, color },
    { x: anchor.x - 6, y: anchor.y - 31, w: 1, h: 3, color: "#a68458" },
  ];
}
