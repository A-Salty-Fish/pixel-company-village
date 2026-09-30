/**
 * Wave C play rules. Viewer-local, canned copy, no chat text, no rankings.
 */
import { readFamiliar } from "./ritual";
import { shiftYmd } from "./quota-rules";

export const PARTICLE_BUDGET = 8;
export const GLYPH_BUDGET = 6;
export const FLOWER_MARK_CAP = 12;
export const VISIT_GOAL = 5;
export const VISIT_SPAN = 7;
export const EMOTE_GAP_MS = 4_000;
export const UNDO_MS = 3_000;

export function nowMs() {
  return Date.now();
}

export const PROP_ITEMS = [
  { id: "lantern", label: "灯笼" },
  { id: "pot", label: "花盆" },
  { id: "sign", label: "木牌" },
  { id: "bench", label: "小凳" },
  { id: "mushroom", label: "蘑菇" },
  { id: "crate", label: "木箱" },
  { id: "flag", label: "小旗" },
  { id: "stone", label: "石子" },
] as const;

export type PropId = (typeof PROP_ITEMS)[number]["id"];

export const GARDEN_CROPS = [
  { id: "flower", label: "花" },
  { id: "veg", label: "菜" },
  { id: "lamp", label: "灯" },
] as const;

export type GardenCropId = (typeof GARDEN_CROPS)[number]["id"];

export const STICKERS = [
  { id: "sprout", label: "新芽" },
  { id: "mug", label: "热杯" },
  { id: "leaf", label: "落叶" },
  { id: "star", label: "小星" },
  { id: "fish", label: "小鱼" },
  { id: "lantern", label: "灯笼" },
] as const;

export type StickerId = (typeof STICKERS)[number]["id"];

export const GATHER_SPOTS = [
  { id: "bench-pond", x: 240, y: 168, title: "湖边长椅" },
  { id: "picnic", x: 700, y: 300, title: "野餐垫" },
  { id: "porch", x: 520, y: 188, title: "屋檐下" },
] as const;

export const VIEWPOINTS = [
  { id: "pond-view", x: 160, y: 96, title: "湖心观景" },
  { id: "ridge-view", x: 960, y: 72, title: "山脊观景" },
] as const;

export type PlayBlob = {
  visitOpen: string[];
  visitKind: string[];
  freezeTokens: number;
  freezeGrants: string[];
  quotes: number[];
  stickers: string[];
  stickerDay: string | null;
  feathers: string[];
  prop: string | null;
  garden2: Record<string, string>;
  bellDay: string | null;
  emoteAt: number;
  secretDays: string[];
  familiar: Record<string, number>;
};

export const EMPTY_PLAY: PlayBlob = {
  visitOpen: [],
  visitKind: [],
  freezeTokens: 0,
  freezeGrants: [],
  quotes: [],
  stickers: [],
  stickerDay: null,
  feathers: [],
  prop: null,
  garden2: {},
  bellDay: null,
  emoteAt: 0,
  secretDays: [],
  familiar: {},
};

export type AnonFeed = Record<string, string[]>;

export function capParticles(requested: number, budget = PARTICLE_BUDGET) {
  if (requested <= 0) return 0;
  return Math.min(requested, budget);
}

export function familiarityLevel(kindnessDays: number) {
  if (kindnessDays >= 6) return 3;
  if (kindnessDays >= 3) return 2;
  if (kindnessDays >= 1) return 1;
  return 0;
}

export function cropTier(scoredDays: number) {
  if (scoredDays >= 12) return 3;
  if (scoredDays >= 6) return 2;
  if (scoredDays >= 2) return 1;
  return 0;
}

export type Axis = "work" | "fish" | "task";

export function dominantAxis(samples: { work: number; fish: number; on_task: number }[]): Axis | null {
  if (samples.length === 0) return null;
  let work = 0;
  let fish = 0;
  let task = 0;
  for (const sample of samples) {
    work += sample.work / 3;
    fish += sample.fish / 3;
    task += sample.on_task;
  }
  const max = Math.max(work, fish, task);
  if (max <= 0) return null;
  if (work === max) return "work";
  if (fish === max) return "fish";
  return "task";
}

export type MuseumShelf = {
  id: string;
  need: number;
  label: string;
  deco: string;
  unlocked: boolean;
};

export function museumShelves(scoredCount: number): MuseumShelf[] {
  const shelves = [
    { id: "first", need: 1, label: "村里有了第一块有分的田", deco: "木牌" },
    { id: "ten", need: 10, label: "有分的人凑满十个", deco: "花环" },
    { id: "thirty", need: 30, label: "三十块田有了数字", deco: "路灯" },
    { id: "sixty", need: 60, label: "大半个村子有分", deco: "旗帜" },
  ];
  return shelves.map((shelf) => ({ ...shelf, unlocked: scoredCount >= shelf.need }));
}

