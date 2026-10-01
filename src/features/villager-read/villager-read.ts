/**
 * PV-D-023 — people stand on an oval shadow instead of a square stamp.
 * Idle cats lift one pixel. Reduced motion keeps the shadow and skips the lift.
 * Set VILLAGER_READ_ENABLED to false to restore the sticker box.
 */

import type { Pixel } from "@/lib/worldcraft";

export const VILLAGER_READ_ENABLED = true;

export function villagerReadOn(enabled = VILLAGER_READ_ENABLED) {
  return enabled;
}

export function villagerReadMark(enabled = VILLAGER_READ_ENABLED): "stood" | "stamp" {
  return enabled ? "stood" : "stamp";
}

/** Selected cats already bob. This lift is only for the quiet ones. */
export function villagerIdleBob(input: { t: number; reduced: boolean; selected: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? VILLAGER_READ_ENABLED;
  if (!enabled || input.reduced || input.selected) return 0;
  return Math.sin(input.t * 1.35) > 0.15 ? 1 : 0;
}

export function villagerShadowPixels(x: number, y: number, enabled = VILLAGER_READ_ENABLED): Pixel[] {
  if (!enabled) return [];
  const left = Math.round(x - 10);
  const top = Math.round(y - 1);
  return [
    { x: left + 1, y: top, w: 18, h: 2, color: "rgba(20, 28, 12, 0.55)" },
    { x: left - 1, y: top + 1, w: 22, h: 2, color: "rgba(16, 12, 6, 0.42)" },
    { x: left + 5, y: top + 3, w: 10, h: 1, color: "rgba(16, 12, 6, 0.22)" },
  ];
}
