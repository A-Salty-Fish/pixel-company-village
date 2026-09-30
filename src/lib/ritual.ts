/**
 * First-glance ritual. Canned Chinese lines, local flags, no chat text.
 */

export const RITUAL_KEY = "village:ritual-v1";
export const FAR_PLATE_CAP = 8;
export const CHORE_JUICE_MS = 1_200;

export type RitualFlags = {
  self: boolean;
  yard: boolean;
  social: boolean;
  skip: boolean;
};

export function emptyRitual(): RitualFlags {
  return { self: false, yard: false, social: false, skip: false };
}

export function readRitual(value: unknown): RitualFlags {
  if (!value || typeof value !== "object") return emptyRitual();
  const raw = value as Partial<RitualFlags>;
  return {
    self: raw.self === true,
    yard: raw.yard === true,
    social: raw.social === true,
    skip: raw.skip === true,
  };
}

export function loadRitual(raw: string | null): RitualFlags {
  if (!raw) return emptyRitual();
  try {
    return readRitual(JSON.parse(raw));
  } catch {
    return emptyRitual();
  }
}

export function ritualDone(flags: RitualFlags) {
  return flags.skip || (flags.self && flags.yard && flags.social);
}

export function ritualStep(flags: RitualFlags) {
  if (ritualDone(flags)) return "done" as const;
  if (!flags.self) return "self" as const;
  if (!flags.yard) return "yard" as const;
  return "social" as const;
}

export const RITUAL_LINES = {
  self: "先选定「我是谁」。",
  yard: "做一件院里的事，或点一项本周小事。",
  social: "对一个人挥一次手，或送一次关照。",
  done: "可以打开信号卡了。",
} as const;

export function glanceLine(input: { season: string; weather: string; light: string; selfName: string | null }) {
  const who = input.selfName ? `我是${input.selfName}` : "还没选定我是谁";
  return `${input.season} · ${input.weather} · ${input.light} · ${who}`;
}

export function lightLabel(hour: number) {
  if (hour >= 17 && hour < 20) return "傍晚";
  if (hour >= 20 || hour < 5) return "夜里";
  return "白天";
}

export function momentCopy(dataDate: string, today: string) {
  if (dataDate === today) {
    return {
      fresh: true as const,
      headline: `数据日 ${dataDate}`,
      detail: "和今天是同一天。",
    };
  }
  return {
    fresh: false as const,
    headline: `分数来自${dataDate} · 村里仍是此刻`,
    detail: "浇水、挥手和关照按此刻算。",
  };
}

/** Far view: self, the open person, pins, then neighbors. Never more than eight. */
export function farPlates(input: {
  selfName: string | null;
  selected: string[];
  pins: string[];
  neighbors: string[];
}) {
  const ordered = [input.selfName, ...input.selected, ...input.pins, ...input.neighbors];
  const names: string[] = [];
  for (const name of ordered) {
    if (!name || names.includes(name)) continue;
    names.push(name);
    if (names.length >= FAR_PLATE_CAP) break;
  }
  return names;
}

export function socialReply(kind: "wave" | "seed" | "coffee" | "rod" | "water") {
  if (kind === "wave") return "对方也挥了挥手。";
  if (kind === "seed") return "对方把种子接住了。";
  if (kind === "coffee") return "对方捧着杯子点了点头。";
  if (kind === "rod") return "对方晃了晃钓竿，算是回礼。";
  return "对方也浇了一下水。";
}

export function bumpFamiliar(counts: Record<string, number> | undefined, name: string) {
  const next = { ...(counts ?? {}) };
  if (!name || name.length > 24) return next;
  next[name] = Math.min(6, (next[name] ?? 0) + 1);
  return next;
}

export function readFamiliar(value: unknown) {
  const counts: Record<string, number> = {};
  if (!value || typeof value !== "object") return counts;
  for (const [name, n] of Object.entries(value as Record<string, unknown>)) {
    if (name.length < 1 || name.length > 24 || /[\n\r\t]/.test(name)) continue;
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    counts[name] = Math.max(0, Math.min(6, Math.floor(n)));
  }
  return counts;
}

export function ritualCopyLines() {
  return [
    ...Object.values(RITUAL_LINES),
    "还没选定我是谁",
    "白天",
    "傍晚",
    "夜里",
    "分数从哪来",
    "对方也挥了挥手。",
    "对方把种子接住了。",
    "对方捧着杯子点了点头。",
    "对方晃了晃钓竿，算是回礼。",
    "对方也浇了一下水。",
    "浇水、挥手和关照按此刻算。",
    "减动开关",
    "跟着系统的减少动态。打开后，装饰停住。",
  ];
}
