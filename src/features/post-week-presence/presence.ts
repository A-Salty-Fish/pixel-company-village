/**
 * PV-PM-017 — one local glance after the week board is 3/3.
 * A ground ring, not a wave. Stores the week key only.
 * Set POST_WEEK_PRESENCE_ENABLED to false to hide the loop.
 */

import type { Pixel } from "@/lib/worldcraft";

export const POST_WEEK_PRESENCE_ENABLED = true;

export const GLANCE_ACT = "路过看一眼";
export const GLANCE_READY = "本周的事做完了。还可以在村里路过看一眼。";
export const GLANCE_DONE = "邻里应了一眼。院子留着一圈光。";
export const GLANCE_NOTE = "只记在这台电脑，不记说过的话。";

export const RESONANCE_RING = "#7ec8e3";
export const GLANCE_TICK = "#f2d15c";
/** Wave bubbles use this fill. The ring must not. */
export const WAVE_BUBBLE = "#ffe7a3";

const CHAT_KEY = /chat|transcript|snippet|message|原文|他说/i;

export type GlanceSave = { week: string };
export type PresencePhase = "off" | "hidden" | "ready" | "done";

export function presencePhase(input: {
  weekComplete: boolean;
  viewer: string | null;
  week: string;
  savedWeek: string | null;
  enabled?: boolean;
}): PresencePhase {
  const enabled = input.enabled ?? POST_WEEK_PRESENCE_ENABLED;
  if (!enabled) return "off";
  if (!input.weekComplete || !input.viewer) return "hidden";
  if (input.savedWeek === input.week) return "done";
  return "ready";
}

export function glanceStorageKey(viewer: string) {
  return `village:post-week-presence:v1:${viewer}`;
}

export function sanitizeGlance(raw: unknown, week: string): GlanceSave | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length !== 1 || keys[0] !== "week") return null;
  if (typeof rec.week !== "string" || rec.week !== week) return null;
  if (CHAT_KEY.test(rec.week)) return null;
  return { week: rec.week };
}

export function parseGlance(raw: string | null, week: string): GlanceSave | null {
  if (!raw) return null;
  try {
    return sanitizeGlance(JSON.parse(raw), week);
  } catch {
    return null;
  }
}

export function glancePayload(saved: GlanceSave) {
  return JSON.stringify({ week: saved.week });
}

export function loadGlance(viewer: string | null, week: string): GlanceSave | null {
  if (!viewer || typeof window === "undefined") return null;
  try {
    return parseGlance(window.localStorage.getItem(glanceStorageKey(viewer)), week);
  } catch {
    return null;
  }
}

export function storeGlance(viewer: string, week: string): GlanceSave {
  const saved: GlanceSave = { week };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(glanceStorageKey(viewer), glancePayload(saved));
    } catch {
      /* private mode */
    }
  }
  return saved;
}

export function glanceCopyLines() {
  return [GLANCE_ACT, GLANCE_READY, GLANCE_DONE, GLANCE_NOTE];
}

type Spot = { name: string; x: number; y: number; homeX?: number; homeY?: number };

/** Nearest neighbor's feet, or the yard when nobody else is placed. */
export function glanceSpot(self: Spot | null, others: { name: string; x: number; y: number }[]) {
  if (self) {
    let best: { x: number; y: number; d: number } | null = null;
    for (const other of others) {
      if (other.name === self.name) continue;
      const dx = other.x - self.x;
      const dy = other.y - self.y;
      const d = dx * dx + dy * dy;
      if (!best || d < best.d) best = { x: other.x, y: other.y, d };
    }
    if (best) return { x: Math.round(best.x), y: Math.round(best.y + 8), kind: "neighbor" as const };
  }
  const x = Math.round((self?.homeX ?? self?.x ?? 480) + 28);
  const y = Math.round((self?.homeY ?? self?.y ?? 520) + 18);
  return { x, y, kind: "yard" as const };
}

/** Still ground ring plus a two-tick glance. Not the wave bubble. */
export function resonancePixels(x: number, y: number): Pixel[] {
  return [
    { x: x - 12, y, w: 4, h: 2, color: RESONANCE_RING },
    { x: x + 8, y, w: 4, h: 2, color: RESONANCE_RING },
    { x: x - 8, y: y - 5, w: 3, h: 2, color: RESONANCE_RING },
    { x: x + 5, y: y - 5, w: 3, h: 2, color: RESONANCE_RING },
    { x: x - 8, y: y + 4, w: 3, h: 2, color: RESONANCE_RING },
    { x: x + 5, y: y + 4, w: 3, h: 2, color: RESONANCE_RING },
    { x: x - 2, y: y - 16, w: 2, h: 2, color: GLANCE_TICK },
    { x: x + 3, y: y - 16, w: 2, h: 2, color: GLANCE_TICK },
  ];
}

export function readsAsWave(pixels: Pixel[]) {
  return pixels.some((pixel) => pixel.color === WAVE_BUBBLE && pixel.w >= 10);
}
