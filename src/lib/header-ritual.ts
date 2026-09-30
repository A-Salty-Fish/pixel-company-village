/**
 * Once-a-day header ritual. Stores a date and a beat id for the current viewer.
 * No sentences, no chat, no audio.
 */

import { proximityNods, type Pixel } from "./worldcraft";

export const RITUAL_ACT = "做今日仪式";
export const RITUAL_DONE_ACT = "今日仪式已做";
export const RITUAL_NEED = "先选定「我是谁」，再做今日仪式。";

export const RITUAL_BEATS = {
  dawn: {
    id: "dawn",
    title: "晨间仪式",
    line: "点上自家门灯，跟靠近的人点个头。",
    done: "晨间仪式做完了。门灯留着。",
  },
  noon: {
    id: "noon",
    title: "午间仪式",
    line: "在田边站一会儿，跟靠近的人点个头。",
    done: "午间仪式做完了。",
  },
  dusk: {
    id: "dusk",
    title: "傍晚仪式",
    line: "收工时跟靠近的人点个头。",
    done: "傍晚仪式做完了。",
  },
} as const;

export type RitualBeatId = keyof typeof RITUAL_BEATS;
export type RitualSave = { ymd: string; beat: RitualBeatId };

const BEAT_IDS: RitualBeatId[] = ["dawn", "noon", "dusk"];

export function ritualBeat(hour: number) {
  const h = Math.floor(hour);
  if (h >= 5 && h <= 10) return RITUAL_BEATS.dawn;
  if (h >= 11 && h <= 16) return RITUAL_BEATS.noon;
  return RITUAL_BEATS.dusk;
}

export function ritualStorageKey(viewer: string) {
  return `village:ritual:v1:${viewer}`;
}

export function nearLine(count: number) {
  const n = Math.max(0, Math.min(99, Math.floor(Number.isFinite(count) ? count : 0)));
  if (n === 0) return "身边暂时没有人靠近。";
  return `身边有 ${n} 人，点头就好。`;
}

export function ritualNearCount(
  self: { name: string; x: number; y: number } | null,
  others: { name: string; x: number; y: number }[],
) {
  return proximityNods(self, others).length;
}

export function sanitizeRitual(raw: unknown, ymd: string): RitualSave | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.some((key) => key !== "ymd" && key !== "beat")) return null;
  if (rec.ymd !== ymd) return null;
  if (typeof rec.beat !== "string" || !BEAT_IDS.includes(rec.beat as RitualBeatId)) return null;
  return { ymd, beat: rec.beat as RitualBeatId };
}

export function parseRitual(raw: string | null, ymd: string): RitualSave | null {
  if (!raw) return null;
  try {
    return sanitizeRitual(JSON.parse(raw), ymd);
  } catch {
    return null;
  }
}

export function ritualPayload(saved: RitualSave) {
  return JSON.stringify({ ymd: saved.ymd, beat: saved.beat });
}

export function loadRitual(viewer: string | null, ymd: string): RitualSave | null {
  if (!viewer || typeof window === "undefined") return null;
  try {
    return parseRitual(window.localStorage.getItem(ritualStorageKey(viewer)), ymd);
  } catch {
    return null;
  }
}

export function storeRitual(viewer: string, ymd: string, hour: number): RitualSave {
  const saved: RitualSave = { ymd, beat: ritualBeat(hour).id };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ritualStorageKey(viewer), ritualPayload(saved));
    } catch {
      /* private mode */
    }
  }
  return saved;
}

/** Static seal at the gate. No motion, so reduced-motion stays still. */
export function ritualSeal(beat: RitualBeatId): Pixel[] {
  const accent = beat === "dawn" ? "#f2d15c" : beat === "noon" ? "#7ec8e3" : "#c44b3a";
  return [
    { x: 88, y: 96, w: 2, h: 10, color: "#6a3d18" },
    { x: 90, y: 96, w: 10, h: 6, color: accent },
    { x: 92, y: 98, w: 6, h: 2, color: "#fff6d8" },
  ];
}

export function ritualCopyLines() {
  return [
    RITUAL_ACT,
    RITUAL_DONE_ACT,
    RITUAL_NEED,
    ...BEAT_IDS.flatMap((id) => [RITUAL_BEATS[id].title, RITUAL_BEATS[id].line, RITUAL_BEATS[id].done]),
    nearLine(0),
    nearLine(1),
    nearLine(12),
  ];
}
