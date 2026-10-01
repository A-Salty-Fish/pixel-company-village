/**
 * PV-PM-045 / PV-PM-052 — scored wanderers stroll near home instead of the world ring.
 * Each short seat is a still pause of 1.5–3s. Walks are the gaps between them.
 * Set WANDER_WORLD_RING_ENABLED to true to put the outer racetrack back.
 */

export const STROLL_PAUSE_MIN_S = 1.5;
export const STROLL_PAUSE_MAX_S = 3;

/** Home, yard, seat. Speed does not shrink these. The next lap starts at home again. */
const STROLL_PAUSES_S = [2.4, 2.2, 1.8] as const;
const STROLL_WALKS_S = [1.15, 1.05, 1.0] as const;

export function strollPauses() {
  return [...STROLL_PAUSES_S];
}

export const WANDER_WORLD_RING_ENABLED = false;

export const WORLD_RING = [
  [48, 216],
  [1168, 216],
  [1168, 1064],
  [48, 1064],
] as const;

/** Walkable core. The old ring sits on the border outside this box. */
const CORE = { minX: 96, maxX: 1120, minY: 280, maxY: 1000 };
const REACH = 48;

export type StrollFacing = "down" | "left" | "right" | "up";

export type WanderPose = {
  x: number;
  y: number;
  dir: StrollFacing;
  rest: boolean;
};

type Point = { x: number; y: number };

function clampPoint(x: number, y: number, baseX: number, baseY: number): Point {
  const dx = Math.max(-REACH, Math.min(REACH, x - baseX));
  const dy = Math.max(-REACH, Math.min(REACH, y - baseY));
  return {
    x: Math.min(CORE.maxX, Math.max(CORE.minX, baseX + dx)),
    y: Math.min(CORE.maxY, Math.max(CORE.minY, baseY + dy)),
  };
}

function facing(from: Point, to: Point): StrollFacing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) return "down";
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "down" : "up";
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function ringPoint(u: number): { x: number; y: number; dir: StrollFacing } {
  const path = WORLD_RING;
  const seg = Math.min(3, Math.floor(u * 4));
  const local = u * 4 - seg;
  const a = path[seg];
  const b = path[(seg + 1) % 4];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return {
    x: a[0] + dx * local,
    y: a[1] + dy * local,
    dir: Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "down" : "up",
  };
}

/** The old permanent lap. Kept so the flag can turn it back on. */
export function worldRingPose(phase: number, t: number, speed: number): WanderPose {
  const u = (t * 0.08 * speed + phase) % 1;
  const point = ringPoint(u < 0 ? u + 1 : u);
  return { ...point, rest: false };
}

/**
 * Short seats around home: rest, yard offset, rest, neighbor seat, rest, home.
 * Walks are the short gaps. Each rest is a readable idle, not a skate.
 */
export function localStrollPose(baseX: number, baseY: number, phase: number, t: number, speed: number): WanderPose {
  const home = clampPoint(baseX, baseY, baseX, baseY);
  const yard = clampPoint(baseX + Math.cos(phase) * 36, baseY + Math.sin(phase) * 20, baseX, baseY);
  const seat = clampPoint(baseX + Math.cos(phase + 2.2) * 28, baseY + Math.sin(phase + 1.1) * 24, baseX, baseY);
  const walkScale = 1 / Math.max(0.7, Math.min(1.35, speed));
  const plan: Array<{ seconds: number; from: Point; to: Point; rest: boolean }> = [
    { seconds: STROLL_PAUSES_S[0], from: home, to: home, rest: true },
    { seconds: STROLL_WALKS_S[0] * walkScale, from: home, to: yard, rest: false },
    { seconds: STROLL_PAUSES_S[1], from: yard, to: yard, rest: true },
    { seconds: STROLL_WALKS_S[1] * walkScale, from: yard, to: seat, rest: false },
    { seconds: STROLL_PAUSES_S[2], from: seat, to: seat, rest: true },
    { seconds: STROLL_WALKS_S[2] * walkScale, from: seat, to: home, rest: false },
  ];
  const period = plan.reduce((sum, step) => sum + step.seconds, 0);
  const raw = (t + (phase % 1) * period) % period;
  const u = raw < 0 ? raw + period : raw;
  let cursor = 0;
  for (const step of plan) {
    const end = cursor + step.seconds;
    if (u < end) {
      const span = step.seconds;
      const local = span <= 0 ? 1 : (u - cursor) / span;
      const pos = step.rest ? step.from : lerp(step.from, step.to, local);
      return {
        x: step.rest ? Math.round(pos.x) : pos.x,
        y: step.rest ? Math.round(pos.y) : pos.y,
        dir: step.rest ? "down" : facing(step.from, step.to),
        rest: step.rest,
      };
    }
    cursor = end;
  }
  return { x: Math.round(home.x), y: Math.round(home.y), dir: "down", rest: true };
}

export function wanderPose(
  input: { baseX: number; baseY: number; wanderPhase: number; speed: number },
  t: number,
  ring = WANDER_WORLD_RING_ENABLED,
): WanderPose {
  if (ring) return worldRingPose(input.wanderPhase, t, input.speed);
  return localStrollPose(input.baseX, input.baseY, input.wanderPhase, t, input.speed);
}

function distToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  if (len <= 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len));
  return Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t));
}

/** True when a point is on the old outer lap. */
export function onWorldRing(x: number, y: number, pad = 24) {
  for (let i = 0; i < WORLD_RING.length; i += 1) {
    const a = WORLD_RING[i];
    const b = WORLD_RING[(i + 1) % WORLD_RING.length];
    if (distToSegment(x, y, a[0], a[1], b[0], b[1]) <= pad) return true;
  }
  return false;
}
