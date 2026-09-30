/**
 * Wave D play rules. Viewer-local, canned copy, counts only.
 * No chat text, no rankings, no server quota.
 */

export const SEASON_FADE_MS = 400;
export const NOD_THRESHOLD = 2;
export const PIN_CAP = 3;
export const FOOTPRINT_CAP = 8;
export const FOOTPRINT_FADE_MS = 8_000;
export const TAP_GAP_MS = 320;
export const PARTICLE_CAP = 8;

export const EASING = {
  camera: 0.08,
  seasonFadeMs: SEASON_FADE_MS,
  undoMs: 3_000,
  nodMs: 420,
  postcard: 180,
} as const;

export const WAVE_SYSTEMS = [
  "weather",
  "footprints",
  "nod",
  "diary",
  "wreath",
  "porch",
  "weekBoard",
  "dusk",
  "pins",
  "critters",
  "water",
  "postcard",
  "chronicle",
  "hats",
  "bench",
  "mill",
  "gift",
  "stroll",
  "atlas",
  "seasonFade",
  "stars",
  "instrument",
  "home",
  "visitor",
] as const;

export type WaveSystemId = (typeof WAVE_SYSTEMS)[number];

export const WAVE_LABELS: Record<WaveSystemId, string> = {
  weather: "村口天气",
  footprints: "小路脚印",
  nod: "邻里点头",
  diary: "今日一句",
  wreath: "花环变色",
  porch: "小屋门灯",
  weekBoard: "周任务木牌",
  dusk: "安静时光",
  pins: "收藏名牌",
  critters: "蝴蝶萤火",
  water: "作物浇水",
  postcard: "明信片",
  chronicle: "村史",
  hats: "生日帽",
  bench: "长椅休息",
  mill: "风车水车",
  gift: "回礼光点",
  stroll: "今日散步",
  atlas: "图鉴进度",
  seasonFade: "季节过场",
  stars: "夜空星点",
  instrument: "迷你乐器",
  home: "回家",
  visitor: "访客提示",
};

const WEATHERS = [
  { id: "clear", label: "晴" },
  { id: "cloud", label: "云" },
  { id: "drizzle", label: "细雨" },
  { id: "breeze", label: "风" },
] as const;

export type WeatherId = (typeof WEATHERS)[number]["id"];

export const CANNED_DIARY = [
  "今天先看自己的那一块田。",
  "锄头靠好，水可以晚一点浇。",
  "灰猫也在村里，不编分数。",
  "合上的环只是一朵花。",
  "这一小时可以挥一次手。",
  "节日只报合计，不排名。",
] as const;

const WEEK_SETS = [
  ["浇自己的田", "看一张信号卡", "在村口站一会儿"],
  ["给门灯点一下", "收一句罐头", "沿着小路走三步"],
  ["看季节色", "钉一枚名牌", "把锄头放下"],
] as const;

export const INSTRUMENTS = [
  { id: "lute", label: "琴" },
  { id: "drum", label: "鼓" },
  { id: "flute", label: "笛" },
] as const;

export type InstrumentId = (typeof INSTRUMENTS)[number]["id"];

export type Footprint = { x: number; y: number; t: number };
export type ChronicleKind = "score" | "kindness" | "visit";
export type ChronicleEvent = { date: string; kind: ChronicleKind; n: number };

export type WaveToggles = Record<WaveSystemId, boolean>;

export type WaveDBlob = {
  toggles: WaveToggles;
  porch: boolean;
  diaryDay: string | null;
  diaryIndex: number | null;
  pins: string[];
  hats: string[];
  waterDay: string | null;
  sit: { x: number; y: number } | null;
  instrument: InstrumentId | null;
  footprints: Footprint[];
  chronicle: ChronicleEvent[];
  seenDay: string | null;
};

export function defaultToggles(): WaveToggles {
  return Object.fromEntries(WAVE_SYSTEMS.map((id) => [id, true])) as WaveToggles;
}

export const EMPTY_WAVE: WaveDBlob = {
  toggles: defaultToggles(),
  porch: false,
  diaryDay: null,
  diaryIndex: null,
  pins: [],
  hats: [],
  waterDay: null,
  sit: null,
  instrument: null,
  footprints: [],
  chronicle: [],
  seenDay: null,
};

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function waveStorageKey(viewer: string) {
  return `village:viewer:${viewer}:wave-d`;
}

export function systemOn(blob: WaveDBlob, id: WaveSystemId) {
  return blob.toggles[id] !== false;
}

export function setToggle(blob: WaveDBlob, id: WaveSystemId, on: boolean): WaveDBlob {
  if (blob.toggles[id] === on) return blob;
  return { ...blob, toggles: { ...blob.toggles, [id]: on } };
}