export function broadcastFor(hour: number, quiet: boolean, ambient: boolean) {
  if (quiet || !ambient) return null;
  if (hour === 9) return { id: "morning", line: "村里广播：晨光铺到田里了。先看自己的那一块。" };
  if (hour === 12) return { id: "noon", line: "村里广播：午间可以浇一浇水，不着急。" };
  if (hour === 18) return { id: "dusk", line: "村里广播：傍晚收工，锄头靠在篱笆上就好。" };
  return null;
}

export function morningBellDue(
  clock: { ymd: string; hour: number; workday: boolean },
  lastYmd: string | null,
  enabled: boolean,
) {
  if (!enabled) return false;
  if (!clock.workday) return false;
  if (clock.hour < 8 || clock.hour > 11) return false;
  return lastYmd !== clock.ymd;
}

export function canEmote(lastAt: number, now: number) {
  return now - lastAt >= EMOTE_GAP_MS;
}

export type VisitDay = { date: string; open: boolean; kind: boolean; counts: boolean };

export function visitCalendar(blob: PlayBlob, endYmd: string) {
  const days: VisitDay[] = [];
  for (let offset = VISIT_SPAN - 1; offset >= 0; offset -= 1) {
    const date = shiftYmd(endYmd, -offset);
    const open = blob.visitOpen.includes(date);
    const kind = blob.visitKind.includes(date);
    days.push({ date, open, kind, counts: open && kind });
  }
  const filled = days.filter((day) => day.counts).length;
  return { days, filled, goal: VISIT_GOAL, span: VISIT_SPAN, met: filled >= VISIT_GOAL };
}

export function touchDaily(blob: PlayBlob, ymd: string, festivalId: string | null): PlayBlob {
  let next = blob;
  if (!blob.visitOpen.includes(ymd)) {
    next = { ...next, visitOpen: [...next.visitOpen, ymd].slice(-48) };
  }
  if (festivalId && !next.freezeGrants.includes(festivalId)) {
    next = {
      ...next,
      freezeGrants: [...next.freezeGrants, festivalId],
      freezeTokens: next.freezeTokens + 1,
    };
  }
  return next;
}

export function noteKindness(blob: PlayBlob, ymd: string): PlayBlob {
  if (blob.visitKind.includes(ymd)) return blob;
  return { ...blob, visitKind: [...blob.visitKind, ymd].slice(-48) };
}

export function forgetKindnessDay(blob: PlayBlob, ymd: string): PlayBlob {
  if (!blob.visitKind.includes(ymd)) return blob;
  return { ...blob, visitKind: blob.visitKind.filter((day) => day !== ymd) };
}

export function spendFreeze(blob: PlayBlob, endYmd: string): PlayBlob {
  if (blob.freezeTokens <= 0) return blob;
  const view = visitCalendar(blob, endYmd);
  const gap = [...view.days].reverse().find((day) => !day.counts);
  if (!gap) return blob;
  return {
    ...blob,
    freezeTokens: blob.freezeTokens - 1,
    visitOpen: gap.open ? blob.visitOpen : [...blob.visitOpen, gap.date],
    visitKind: gap.kind ? blob.visitKind : [...blob.visitKind, gap.date],
  };
}

export function unlockQuote(blob: PlayBlob, index: number, total: number): PlayBlob {
  if (index < 0 || index >= total || blob.quotes.includes(index)) return blob;
  return { ...blob, quotes: [...blob.quotes, index].sort((a, b) => a - b) };
}

export function unlockSticker(blob: PlayBlob, ymd: string, salt: number) {
  if (blob.stickerDay === ymd) {
    return { ok: false as const, line: "今天的贴纸已经揭过了。", blob, sticker: null };
  }
  const owned = new Set(blob.stickers);
  const pending = STICKERS.filter((item) => !owned.has(item.id));
  if (pending.length === 0) {
    return { ok: false as const, line: "贴纸已经集齐了。", blob, sticker: null };
  }
  const sticker = pending[Math.abs(salt) % pending.length];
  return {
    ok: true as const,
    line: `揭到一张「${sticker.label}」。`,
    sticker,
    blob: { ...blob, stickerDay: ymd, stickers: [...blob.stickers, sticker.id] },
  };
}

export function canSecretFeed(days: string[], ymd: string) {
  return !days.includes(ymd);
}

export function markSecretDay(blob: PlayBlob, ymd: string): PlayBlob {
  if (blob.secretDays.includes(ymd)) return blob;
  return { ...blob, secretDays: [...blob.secretDays, ymd].slice(-48) };
}

export function forgetSecretDay(blob: PlayBlob, ymd: string): PlayBlob {
  if (!blob.secretDays.includes(ymd)) return blob;
  return { ...blob, secretDays: blob.secretDays.filter((day) => day !== ymd) };
}

export function markAnonFeed(feed: AnonFeed, ymd: string, target: string): AnonFeed {
  const list = feed[ymd] ?? [];
  if (list.includes(target)) return feed;
  return { ...feed, [ymd]: [...list, target] };
}

export function forgetAnonFeed(feed: AnonFeed, ymd: string, target: string): AnonFeed {
  const list = feed[ymd] ?? [];
  if (!list.includes(target)) return feed;
  return { ...feed, [ymd]: list.filter((name) => name !== target) };
}

