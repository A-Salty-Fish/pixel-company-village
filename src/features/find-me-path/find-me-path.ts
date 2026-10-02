/**
 * PV-PM-090 — 「找我」 leaves a short receipt and two or three warm stones.
 * Quiet village and reduced motion keep the stones still. No chat text.
 * The stones look like the next-beat stones, but this trigger is only 找我.
 * Set FIND_ME_PATH_ENABLED to false to skip the receipt and the stones.
 */

import type { Pixel } from "@/lib/worldcraft";

export const FIND_ME_PATH_ENABLED = true;
export const FIND_ME_PATH_MS = 2_000;
export const FIND_ME_RECEIPT = "人在这儿。";

const STILL = "#f2d15c";
const HIGH = "#fff6d8";
const LOW = "#e7b14a";

export type FindPathMark = "pulse" | "still" | "off";
export type FindPoint = { x: number; y: number };

export function findMePathOn(enabled = FIND_ME_PATH_ENABLED) {
  return enabled;
}

export function findMePathMark(input: {
  elapsedMs: number;
  quiet: boolean;
  reduced: boolean;
  enabled?: boolean;
}): FindPathMark {
  const enabled = input.enabled ?? FIND_ME_PATH_ENABLED;
  if (!enabled) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= FIND_ME_PATH_MS) return "off";
  if (input.quiet || input.reduced) return "still";
  return "pulse";
}

/** A short walk up to the caller. Not a lamp and not the next-beat aim. */
export function findMeApproach(self: FindPoint): { from: FindPoint; to: FindPoint } {
  return {
    from: { x: self.x - 56, y: self.y + 28 },
    to: { x: self.x, y: self.y },
  };
}

export function findMeStones(from: FindPoint, to: FindPoint): FindPoint[] {
  const stones: FindPoint[] = [];
  const count = 3;
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    stones.push({
      x: Math.round(from.x + (to.x - from.x) * t),
      y: Math.round(from.y + (to.y - from.y) * t),
    });
  }
  return stones;
}

export function findMePathPixels(from: FindPoint, to: FindPoint, mode: FindPathMark, t: number): Pixel[] {
  if (mode === "off") return [];
  const hot = mode === "pulse" && Math.sin(t * 1.4) > 0;
  const color = mode === "still" ? STILL : hot ? HIGH : LOW;
  return findMeStones(from, to).map((spot) => ({
    x: spot.x - 2,
    y: spot.y - 1,
    w: 4,
    h: 3,
    color,
  }));
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number };

export function paintFindMePath(
  ctx: CanvasRenderingContext2D,
  input: Cam & {
    from: FindPoint;
    to: FindPoint;
    elapsedMs: number;
    quiet: boolean;
    reduced: boolean;
    t: number;
    enabled?: boolean;
  },
) {
  const mode = findMePathMark(input);
  const pixels = findMePathPixels(input.from, input.to, mode, input.t);
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

export function findMePathCopy() {
  return [FIND_ME_RECEIPT];
}