export function weatherFor(ymd: string) {
  return WEATHERS[hash(ymd) % WEATHERS.length];
}

export function pushFootprint(list: Footprint[], point: { x: number; y: number }, now: number): Footprint[] {
  const next = [...list, { x: Math.round(point.x), y: Math.round(point.y), t: now }];
  return next.slice(-FOOTPRINT_CAP);
}

export function visibleFootprints(list: Footprint[], now: number) {
  return list.filter((step) => now - step.t < FOOTPRINT_FADE_MS);
}

export function footprintMarks(list: Footprint[], now: number) {
  return visibleFootprints(list, now).map((step) => {
    const age = Math.max(0, now - step.t);
    return { x: step.x, y: step.y, alpha: Math.max(0.15, 1 - age / FOOTPRINT_FADE_MS) };
  });
}

export function nodTargets(familiarity: Record<string, number>, enabled: boolean) {
  if (!enabled) return [];
  return Object.entries(familiarity)
    .filter(([, level]) => level >= NOD_THRESHOLD)
    .map(([name]) => name);
}

export function setDiary(blob: WaveDBlob, ymd: string, index: number) {
  if (!systemOn(blob, "diary")) return { ok: false as const, line: "今日一句关着。", blob };
  if (index < 0 || index >= CANNED_DIARY.length) return { ok: false as const, line: "没有这句罐头。", blob };
  return {
    ok: true as const,
    line: CANNED_DIARY[index],
    blob: { ...blob, diaryDay: ymd, diaryIndex: index },
  };
}

export function diaryLine(blob: WaveDBlob) {
  if (blob.diaryIndex === null) return null;
  return CANNED_DIARY[blob.diaryIndex] ?? null;
}

export function wreathColor(seasonId: string) {
  if (seasonId === "spring") return "#f4b4c4";
  if (seasonId === "summer") return "#3a7d4a";
  if (seasonId === "autumn") return "#d46a32";
  return "#d5e4ef";
}

export function togglePorch(blob: WaveDBlob): WaveDBlob {
  if (!systemOn(blob, "porch")) return blob;
  return { ...blob, porch: !blob.porch };
}

export function weekBoard(weekKey: string) {
  const items = WEEK_SETS[hash(weekKey) % WEEK_SETS.length];
  return {
    title: "本周小木牌",
    note: "三件小事，做不做都不公示，也不能跟别人比。",
    items: [...items],
  };
}

export type WeekFacts = {
  wateredToday: boolean;
  cardOpen: boolean;
  visitedGate: boolean;
  porchOn: boolean;
  diaryToday: boolean;
  steps: number;
  pinned: boolean;
  resting: boolean;
  noticedSeason: boolean;
};

/** Derived from local actions. Unknown labels stay undone and are never stored. */
export function weekChores(weekKey: string, facts: WeekFacts) {
  return weekBoard(weekKey).items.map((label) => ({ label, done: choreDone(label, facts) }));
}

function choreDone(label: string, facts: WeekFacts) {
  switch (label) {
    case "浇自己的田":
      return facts.wateredToday;
    case "看一张信号卡":
      return facts.cardOpen;
    case "在村口站一会儿":
      return facts.visitedGate;
    case "给门灯点一下":
      return facts.porchOn;
    case "收一句罐头":
      return facts.diaryToday;
    case "沿着小路走三步":
      return facts.steps >= 3;
    case "看季节色":
      return facts.noticedSeason;
    case "钉一枚名牌":
      return facts.pinned;
    case "把锄头放下":
      return facts.resting;
    default:
      return false;
  }
}

export function duskActive(hour: number, enabled: boolean) {
  return enabled && hour >= 17 && hour < 20;
}

export const PIN_BLOCKED = "最多钉三枚名牌。";

export function pinResult(pins: string[], name: string) {
  if (pins.includes(name)) return { pins: pins.filter((item) => item !== name), hint: "" };
  if (pins.length >= PIN_CAP) return { pins, hint: PIN_BLOCKED };
  return { pins: [...pins, name], hint: "" };
}

export function togglePin(pins: string[], name: string) {
  return pinResult(pins, name).pins;
}

export function seasonDecorLayer(seasonId: string) {
  if (seasonId === "spring") return "flower" as const;
  if (seasonId === "summer") return "leaf" as const;
  if (seasonId === "autumn") return "fruit" as const;
  return "snow" as const;
}

export function particleAllowance(quiet: boolean, festival: boolean) {
  if (quiet) return 0;
  return festival ? PARTICLE_CAP : 4;
}

