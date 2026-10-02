/**
 * PV-PM-074 — a short run of warm stones between here and the next stop.
 * Quiet villages and reduced motion keep the stones still. No lamp flicker.
 * Set PATH_MICRO_GLOW_ENABLED to false to leave the road plain.
 */

import type { Pixel } from "@/lib/worldcraft";

export const PATH_MICRO_GLOW_ENABLED = true;
export const PATH_GLOW_MS = 2_600;
export const PATH_GLOW_TILES = 3;

const STILL = "#f2d15c";
const HIGH = "#fff6d8";
const LOW = "#e7b14a";

export type PathGlow = "pulse" | "still" | "off";
export type GlowPoint = { x: number; y: number };

export function pathGlowOn(enabled = PATH_MICRO_GLOW_ENABLED) {
  return enabled;
}

export function pathGlowMark(input: {
  elapsedMs: number;
  reduced: boolean;
  quiet: boolean;
  enabled?: boolean;
}): PathGlow {
  const enabled = input.enabled ?? PATH_MICRO_GLOW_ENABLED;
  if (!enabled) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= PATH_GLOW_MS) return "off";
  if (input.reduced || input.quiet) return "still";
  return "pulse";
}

/** Two or three stones strictly along the segment. Not a lamp, not a slab. */
export function pathGlowTiles(from: GlowPoint, to: GlowPoint, count = PATH_GLOW_TILES): GlowPoint[] {
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

export function pathGlowPixels(
  from: GlowPoint,
  to: GlowPoint,
  mode: PathGlow,
  t: number,
  enabled = PATH_MICRO_GLOW_ENABLED,
): Pixel[] {
  if (!enabled || mode === "off") return [];
  const hot = mode === "pulse" && Math.sin(t * 1.4) > 0;
  const color = mode === "still" ? STILL : hot ? HIGH : LOW;
  return pathGlowTiles(from, to).map((spot) => ({
    x: spot.x - 2,
    y: spot.y - 1,
    w: 4,
    h: 3,
    color,
  }));
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number };

export function paintPathMicroGlow(
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
  const mode = pathGlowMark(input);
  const pixels = pathGlowPixels(input.from, input.to, mode, input.t);
  if (pixels.length === 0) return { mode: "off" as const, stones: 0 };
  ctx.save();
  ctx.globalAlpha = mode === "still" ? 0.92 : 0.88;
  let stones = 0;
  for (const pixel of pixels) {
    const sx = ((pixel.x - input.camX) / input.worldW) * input.viewW;
    const sy = ((pixel.y - input.camY) / input.worldH) * input.viewH;
    const sw = (pixel.w / input.worldW) * input.viewW;
    const sh = (pixel.h / input.worldH) * input.viewH;
    if (sx + sw < 0 || sy + sh < 0 || sx > input.viewW || sy > input.viewH) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(sx, sy, Math.max(2, sw), Math.max(2, sh));
    stones += 1;
  }
  ctx.restore();
  return { mode, stones };
}
