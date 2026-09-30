/**
 * PV-PM-024 — after the week board is 3/3, one nearby next beat sits on the main path.
 * One tap aims the map. Not inside the week accordion.
 * Set WEEK_NEXT_BEAT_ENABLED to false to hide the beat.
 */

export const WEEK_NEXT_BEAT_ENABLED = true;

export const NEXT_BEAT_NOTE = "本周做完了。点一下，镜头去下一处。";
export const NEXT_BEAT_DONE = "镜头到了。";

export const NEXT_BEATS = [
  { id: "gate", x: 88, y: 120, label: "村口" },
  { id: "pond", x: 128, y: 80, label: "湖边" },
  { id: "bench", x: 640, y: 420, label: "长椅" },
] as const;

export type NextBeatId = (typeof NEXT_BEATS)[number]["id"];
export type NextBeat = (typeof NEXT_BEATS)[number];

export function nextBeatOffer(complete: boolean, enabled = WEEK_NEXT_BEAT_ENABLED) {
  return enabled && complete;
}

/** Nearest canned landmark. No self yet means the gate ribbon. */
export function pickNextBeat(self: { x: number; y: number } | null, enabled = WEEK_NEXT_BEAT_ENABLED): NextBeat | null {
  if (!enabled) return null;
  if (!self) return NEXT_BEATS[0];
  let best: NextBeat = NEXT_BEATS[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const beat of NEXT_BEATS) {
    const dx = beat.x - self.x;
    const dy = beat.y - self.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      best = beat;
      bestD = d;
    }
  }
  return best;
}

export function nextBeatLabel(beat: NextBeat) {
  return `去看${beat.label}`;
}

export function nextBeatCopy() {
  return [NEXT_BEAT_NOTE, NEXT_BEAT_DONE, ...NEXT_BEATS.map((beat) => nextBeatLabel(beat))];
}

/** Ground ring at the aimed landmark. Not a wave bubble. */
export function beatRingPixels(x: number, y: number, enabled = WEEK_NEXT_BEAT_ENABLED) {
  if (!enabled) return [];
  return [
    { x: x - 12, y: y - 2, w: 24, h: 3, color: "#7ec8e3" },
    { x: x - 8, y: y - 8, w: 3, h: 14, color: "#f2d15c" },
    { x: x + 6, y: y - 8, w: 3, h: 14, color: "#f2d15c" },
  ];
}
