/**
 * PV-PM-035 — a stay-awhile neighbor or lamp slot paints a soft pulse and a silhouette.
 * The click stays on that slot and still goes through villageFeedback.
 * Set WAITING_CUE_ENABLED to false to leave the shore empty.
 */

import type { Pixel } from "@/lib/worldcraft";

export const WAITING_CUE_ENABLED = true;

export type WaitingKind = "lake" | "lamp";

export type WaitingCue = {
  kind: WaitingKind;
  x: number;
  y: number;
};

type Slot = { kind: string; x: number; y: number };

/** Lake person first, then the lamp. Toys do not imply someone waiting. */
export function waitingCueFor(slots: readonly Slot[], enabled = WAITING_CUE_ENABLED): WaitingCue | null {
  if (!enabled) return null;
  const neighbor = slots.find((slot) => slot.kind === "neighbor");
  if (neighbor) return { kind: "lake", x: neighbor.x + 16, y: neighbor.y };
  const lamp = slots.find((slot) => slot.kind === "lamp");
  if (lamp) return { kind: "lamp", x: lamp.x + 14, y: lamp.y + 8 };
  return null;
}

export function waitingCueMark(cue: WaitingCue | null, enabled = WAITING_CUE_ENABLED): WaitingKind | "off" {
  if (!enabled || !cue) return "off";
  return cue.kind;
}

/** Map pixels only. Reduced motion keeps the silhouette and a still ring. */
export function waitingCuePixels(
  x: number,
  y: number,
  t: number,
  reduced: boolean,
  enabled = WAITING_CUE_ENABLED,
): Pixel[] {
  if (!enabled) return [];
  const pulse = reduced ? 0 : Math.round(Math.sin(t * 1.6) * 2);
  const ring = reduced ? "#c4a060" : pulse > 0 ? "#f2d15c" : "#e7c56a";
  return [
    { x: x - 2, y: y - 18, w: 5, h: 4, color: "#3a2418" },
    { x: x - 3, y: y - 13, w: 7, h: 8, color: "#5a3a28" },
    { x: x - 1, y: y - 4, w: 2, h: 5, color: "#3a2418" },
    { x: x + 2, y: y - 4, w: 2, h: 5, color: "#3a2418" },
    { x: x - 8 - pulse, y: y + 2, w: 16 + pulse * 2, h: 2, color: ring },
    { x: x - 5, y: y - 22 - pulse, w: 2, h: 2, color: ring },
  ];
}
