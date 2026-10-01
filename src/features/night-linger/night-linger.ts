/**
 * PV-PM-059 — one soft night corner after today's ritual.
 * Warm window, lake stars, or the bench. Once per night.
 * Dusk lantern and the ritual extra walk already own the corner, so this waits.
 * Set NIGHT_LINGER_ENABLED to false to leave the night map unmarked.
 */

import { lightLabel } from "@/lib/copy";

export const NIGHT_LINGER_ENABLED = true;
export const NIGHT_LINGER_PREFIX = "village:night-linger-v1:";
export const NIGHT_LINGER_DONE = "夜里这处也在。";

export const NIGHT_SPOTS = [
  { id: "window", label: "窗还暖着", x: 0, y: 0 },
  { id: "stars", label: "湖上有星星", x: 128, y: 80 },
  { id: "bench", label: "长椅还空着", x: 640, y: 420 },
] as const;

export type NightSpot = { id: (typeof NIGHT_SPOTS)[number]["id"]; label: string; x: number; y: number };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function nightLingerKey(name: string) {
  return `${NIGHT_LINGER_PREFIX}${name}`;
}

export function nightCornerFree(input: { dusk: boolean; extraWalk: boolean }) {
  return !input.dusk && !input.extraWalk;
}

export function nightLingerOffer(input: {
  hour: number;
  ritualToday: boolean;
  storedYmd: string | null;
  today: string;
  blocked: boolean;
  enabled?: boolean;
}) {
  const enabled = input.enabled ?? NIGHT_LINGER_ENABLED;
  if (!enabled || !input.ritualToday || input.blocked) return false;
  if (lightLabel(input.hour) !== "夜里") return false;
  if (!YMD.test(input.today)) return false;
  if (input.storedYmd === input.today) return false;
  return true;
}

function salt(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export function pickNightSpot(input: { name: string; ymd: string; roof: { homeX: number; homeY: number } | null }): NightSpot {
  const spot = NIGHT_SPOTS[salt(`${input.name}:${input.ymd}`) % NIGHT_SPOTS.length] ?? NIGHT_SPOTS[1];
  if (spot.id === "window") {
    const roof = input.roof ? { x: input.roof.homeX + 48, y: input.roof.homeY + 24 } : { x: 220, y: 220 };
    return { id: "window", label: spot.label, x: roof.x, y: roof.y };
  }
  return { id: spot.id, label: spot.label, x: spot.x, y: spot.y };
}

export function loadNightLinger(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(nightLingerKey(name));
    return raw && YMD.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveNightLinger(name: string, ymd: string) {
  if (!name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(nightLingerKey(name), ymd);
  } catch {
    /* private mode */
  }
}

export function nightLingerCopy() {
  return [NIGHT_LINGER_DONE, ...NIGHT_SPOTS.map((spot) => spot.label)];
}