export function anonLine(feed: AnonFeed, ymd: string, target: string) {
  return feed[ymd]?.includes(target) ? "有人留下一杯咖啡。" : null;
}

export function addFeather(blob: PlayBlob, id: string): PlayBlob {
  if (blob.feathers.includes(id)) return blob;
  return { ...blob, feathers: [...blob.feathers, id] };
}

export function setProp(blob: PlayBlob, prop: string | null): PlayBlob {
  if (blob.prop === prop) return blob;
  return { ...blob, prop };
}

export function setGardenCrop(blob: PlayBlob, name: string, crop: string): PlayBlob {
  if (blob.garden2[name] === crop) return blob;
  return { ...blob, garden2: { ...blob.garden2, [name]: crop } };
}

export type ScoreBand = "quiet" | "mixed" | "busy";

export function scoreBand(taskMean: number): ScoreBand {
  if (taskMean >= 0.68) return "busy";
  if (taskMean >= 0.35) return "mixed";
  return "quiet";
}

export function vignetteFor(title: string, hour: number, band: ScoreBand) {
  const daypart = hour < 11 ? "上午" : hour < 17 ? "午后" : "傍晚";
  const second =
    band === "busy" ? "田里的数字偏满，位子仍可以坐。" : band === "mixed" ? "有人忙，有人在发呆，都正常。" : "这一带很静，适合把锄头放下。";
  return {
    title,
    lines: [`${daypart}的${title}只坐得下风。`, second] as [string, string],
  };
}

export function featherCopy(title: string) {
  return {
    title,
    lines: ["第一次站到这里。", "口袋里多了一根羽毛。"] as [string, string],
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function stageNames(names: string[], salt: string, count = 3) {
  return [...names].sort((a, b) => hash(salt + a) - hash(salt + b)).slice(0, Math.min(count, names.length));
}

export function hitSpot(x: number, y: number, radius = 42) {
  const spots = [
    ...GATHER_SPOTS.map((spot) => ({ ...spot, kind: "gather" as const })),
    ...VIEWPOINTS.map((spot) => ({ ...spot, kind: "view" as const })),
  ];
  let best: (typeof spots)[number] | null = null;
  let bestD = radius * radius;
  for (const spot of spots) {
    const dx = spot.x - x;
    const dy = spot.y - y;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      best = spot;
      bestD = d;
    }
  }
  return best;
}

export function isPropId(value: string | null): value is PropId {
  return PROP_ITEMS.some((item) => item.id === value);
}

export function isGardenCrop(value: string | null): value is GardenCropId {
  return GARDEN_CROPS.some((item) => item.id === value);
}

export function sanitizePlay(value: unknown): PlayBlob {
  if (!value || typeof value !== "object") return { ...EMPTY_PLAY };
  const raw = value as Partial<PlayBlob>;
  const strings = (input: unknown) => (Array.isArray(input) ? input.filter((item) => typeof item === "string").slice(0, 64) : []);
  const garden2: Record<string, string> = {};
  if (raw.garden2 && typeof raw.garden2 === "object") {
    for (const [key, crop] of Object.entries(raw.garden2)) {
      if (typeof crop === "string" && isGardenCrop(crop) && key.length <= 24) garden2[key] = crop;
    }
  }
  const prop = typeof raw.prop === "string" && isPropId(raw.prop) ? raw.prop : null;
  return {
    visitOpen: strings(raw.visitOpen),
    visitKind: strings(raw.visitKind),
    freezeTokens: typeof raw.freezeTokens === "number" && raw.freezeTokens > 0 ? Math.min(8, Math.floor(raw.freezeTokens)) : 0,
    freezeGrants: strings(raw.freezeGrants),
    quotes: Array.isArray(raw.quotes) ? raw.quotes.filter((item) => typeof item === "number").slice(0, 32) : [],
    stickers: strings(raw.stickers),
    stickerDay: typeof raw.stickerDay === "string" ? raw.stickerDay : null,
    feathers: strings(raw.feathers),
    prop,
    garden2,
    bellDay: typeof raw.bellDay === "string" ? raw.bellDay : null,
    emoteAt: typeof raw.emoteAt === "number" ? raw.emoteAt : 0,
    secretDays: strings(raw.secretDays),
    familiar: readFamiliar(raw.familiar),
  };
}

export function jobLookFor(person: { scored: boolean; work?: number; fish?: number; on_task?: number }): "hoe" | "rod" | "scroll" | null {
  if (!person.scored) return null;
  const axis = dominantAxis([
    { work: person.work ?? 0, fish: person.fish ?? 0, on_task: person.on_task ?? 0 },
  ]);
  if (axis === "fish") return "rod";
  if (axis === "task") return "scroll";
  if (axis === "work") return "hoe";
  return null;
}

export const FESTIVAL_FIELD = [
  { id: "stand", label: "站一站", line: "舞台只照三步路，没有名次。" },
  { id: "lantern", label: "挂一盏", line: "灯是装饰，不记谁挂得高。" },
  { id: "circle", label: "绕一圈", line: "绕完就散，不比较快慢。" },
] as const;
