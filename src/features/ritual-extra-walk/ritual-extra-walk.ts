/**
 * PV-PM-055 — after today's ritual slot is stored, one soft corner goal.
 * The header keeps one of the three beats for the day. That stored beat is enough.
 * Week 3/3 with stay-awhile already in the corner yields this goal.
 * Set RITUAL_EXTRA_WALK_ENABLED to false to leave the corner to the week.
 */

export const RITUAL_EXTRA_WALK_ENABLED = true;
export const EXTRA_WALK_PREFIX = "village:extra-walk-v1:";
export const EXTRA_WALK_DONE = "到了。";

export const EXTRA_WALK_SPOTS = [
  { id: "bench", label: "去长椅坐一会儿", x: 640, y: 420 },
  { id: "lake", label: "去湖边看看", x: 128, y: 80 },
  { id: "roof", label: "回自己的屋顶", x: 0, y: 0 },
] as const;

export type ExtraWalkId = (typeof EXTRA_WALK_SPOTS)[number]["id"];

export type ExtraWalkSpot = { id: ExtraWalkId; label: string; x: number; y: number };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function extraWalkKey(name: string) {
  return `${EXTRA_WALK_PREFIX}${name}`;
}

export function extraWalkOffer(input: {
  ritualToday: boolean;
  walkedYmd: string | null;
  today: string;
  stayAwhile: boolean;
  enabled?: boolean;
}) {
  const enabled = input.enabled ?? RITUAL_EXTRA_WALK_ENABLED;
  if (!enabled || !input.ritualToday || input.stayAwhile) return false;
  if (!YMD.test(input.today)) return false;
  if (input.walkedYmd === input.today) return false;
  return true;
}

function salt(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

/** Bench, lake, or the caller's own roof. Stable for one person on one day. */
export function pickExtraWalk(input: { name: string; ymd: string; roof: { homeX: number; homeY: number } | null }): ExtraWalkSpot {
  const roof = input.roof ? { x: input.roof.homeX + 48, y: input.roof.homeY + 24 } : null;
  const pool = EXTRA_WALK_SPOTS.filter((spot) => spot.id !== "roof" || roof);
  const picked = pool[salt(`${input.name}:${input.ymd}`) % pool.length] ?? EXTRA_WALK_SPOTS[0];
  if (picked.id === "roof" && roof) return { id: "roof", label: picked.label, x: roof.x, y: roof.y };
  return { id: picked.id, label: picked.label, x: picked.x, y: picked.y };
}

export function loadExtraWalk(name: string) {
  if (!name || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(extraWalkKey(name));
    return raw && YMD.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveExtraWalk(name: string, ymd: string) {
  if (!name || !YMD.test(ymd) || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(extraWalkKey(name), ymd);
  } catch {
    /* private mode */
  }
}

export function extraWalkCopy() {
  return [EXTRA_WALK_DONE, ...EXTRA_WALK_SPOTS.map((spot) => spot.label)];
}
