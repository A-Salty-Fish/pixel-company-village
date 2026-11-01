/**
 * PV-MAGIC-PLAY-001 — wizard play on the map. Pure rules only; the magic layer draws, the scene wires taps.
 * Everything here reads taps, positions, the calendar date and counts. Nothing reads or keeps chat text.
 * Each group has its own flag so one can be rolled back without the rest.
 */

export const MAGIC_PLAY_ENABLED = true;
export const CHAIN_ENABLED = true;
export const CHARGE_ENABLED = true;
export const TRAIL_ENABLED = true;
export const SUMMON_ENABLED = true;
export const LANDMARK_GAMES_ENABLED = true;
export const CHORUS_ENABLED = true;
export const QUEST_ENABLED = true;
export const BADGES_ENABLED = true;

/* ------------------------------------------------------------ spell chain */

export const CHAIN_WINDOW_MS = 5000;
export type ChainMark = { name: string; x: number; y: number; at: number };
export type ChainKind = "link" | "swap" | "fuse";
export const CHAIN_KINDS: readonly ChainKind[] = ["link", "swap", "fuse"];

/** Tap one person, then another within the window: the two are linked. A third tap starts over. */
export function chainStep(prev: ChainMark | null, next: ChainMark, windowMs = CHAIN_WINDOW_MS) {
  if (prev && prev.name !== next.name && next.at - prev.at >= 0 && next.at - prev.at <= windowMs) {
    return { from: prev, mark: null as ChainMark | null };
  }
  return { from: null as ChainMark | null, mark: next };
}

export function chainKind(count: number): ChainKind {
  return CHAIN_KINDS[((count % CHAIN_KINDS.length) + CHAIN_KINDS.length) % CHAIN_KINDS.length];
}

/** Effects played at the ends (a, b) and the middle (m) of a link. */
export const CHAIN_SPELLS: Record<ChainKind, { a: string; b: string; m: string | null }> = {
  link: { a: "lightning/zap-hit", b: "lightning/zap-hit", m: null },
  swap: { a: "arcane/blink-out", b: "arcane/blink-in", m: null },
  fuse: { a: "spawn/poof", b: "spawn/poof", m: "explosions/implosion" },
};

/* ------------------------------------------------------------ charge, double tap, trail */

export const LONG_PRESS_MS = 420;
export const FULL_CHARGE_MS = 1700;
export const DOUBLE_TAP_MS = 320;
export const DOUBLE_TAP_PX = 28;

export function chargeLevel(heldMs: number) {
  if (heldMs <= LONG_PRESS_MS) return 0;
  return Math.min(1, (heldMs - LONG_PRESS_MS) / (FULL_CHARGE_MS - LONG_PRESS_MS));
}

export function chargeTier(level: number): 1 | 2 | 3 {
  if (level >= 0.85) return 3;
  if (level >= 0.4) return 2;
  return 1;
}

/** Bigger charge, bigger finish. Every id is a pixelfx one-shot already in the bundle. */
export const ULTIMATES: Record<1 | 2 | 3, readonly string[]> = {
  1: ["arcane/mana-burst"],
  2: ["lightning/lightning-strike", "arcane/mana-burst"],
  3: ["arcane/time-stop", "explosions/plasma-explosion", "holy/holy-pillar"],
};

export function isDoubleTap(prev: { x: number; y: number; at: number } | null, next: { x: number; y: number; at: number }) {
  if (!prev) return false;
  const gap = next.at - prev.at;
  return gap > 0 && gap <= DOUBLE_TAP_MS && Math.hypot(next.x - prev.x, next.y - prev.y) <= DOUBLE_TAP_PX;
}

export const TRAIL_MAX = 56;
export const TRAIL_LIFE = 0.9;
export const TRAIL_STEP = 3;
export type TrailPoint = { x: number; y: number; at: number };

/** Add a point to a staff trail, skipping tiny moves, dropping old points, never past the cap. */
export function trailPush(points: TrailPoint[], next: TrailPoint, life = TRAIL_LIFE, cap = TRAIL_MAX) {
  const fresh = points.filter((point) => next.at - point.at <= life);
  const last = fresh[fresh.length - 1];
  if (last && Math.hypot(next.x - last.x, next.y - last.y) < TRAIL_STEP) return fresh;
  fresh.push(next);
  while (fresh.length > cap) fresh.shift();
  return fresh;
}

