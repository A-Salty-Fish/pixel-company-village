/**
 * PV-PM-067 — a few light leaves in October.
 * A stored on/off choice overrides the month. Reduced motion holds the leaves still.
 * Set OCTOBER_WISP_ENABLED to false to clear them.
 */

import type { Pixel } from "@/lib/worldcraft";

export const OCTOBER_WISP_ENABLED = true;
export const OCTOBER_WISP_KEY = "village:october-wisp-v1";
export const OCTOBER_WISP_COUNT = 4;

export type WispChoice = "on" | "off" | null;

const WISPS = [
  { x: 280, y: 96, phase: 0.4 },
  { x: 540, y: 140, phase: 1.2 },
  { x: 860, y: 88, phase: 2.1 },
  { x: 400, y: 520, phase: 0.7 },
] as const;

export function readWispChoice(raw: string | null): WispChoice {
  if (raw === "on" || raw === "off") return raw;
  return null;
}

export function octoberWispOn(input: { month: number; stored: WispChoice; enabled?: boolean }) {
  const enabled = input.enabled ?? OCTOBER_WISP_ENABLED;
  if (!enabled) return false;
  if (input.stored === "off") return false;
  if (input.stored === "on") return true;
  return input.month === 10;
}

export function octoberWispMark(on: boolean, reduced: boolean): "drift" | "still" | "off" {
  if (!on) return "off";
  return reduced ? "still" : "drift";
}

export function loadOctoberWisp(): WispChoice {
  if (typeof localStorage === "undefined") return null;
  try {
    return readWispChoice(localStorage.getItem(OCTOBER_WISP_KEY));
  } catch {
    return null;
  }
}

export function saveOctoberWisp(choice: "on" | "off") {
  if (!OCTOBER_WISP_ENABLED || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(OCTOBER_WISP_KEY, choice);
  } catch {
    /* private mode */
  }
}

export function octoberWispFrame(reduced: boolean, t: number, enabled = OCTOBER_WISP_ENABLED): Pixel[] {
  if (!enabled) return [];
  const pixels: Pixel[] = [];
  for (const leaf of WISPS) {
    const drift = reduced ? 0 : Math.round(Math.sin(t * 0.35 + leaf.phase) * 6);
    const fall = reduced ? 0 : Math.round((Math.sin(t * 0.2 + leaf.phase) + 1) * 3);
    const x = leaf.x + drift;
    const y = leaf.y + fall;
    pixels.push(
      { x, y, w: 3, h: 2, color: "#e08a45" },
      { x: x + 2, y: y + 1, w: 2, h: 1, color: "#a34b28" },
    );
  }
  return pixels;
}

export function octoberWispCount(on: boolean, enabled = OCTOBER_WISP_ENABLED) {
  if (!enabled || !on) return 0;
  return OCTOBER_WISP_COUNT;
}
