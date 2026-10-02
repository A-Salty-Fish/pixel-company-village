/**
 * PV-PM-082 — 相伴 shows whether it is on, and a wave leaves a short cue.
 * PV-D-018 — the person-card wave and the map-bar wave share that cue.
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

/** Person-card wave and map-bar wave. Both leave the same cue while 相伴 is on. */
export const COMPANION_WAVE_ENTRIES = ["panel", "header"] as const;
export type CompanionWaveEntry = (typeof COMPANION_WAVE_ENTRIES)[number];

export type CompanionWaveCue = {
  line: string;
  name: string;
  at: number;
};

/**
 * One map cue plus the foot ring. Reduced motion still returns the cue;
 * the ring pixels do not animate.
 */
export function companionWaveCue(input: {
  entry: CompanionWaveEntry;
  companionOn: boolean;
  name: string | null | undefined;
  line: string;
  at: number;
  enabled?: boolean;
}): CompanionWaveCue | null {
  if (input.entry !== "panel" && input.entry !== "header") return null;
  if (!companionReadOn(input.enabled)) return null;
  if (!input.companionOn) return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const line = input.line.trim();
  if (!name || !line) return null;
  if (!Number.isFinite(input.at)) return null;
  return { line, name, at: input.at };
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