/** Total length in world pixels; long strokes earn a sparkle burst along the line. */
export function trailLength(points: readonly TrailPoint[]) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return total;
}

/* ------------------------------------------------------------ summons */

export const SUMMON_EVERY = 2;
export const SUMMON_LIFE = 8;
export const SUMMON_CAP = 4;
export type Summon = { kind: "critter" | "plant"; id: string; scale: number };
export const SUMMONS: readonly Summon[] = [
  { kind: "critter", id: "critters/frog", scale: 0.45 },
  { kind: "plant", id: "nature/healing-bloom", scale: 0.4 },
  { kind: "critter", id: "critters/butterfly", scale: 0.45 },
  { kind: "critter", id: "critters/slime", scale: 0.42 },
  { kind: "plant", id: "nature/thorns", scale: 0.34 },
  { kind: "critter", id: "critters/wisp", scale: 0.45 },
  { kind: "critter", id: "critters/bird", scale: 0.42 },
];

/** Every second plain ground tap summons something small for a few seconds. */
export function summonFor(groundTaps: number, seed: number, every = SUMMON_EVERY): Summon | null {
  if (groundTaps <= 0 || groundTaps % every !== 0) return null;
  return SUMMONS[(Math.floor(groundTaps / every) + seed) % SUMMONS.length];
}

/* ------------------------------------------------------------ landmark games */

export const WISH_GOAL = 3;
export const GAME_IDLE_MS = 25000;
export type Counter = { n: number; at: number };

/** Fountain wishes and circle runes share one rule: count up, start over after a quiet spell, finish at the goal. */
export function countStep(prev: Counter | null, at: number, goal: number, idleMs = GAME_IDLE_MS) {
  const base = prev && at - prev.at <= idleMs && prev.n < goal ? prev.n : 0;
  const n = base + 1;
  return { counter: { n, at }, done: n >= goal };
}

export const RUNE_GOAL = 5;

export type PortalEnd = "gate-portal" | "warp-pad";
export function portalOther(from: PortalEnd): PortalEnd {
  return from === "gate-portal" ? "warp-pad" : "gate-portal";
}

/* ------------------------------------------------------------ streaks */

export const STREAK_GAP_MS = 1400;
export function streakStep(prev: Counter | null, at: number, gapMs = STREAK_GAP_MS): Counter {
  if (prev && at - prev.at >= 0 && at - prev.at <= gapMs) return { n: prev.n + 1, at };
  return { n: 1, at };
}

/* ------------------------------------------------------------ daily quest */

export type QuestKind = "chain" | "wish" | "circle" | "summon" | "charge" | "trail" | "streak" | "portal";
export type Quest = { kind: QuestKind; goal: number; title: string; hint: string };

export const QUESTS: readonly Quest[] = [
  { kind: "chain", goal: 2, title: "连锁两次", hint: "先点一位，再点另一位" },
  { kind: "wish", goal: 3, title: "许三个愿", hint: "点许愿泉" },
  { kind: "circle", goal: 1, title: "点亮魔法阵", hint: "在广场的法阵上连点五下" },
  { kind: "summon", goal: 3, title: "召唤三只小家伙", hint: "多点几下空地" },
  { kind: "charge", goal: 1, title: "放一次蓄力大招", hint: "长按地图，松手释放" },
  { kind: "trail", goal: 1, title: "画一道魔法轨迹", hint: "长按后拖动" },
  { kind: "streak", goal: 10, title: "十连击", hint: "快速连点十下" },
  { kind: "portal", goal: 1, title: "传送门往返", hint: "点村口传送门，再点传送台" },
];

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Same date, same quest, on every browser. */
export function dailyQuest(ymd: string): Quest {
  return QUESTS[hashText(`quest:${ymd}`) % QUESTS.length];
}

export type PlayProgress = { ymd: string; counts: Partial<Record<QuestKind, number>>; done: boolean };

