/**
 * PV-PM-029 — after the week and the one next beat, the map corner keeps two or three quiet steps.
 * A click aims the camera. Completing a step swaps in another. Cooldown, no score.
 * Set STAY_AWHILE_ENABLED to false to leave the corner empty.
 */

export const STAY_AWHILE_ENABLED = true;

export const STAY_SLOT_MIN = 2;
export const STAY_SLOT_MAX = 3;
export const STAY_COOLDOWN_MS = 45_000;

export const STAY_NOTE = "还可以再待一会儿。";
export const STAY_DONE = "到了。";

export type StayKind = "toy" | "neighbor" | "lamp" | "cat";

export type StayCandidate = {
  id: string;
  kind: StayKind;
  label: string;
  x: number;
  y: number;
};

const TOYS: StayCandidate[] = [
  { id: "toy-lantern", kind: "toy", label: "旁边的灯笼", x: 852, y: 336 },
  { id: "toy-scarecrow", kind: "toy", label: "旁边的稻草人", x: 348, y: 440 },
  { id: "toy-pebble", kind: "toy", label: "旁边的路石", x: 200, y: 640 },
];

const POND = { x: 128, y: 80 };

export function stayVisible(weekComplete: boolean, beatDone: boolean, enabled = STAY_AWHILE_ENABLED) {
  return enabled && weekComplete && beatDone;
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function nearest<T extends { x: number; y: number }>(items: T[], origin: { x: number; y: number }) {
  let best: T | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const d = dist2(item, origin);
    if (d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

export function buildStayPool(input: {
  self: { x: number; y: number; homeX?: number; homeY?: number } | null;
  people: { name: string; x: number; y: number }[];
  selfName: string | null;
  enabled?: boolean;
}): StayCandidate[] {
  if (input.enabled === false) return [];
  const homeX = input.self?.homeX ?? input.self?.x ?? 220;
  const homeY = input.self?.homeY ?? input.self?.y ?? 220;
  const pool: StayCandidate[] = [
    ...TOYS,
    { id: "lamp", kind: "lamp", label: "找一盏门灯", x: homeX, y: homeY },
  ];
  const others = input.people.filter((person) => person.name !== input.selfName);
  if (others.length === 0) {
    pool.push({ id: "cat-yard", kind: "cat", label: "找一只猫", x: homeX + 36, y: homeY + 40 });
    return pool;
  }
  const lakeside = nearest(others, POND) ?? others[0];
  pool.push({
    id: "neighbor-lake",
    kind: "neighbor",
    label: "跟着湖边的人",
    x: lakeside.x,
    y: lakeside.y,
  });
  const origin = input.self ?? POND;
  const cat = nearest(others, origin) ?? lakeside;
  if (cat.name === lakeside.name) {
    pool.push({ id: "cat-yard", kind: "cat", label: "找一只猫", x: homeX + 36, y: homeY + 40 });
  } else {
    pool.push({ id: "cat-near", kind: "cat", label: "找一只猫", x: cat.x, y: cat.y });
  }
  return pool;
}

function freshOf(pool: StayCandidate[], cooled: Record<string, number>, now: number) {
  return pool.filter((item) => (cooled[item.id] ?? 0) <= now);
}

/** Two or three steps. Keeps held ids that are still ready, then fills by kind. */
export function sampleStaySlots(input: {
  pool: StayCandidate[];
  now: number;
  cooled?: Record<string, number>;
  held?: string[];
  origin?: { x: number; y: number } | null;
  enabled?: boolean;
}): StayCandidate[] {
  if (input.enabled === false || input.pool.length === 0) return [];
  const cooled = input.cooled ?? {};
  const origin = input.origin ?? { x: 0, y: 0 };
  const fresh = freshOf(input.pool, cooled, input.now);
  const source = fresh.length >= STAY_SLOT_MIN ? fresh : input.pool;
  const byId = new Map(source.map((item) => [item.id, item]));
  const picked: StayCandidate[] = [];
  const take = (item: StayCandidate | null | undefined) => {
    if (!item || picked.some((slot) => slot.id === item.id) || picked.length >= STAY_SLOT_MAX) return;
    picked.push(item);
  };
  for (const id of input.held ?? []) take(byId.get(id));
  if (picked.length < STAY_SLOT_MAX) {
    take(nearest(source.filter((item) => item.kind === "toy"), origin));
    take(source.find((item) => item.kind === "neighbor") ?? nearest(source.filter((item) => item.kind === "cat"), origin));
    take(source.find((item) => item.kind === "lamp") ?? nearest(source.filter((item) => item.kind === "cat"), origin));
    take(nearest(source.filter((item) => item.kind === "cat"), origin));
  }
  const rest = [...source].sort((a, b) => dist2(a, origin) - dist2(b, origin));
  for (const item of rest) take(item);
  if (picked.length < STAY_SLOT_MIN) {
    const backup = [...input.pool].sort((a, b) => dist2(a, origin) - dist2(b, origin));
    for (const item of backup) take(item);
  }
  return picked.slice(0, STAY_SLOT_MAX);
}

export function advanceStay(id: string, now: number, cooled: Record<string, number>, cooldown = STAY_COOLDOWN_MS) {
  if ((cooled[id] ?? 0) > now) return { cooled, swapped: false };
  return { cooled: { ...cooled, [id]: now + cooldown }, swapped: true };
}

export function stayCopy() {
  return [STAY_NOTE, STAY_DONE, ...TOYS.map((item) => item.label), "跟着湖边的人", "找一盏门灯", "找一只猫"];
}

const BEAT_KEY = "village:stay-beat-v1";

export function beatDoneKey(viewer: string, week: string) {
  return `${viewer}:${week}`;
}

export function loadBeatDone(viewer: string, week: string) {
  if (!viewer || !week || typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(BEAT_KEY) === beatDoneKey(viewer, week);
  } catch {
    return false;
  }
}

export function storeBeatDone(viewer: string, week: string) {
  if (!viewer || !week || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(BEAT_KEY, beatDoneKey(viewer, week));
  } catch {
    /* this browser only */
  }
}