export const LEGACY_WAVE_KEY = "village:wave-d-v0";

/** Copy an unscoped Wave D blob onto the viewer key once, then delete the old key. */
export function migrateWaveKey(
  viewer: string,
  read: (key: string) => string | null,
  write: (key: string, value: string | null) => void,
) {
  const legacy = read(LEGACY_WAVE_KEY);
  if (!legacy || !viewer) return false;
  const nextKey = waveStorageKey(viewer);
  if (!read(nextKey)) write(nextKey, legacy);
  write(LEGACY_WAVE_KEY, null);
  return true;
}

export function critterKind(seasonId: string, hour: number, quiet: boolean, enabled: boolean) {
  if (!enabled || quiet) return "none" as const;
  if (hour >= 19 || hour < 5) return "firefly" as const;
  if (seasonId === "winter") return "none" as const;
  return "butterfly" as const;
}

export function waterOnce(blob: WaveDBlob, ymd: string) {
  if (!systemOn(blob, "water")) return { ok: false as const, line: "浇水关着。", blob };
  if (blob.waterDay === ymd) return { ok: false as const, line: "今天已经浇过自己的田。", blob };
  return { ok: true as const, line: "给自己的田浇了一下水。", blob: { ...blob, waterDay: ymd } };
}

export function postcardMeta(viewer: string | null, ymd: string) {
  return {
    filename: `village-postcard-${ymd}.png`,
    caption: viewer ? `${ymd} · ${viewer} 的村子` : `${ymd} · 还没选定我是谁`,
    upload: false as const,
  };
}

export function bumpChronicle(blob: WaveDBlob, date: string, kind: ChronicleKind): WaveDBlob {
  if (!systemOn(blob, "chronicle")) return blob;
  const found = blob.chronicle.find((event) => event.date === date && event.kind === kind);
  const chronicle = found
    ? blob.chronicle.map((event) => (event === found ? { ...event, n: event.n + 1 } : event))
    : [...blob.chronicle, { date, kind, n: 1 }].slice(-40);
  return { ...blob, chronicle };
}

export function toggleHat(hats: string[], name: string) {
  if (hats.includes(name)) return hats.filter((item) => item !== name);
  return [...hats, name].slice(0, 12);
}

export function sitDown(blob: WaveDBlob, x: number, y: number): WaveDBlob {
  if (!systemOn(blob, "bench")) return blob;
  if (blob.sit) return { ...blob, sit: null };
  return { ...blob, sit: { x: Math.round(x), y: Math.round(y) } };
}

export function millAngle(t: number, reduced: boolean) {
  if (reduced) return 0;
  return (t * 0.35) % (Math.PI * 2);
}

export function giftNames(fedNames: string[], selfName: string | null, enabled: boolean) {
  if (!enabled || !selfName) return [];
  return fedNames.includes(selfName) ? [selfName] : [];
}

export function strollPoints(ymd: string, worldW = 1216, worldH = 1120) {
  const points = [];
  for (let i = 0; i < 3; i += 1) {
    const n = hash(`${ymd}:${i}`);
    points.push({
      x: 80 + (n % Math.max(1, worldW - 160)),
      y: 120 + ((n >>> 8) % Math.max(1, worldH - 200)),
    });
  }
  return points;
}

export function atlasRatio(unlocked: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(1, unlocked / total);
}

export function starBudget(festival: boolean, quiet: boolean, enabled: boolean) {
  if (!enabled || quiet) return 0;
  return festival ? PARTICLE_CAP : 4;
}

export function decorParticleCount(requested: number, quiet: boolean, budget = PARTICLE_CAP) {
  if (quiet || requested <= 0) return 0;
  return Math.min(requested, budget);
}

export function layoutBudget(count: number) {
  return {
    villagers: count,
    particles: Math.min(PARTICLE_CAP, Math.max(0, count)),
    labels: count <= 60 ? ("stable" as const) : ("capped" as const),
  };
}

export function isInstrument(value: string | null): value is InstrumentId {
  return INSTRUMENTS.some((item) => item.id === value);
}

export function setInstrument(blob: WaveDBlob, id: InstrumentId | null): WaveDBlob {
  if (!systemOn(blob, "instrument")) return blob;
  if (blob.instrument === id) return blob;
  return { ...blob, instrument: id };
}

export function homeReady(selfName: string | null, enabled: boolean) {
  return Boolean(enabled && selfName);
}

export function visitorCopy(selfName: string | null, enabled: boolean) {
  if (!enabled || selfName) return null;
  return "访客模式：还没选定「我是谁」。可以看村子，关照、挥手和本机玩法先锁着。";
}

