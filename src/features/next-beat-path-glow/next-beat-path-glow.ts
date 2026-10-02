/**
 * PV-PM-088 — after a next-beat tap, two or three warm stones breathe along the path.
 * Quiet villages and reduced motion keep them still. No crossing lamp, no blink.
 * When the stones fade, one soft suggestion can be dismissed.
 * Set NEXT_BEAT_PATH_GLOW_ENABLED to false to keep the quieter PV-PM-074 stones.
 */

import type { Pixel } from "@/lib/worldcraft";
import { NEXT_BEATS, type NextBeatId } from "@/features/week-next-beat/next-beat";

export const NEXT_BEAT_PATH_GLOW_ENABLED = true;
export const NEXT_BEAT_GLOW_MS = 2_600;
export const NEXT_BEAT_GLOW_TILES = 3;

const STILL = "#f2d15c";
const HIGH = "#fff6d8";
const LOW = "#e7b14a";
const WARM = new Set([STILL, HIGH, LOW]);

export type NextBeatGlow = "pulse" | "still" | "off";
export type GlowPoint = { x: number; y: number };

const BEAT_IDS = new Set<string>(NEXT_BEATS.map((beat) => beat.id));

export function nextBeatGlowOn(enabled = NEXT_BEAT_PATH_GLOW_ENABLED) {
  return enabled;
}

export function isNextBeatAim(kind: string | null | undefined, enabled = NEXT_BEAT_PATH_GLOW_ENABLED) {
  if (!enabled || !kind) return false;
  return BEAT_IDS.has(kind);
}

export function nextBeatGlowMark(input: {
  elapsedMs: number;
  reduced: boolean;
  quiet: boolean;
  enabled?: boolean;
}): NextBeatGlow {
  const enabled = input.enabled ?? NEXT_BEAT_PATH_GLOW_ENABLED;
  if (!enabled) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= NEXT_BEAT_GLOW_MS) return "off";
  if (input.reduced || input.quiet) return "still";
  return "pulse";
}

/** Two or three stones strictly between here and the stop. Not a lamp. */
export function nextBeatGlowTiles(from: GlowPoint, to: GlowPoint, count = NEXT_BEAT_GLOW_TILES): GlowPoint[] {
  const n = Math.max(2, Math.min(3, Math.round(count)));
  const tiles: GlowPoint[] = [];
  for (let i = 1; i <= n; i += 1) {
    const t = i / (n + 1);
    tiles.push({
      x: Math.round(from.x + (to.x - from.x) * t),
      y: Math.round(from.y + (to.y - from.y) * t),
    });
  }
  return tiles;
}

export function nextBeatGlowPixels(
  from: GlowPoint,
  to: GlowPoint,
  mode: NextBeatGlow,
  t: number,
  enabled = NEXT_BEAT_PATH_GLOW_ENABLED,
): Pixel[] {
  if (!enabled || mode === "off") return [];
  const hot = mode === "pulse" && Math.sin(t * 1.2) > 0;
  const core = mode === "still" ? STILL : hot ? HIGH : LOW;
  return nextBeatGlowTiles(from, to).flatMap((spot) => [
    { x: spot.x - 7, y: spot.y - 4, w: 14, h: 9, color: LOW },
    { x: spot.x - 4, y: spot.y - 2, w: 8, h: 5, color: core },
  ]);
}

export function nextBeatGlowColorsAreWarm(pixels: Pixel[]) {
  return pixels.length > 0 && pixels.every((pixel) => WARM.has(pixel.color));
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number };

export function paintNextBeatPathGlow(
  ctx: CanvasRenderingContext2D,
  input: Cam & {
    from: GlowPoint;
    to: GlowPoint;
    elapsedMs: number;
    reduced: boolean;
    quiet: boolean;
    t: number;
  },
) {
  const mode = nextBeatGlowMark(input);
  const pixels = nextBeatGlowPixels(input.from, input.to, mode, input.t);
  if (pixels.length === 0) return { mode: "off" as const, stones: 0 };
  const breathe = mode === "pulse" ? 0.78 + 0.18 * (0.5 + 0.5 * Math.sin(input.t * 1.2)) : 0.96;
  ctx.save();
  ctx.globalAlpha = breathe;
  let stones = 0;
  for (const pixel of pixels) {
    const sx = ((pixel.x - input.camX) / input.worldW) * input.viewW;
    const sy = ((pixel.y - input.camY) / input.worldH) * input.viewH;
    const sw = (pixel.w / input.worldW) * input.viewW;
    const sh = (pixel.h / input.worldH) * input.viewH;
    if (sx + sw < 0 || sy + sh < 0 || sx > input.viewW || sy > input.viewH) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(sx, sy, Math.max(6, sw), Math.max(4, sh));
    stones += 1;
  }
  ctx.restore();
  return { mode, stones };
}

export function nextBeatSuggestion(justId: string, enabled = NEXT_BEAT_PATH_GLOW_ENABLED) {
  if (!enabled || !BEAT_IDS.has(justId)) return null;
  const index = NEXT_BEATS.findIndex((beat) => beat.id === justId);
  const next = NEXT_BEATS[(index + 1) % NEXT_BEATS.length];
  if (!next) return null;
  return { id: next.id as NextBeatId, line: `也可以去看${next.label}` };
}

/** The suggestion waits until the stones have finished, and leaves when dismissed. */
export function nextBeatSuggestReady(elapsedMs: number, dismissed: boolean, enabled = NEXT_BEAT_PATH_GLOW_ENABLED) {
  if (!enabled || dismissed) return false;
  return Number.isFinite(elapsedMs) && elapsedMs >= NEXT_BEAT_GLOW_MS;
}

export function nextBeatGlowCopy() {
  return ["也可以去看村口", "也可以去看湖边", "也可以去看长椅"];
}