export function emptyProgress(ymd: string): PlayProgress {
  return { ymd, counts: {}, done: false };
}

/** Bump one count. Returns whether today's quest just finished. A new date starts fresh. */
export function bumpProgress(prev: PlayProgress | null, ymd: string, kind: QuestKind, by = 1) {
  const base = prev && prev.ymd === ymd ? prev : emptyProgress(ymd);
  const counts = { ...base.counts, [kind]: (base.counts[kind] ?? 0) + by };
  const quest = dailyQuest(ymd);
  const done = base.done || (counts[quest.kind] ?? 0) >= quest.goal;
  return { progress: { ymd, counts, done }, finished: done && !base.done };
}

export function questLine(ymd: string, progress: PlayProgress | null, enabled = QUEST_ENABLED) {
  if (!enabled) return "";
  const quest = dailyQuest(ymd);
  const have = progress && progress.ymd === ymd ? Math.min(quest.goal, progress.counts[quest.kind] ?? 0) : 0;
  const done = Boolean(progress && progress.ymd === ymd && progress.done);
  return done ? `今日魔法任务：${quest.title} · 完成 ✦` : `今日魔法任务：${quest.title}（${have}/${quest.goal}）· ${quest.hint}`;
}

/* ------------------------------------------------------------ badges */

export type BadgeId =
  | "first-chain"
  | "first-ultimate"
  | "full-charge"
  | "wish-3"
  | "circle-lit"
  | "first-summon"
  | "portal-trip"
  | "chorus"
  | "streak-10"
  | "quest-done";

export const BADGES: Record<BadgeId, string> = {
  "first-chain": "初次连锁",
  "first-ultimate": "第一次蓄力大招",
  "full-charge": "满蓄力！",
  "wish-3": "三愿成真",
  "circle-lit": "法阵点亮",
  "first-summon": "小小召唤师",
  "portal-trip": "传送往返",
  chorus: "合唱咒语",
  "streak-10": "十连击",
  "quest-done": "今日任务完成",
};

export function unlockBadge(have: readonly string[], id: BadgeId, enabled = BADGES_ENABLED) {
  if (!enabled || have.includes(id)) return { have: [...have], fresh: false };
  return { have: [...have, id], fresh: true };
}

/* ------------------------------------------------------------ storage (counts and badge ids only) */

export const PROGRESS_KEY = "village-magic-play-v1";
export const BADGES_KEY = "village-magic-badges-v1";

type Store = Pick<Storage, "getItem" | "setItem">;

export function readProgress(store: Store | null, ymd: string): PlayProgress {
  try {
    const raw = store?.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress(ymd);
    const parsed = JSON.parse(raw) as PlayProgress;
    if (!parsed || parsed.ymd !== ymd || typeof parsed.counts !== "object") return emptyProgress(ymd);
    const counts: PlayProgress["counts"] = {};
    for (const quest of QUESTS) {
      const value = Number((parsed.counts as Record<string, unknown>)[quest.kind]);
      if (Number.isFinite(value) && value > 0) counts[quest.kind] = Math.min(999, Math.floor(value));
    }
    return { ymd, counts, done: Boolean(parsed.done) };
  } catch {
    return emptyProgress(ymd);
  }
}

export function writeProgress(store: Store | null, progress: PlayProgress) {
  try {
    store?.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* private mode */
  }
}

export function readBadges(store: Store | null): BadgeId[] {
  try {
    const raw = store?.getItem(BADGES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(list) ? (list.filter((id) => typeof id === "string" && id in BADGES) as BadgeId[]) : [];
  } catch {
    return [];
  }
}

export function writeBadges(store: Store | null, have: readonly string[]) {
  try {
    store?.setItem(BADGES_KEY, JSON.stringify(have));
  } catch {
    /* private mode */
  }
}

/** The short how-to line under the magic setting. */
export const PLAY_HOWTO = "玩法：先后点两位村民放连锁；长按蓄力、松手放大招，按住拖动画轨迹；双击地面放小招；多点空地会召唤小家伙；许愿泉、广场法阵、传送门各有小游戏。";