export function acceptTap(lastAt: number, now: number, gap = TAP_GAP_MS) {
  return now - lastAt >= gap;
}

export function undoStillOpen(until: number, now: number) {
  return now < until;
}

/** Whole seconds on the undo button. Closed at 0. While open, keep the label in 1..3. */
export function undoSecondsLeft(until: number, now: number) {
  const left = until - now;
  if (left <= 0) return 0;
  return Math.min(3, Math.max(1, Math.ceil(left / 1000)));
}

export const SPLIT_MIN = 0.28;
export const SPLIT_MAX = 0.78;
export const SPLIT_CARD = 0.32;
export const SPLIT_MAP = 0.78;

export function clampSplit(value: number) {
  if (!Number.isFinite(value)) return 0.46;
  const stepped = Math.round(value * 100) / 100;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, stepped));
}

export function stepSplit(value: number, delta: number) {
  return clampSplit(Math.round((value + delta) * 100) / 100);
}

export const ATLAS_FALLBACK = "图集没载上，田垄用色块先占着。名字仍可读。";

export function touchWaveDay(blob: WaveDBlob, ymd: string): WaveDBlob {
  if (blob.seenDay === ymd) return blob;
  return { ...bumpChronicle(blob, ymd, "visit"), seenDay: ymd };
}

const CHAT_KEY = /chat|transcript|snippet|message_text|raw_text|原文/i;

export function storageSweepPlan(keys: string[]) {
  return keys.filter((key) => CHAT_KEY.test(key));
}

export function publicCopyLines() {
  return [
    ...CANNED_DIARY,
    ...WEEK_SETS.flat(),
    ...WEATHERS.map((item) => item.label),
    ...INSTRUMENTS.map((item) => item.label),
    visitorCopy(null, true) ?? "",
    weekBoard("2026-W39").note,
    ATLAS_FALLBACK,
  ];
}

export function copyIsClean(lines: string[]) {
  return lines.every((line) => line.length > 0 && line.length <= 80 && !CHAT_KEY.test(line) && !line.includes("他说"));
}

export type IsolatedPerson = {
  name: string;
  scored: boolean;
  msgs?: number;
  work?: number;
  fish?: number;
  on_task?: number;
  plot?: number;
};

export function isolatePeople(input: unknown): { people: IsolatedPerson[]; dropped: number } {
  if (!Array.isArray(input)) return { people: [], dropped: 0 };
  const people: IsolatedPerson[] = [];
  let dropped = 0;
  for (const item of input) {
    try {
      if (!item || typeof item !== "object") {
        dropped += 1;
        continue;
      }
      const record = item as Record<string, unknown>;
      const name = record.name;
      if (typeof name !== "string" || name.length < 1 || name.length > 24 || /[\n\r\t]/.test(name)) {
        dropped += 1;
        continue;
      }
      const plot = typeof record.plot === "number" ? record.plot : undefined;
      if (
        record.scored === true &&
        typeof record.work === "number" &&
        typeof record.fish === "number" &&
        typeof record.on_task === "number"
      ) {
        people.push({
          name,
          scored: true,
          work: record.work,
          fish: record.fish,
          on_task: record.on_task,
          msgs: typeof record.msgs === "number" ? record.msgs : 0,
          ...(plot !== undefined ? { plot } : {}),
        });
      } else {
        people.push({ name, scored: false, ...(plot !== undefined ? { plot } : {}) });
      }
    } catch {
      dropped += 1;
    }
  }
  return { people, dropped };
}

export function historyTicks(dates: string[]) {
  if (dates.length === 0) return [];
  const indexes = new Set<number>([0, dates.length - 1]);
  for (let index = 0; index < dates.length; index += 10) indexes.add(index);
  return [...indexes].sort((a, b) => a - b).map((index) => dates[index]);
}

function finitePoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== "object") return null;
  const point = value as { x?: unknown; y?: unknown };
  if (typeof point.x !== "number" || typeof point.y !== "number") return null;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: Math.round(point.x), y: Math.round(point.y) };
}

export function sanitizeWave(value: unknown): WaveDBlob {
  if (!value || typeof value !== "object") return { ...EMPTY_WAVE, toggles: defaultToggles() };
  const raw = value as Partial<WaveDBlob>;
  const toggles = defaultToggles();
  if (raw.toggles && typeof raw.toggles === "object") {
    for (const id of WAVE_SYSTEMS) {
      const flag = (raw.toggles as Partial<WaveToggles>)[id];
      if (typeof flag === "boolean") toggles[id] = flag;
    }
  }
  const strings = (input: unknown, cap: number) =>
    Array.isArray(input) ? input.filter((item) => typeof item === "string" && item.length <= 24).slice(0, cap) : [];
  const footprints = Array.isArray(raw.footprints)
    ? raw.footprints
        .map((step) => {
          const point = finitePoint(step);
          const t = step && typeof step === "object" && typeof (step as Footprint).t === "number" ? (step as Footprint).t : 0;
          return point ? { ...point, t } : null;
        })
        .filter((step): step is Footprint => Boolean(step))
        .slice(-FOOTPRINT_CAP)
    : [];
  const chronicle = Array.isArray(raw.chronicle)
    ? raw.chronicle
        .map((event) => {
          if (!event || typeof event !== "object") return null;
          const row = event as Partial<ChronicleEvent>;
          if (row.kind !== "score" && row.kind !== "kindness" && row.kind !== "visit") return null;
          if (typeof row.date !== "string" || typeof row.n !== "number") return null;
          return { date: row.date, kind: row.kind, n: Math.max(0, Math.min(999, Math.floor(row.n))) };
        })
        .filter((event): event is ChronicleEvent => Boolean(event))
        .slice(-40)
    : [];
  const diaryIndex =
    typeof raw.diaryIndex === "number" && raw.diaryIndex >= 0 && raw.diaryIndex < CANNED_DIARY.length
      ? Math.floor(raw.diaryIndex)
      : null;
  return {
    toggles,
    porch: Boolean(raw.porch),
    diaryDay: typeof raw.diaryDay === "string" ? raw.diaryDay : null,
    diaryIndex,
    pins: strings(raw.pins, PIN_CAP),
    hats: strings(raw.hats, 12),
    waterDay: typeof raw.waterDay === "string" ? raw.waterDay : null,
    sit: finitePoint(raw.sit),
    instrument: typeof raw.instrument === "string" && isInstrument(raw.instrument) ? raw.instrument : null,
    footprints,
    chronicle,
    seenDay: typeof raw.seenDay === "string" ? raw.seenDay : null,
  };
}

export type WaveDecor = {
  weatherLabel: string;
  showWeather: boolean;
  footprints: { x: number; y: number; alpha: number }[];
  porch: boolean;
  critters: "none" | "butterfly" | "firefly";
  dusk: boolean;
  pins: string[];
  hats: string[];
  watered: boolean;
  sit: { x: number; y: number } | null;
  stroll: { x: number; y: number }[];
  stars: number;
  mill: boolean;
  millSpin: boolean;
  instrument: string | null;
  gifts: string[];
  wreath: string | null;
  nods: string[];
  seasonId: string;
  seasonParticles: number;
};

export function buildDecor(input: {
  blob: WaveDBlob;
  ymd: string;
  hour: number;
  seasonId: string;
  quiet: boolean;
  reduced: boolean;
  festival: boolean;
  familiarity: Record<string, number>;
  selfName: string | null;
  fedNames: string[];
  now: number;
}): WaveDecor {
  const { blob } = input;
  const weather = weatherFor(input.ymd);
  return {
    weatherLabel: weather.label,
    showWeather: systemOn(blob, "weather"),
    footprints: systemOn(blob, "footprints") ? footprintMarks(blob.footprints, input.now) : [],
    porch: systemOn(blob, "porch") && blob.porch,
    critters: critterKind(input.seasonId, input.hour, input.quiet, systemOn(blob, "critters")),
    dusk: duskActive(input.hour, systemOn(blob, "dusk") && !input.quiet),
    pins: systemOn(blob, "pins") ? blob.pins : [],
    hats: systemOn(blob, "hats") ? blob.hats : [],
    watered: systemOn(blob, "water") && blob.waterDay === input.ymd,
    sit: systemOn(blob, "bench") ? blob.sit : null,
    stroll: systemOn(blob, "stroll") ? strollPoints(input.ymd) : [],
    stars: starBudget(input.festival, input.quiet, systemOn(blob, "stars")),
    mill: systemOn(blob, "mill"),
    millSpin: systemOn(blob, "mill") && !input.reduced,
    instrument: systemOn(blob, "instrument") ? blob.instrument : null,
    gifts: giftNames(input.fedNames, input.selfName, systemOn(blob, "gift")),
    wreath: systemOn(blob, "wreath") ? wreathColor(input.seasonId) : null,
    nods: nodTargets(input.familiarity, systemOn(blob, "nod")),
    seasonId: input.seasonId,
    seasonParticles: systemOn(blob, "seasonFade") ? decorParticleCount(input.festival ? 6 : 4, input.quiet) : 0,
  };
}
