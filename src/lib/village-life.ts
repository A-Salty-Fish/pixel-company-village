import { historyEndDate, mergeHistoryDay, personHistory, type HistoryBook } from "@/lib/history";
import { fishRatio, taskRatio, workRatio } from "@/lib/interactions";
import {
  commitKindness,
  kindnessView,
  undoKindness,
  waveExhaustedLine,
  waveView,
  type KindnessEntry,
} from "@/lib/quota-rules";
import type { WaveDecor } from "@/lib/wave-d";
import type { PersonWithState, ScorePayload } from "@/lib/types";

/**
 * Ring close thresholds (0–1 of each meter):
 * - 干活: work/3 ≥ 0.75 (work ≥ 2.25). A mostly-full day, not merely “started.”
 * - 摸鱼: fish/3 ≥ 2/3 (fish ≥ 2). Same line as the fishing animation.
 * - 在任务上: on_task ≥ 0.68. Same line as the focused animation.
 * Message count is never a ring.
 */
export const RING_CLOSE = {
  work: 0.75,
  fish: 2 / 3,
  task: 0.68,
} as const;

export const STATUS_PRESETS = [
  { id: "focus", label: "专注中" },
  { id: "lunch", label: "午饭" },
  { id: "meeting", label: "会议中" },
  { id: "dive", label: "潜水摸鱼" },
  { id: "leave", label: "今日请假" },
] as const;

export type StatusId = (typeof STATUS_PRESETS)[number]["id"];

export type Comfort = {
  quiet: boolean;
  hideScores: boolean;
  reduceMotion: boolean;
  /** When true, reduceMotion overrides the system prefers-reduced-motion setting. */
  motionOverride: boolean;
  showAllPlates: boolean;
  ambient: boolean;
  festivalSkin: boolean;
  jobLook: boolean;
  /** True keeps PV-PM-022 silent. Default true. */
  sfxMuted: boolean;
};

export type MotionFlags = {
  reduced: boolean;
  animate: boolean;
  particles: boolean;
  glyphs: boolean;
  bob: boolean;
};

export const HISTORY_DAYS = 30;
export { waveExhaustedLine };
export const VIEWER_PREFIX = "viewer:";

export type SceneLife = {
  quiet: boolean;
  reduceMotion: boolean;
  seasonTint: string;
  festival: boolean;
  festivalId: string | null;
  festivalSkin: boolean;
  glyphsOn: boolean;
  particles: boolean;
  showAllPlates: boolean;
  jobLook: boolean;
  selfName: string | null;
  selfPreset: StatusId | null;
  sundayGlow: string[];
  familiarity: Record<string, number>;
  neighbors: string[];
  spotlights: string[];
  clubs: Record<string, "work" | "fish" | "task">;
  cropTiers: Record<string, number>;
  selfProp: string | null;
  feathers: string[];
  bell: boolean;
  gardenCrops: Record<string, string>;
  decor?: WaveDecor | null;
  craft?: { steps: number; watered: boolean; ribbon: boolean } | null;
  ritual?: { beat: "dawn" | "noon" | "dusk"; done: boolean } | null;
  /** Names this viewer has waved at or cared for. Static map posts. */
  bondMarks?: string[];
  /** Same clock as the glance line. Night wash v2 follows this. */
  sessionNight?: boolean;
  /** Local passing glance after the week board is finished. */
  presenceOn?: boolean;
  /** Find-me ring holds for at least 1.5s. Set each frame, not stored. */
  selfHighlight?: boolean;
  /** Epoch ms when this session finished the ritual. Absent after reload. */
  ritualGlowAt?: number | null;
  /** UI phase for the afterglow. The canvas derives its own alpha from ritualGlowAt. */
  ritualPhase?: "fade" | "still" | "off";
  /** True when the score payload date is the clock's today. */
  scoreFresh?: boolean;
  /** PV-PM-027. Counts only. */
  toyLook?: { lantern: boolean; scare: number; pebbles: number } | null;
  /** PV-PM-024 / 027 camera target. Kind is a canned id, not a sentence. */
  mapAim?: { kind: string; x: number; y: number; at: number } | null;
  /** Existing mute flag, so the map toggle can read it. */
  sfxMuted?: boolean;
  /** PV-PM-033 shared map pulse. World pixels, not a sentence. */
  feedbackPulse?: { x: number; y: number } | null;
  /** PV-PM-035. World point for a waiting silhouette. Not a sentence. */
  waitingCue?: { kind: "lake" | "lamp"; x: number; y: number } | null;
  /** PV-PM-040. Warm rim for this session only. */
  ritualRim?: boolean;
  /** PV-PM-062. Epoch ms when 找我 settled. Absent until then. */
  findPrintAt?: number | null;
  /** PV-PM-064. Painted each frame from idle time. */
  plazaSit?: "sit" | "stand" | "off";
  /** PV-PM-066. Epoch ms of the latest 回家 flash. */
  eaveFlashAt?: number | null;
  /** PV-PM-067. Calendar month 1–12 from the local clock. */
  calendarMonth?: number;
};

export const DEFAULT_COMFORT: Comfort = {
  quiet: true,
  hideScores: false,
  reduceMotion: false,
  motionOverride: false,
  showAllPlates: false,
  ambient: true,
  festivalSkin: true,
  jobLook: true,
  sfxMuted: true,
};

const COMFORT_KEY = "village-comfort-v1";
const SCORE_HISTORY_KEY = "village:score-history-v1";
const SELF_KEY = "village-self-v1";
const SELF_SESSION = "village-self-session";

type Clock = {
  ymd: string;
  hour: number;
  sunday: boolean;
  workday: boolean;
  weekKey: string;
  monthDay: string;
};

let clockOverride: Date | null = null;
let animationsAreFrozen = false;

export function setTestClock(iso: string | null) {
  clockOverride = iso ? new Date(iso) : null;
}

export function setAnimationsFrozen(frozen: boolean) {
  animationsAreFrozen = frozen;
}

export function animationsFrozen() {
  return animationsAreFrozen;
}

export function subscribeSystemReduced(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function systemReducedSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionGovernor(input: { systemReduced: boolean; comfort: Comfort }): MotionFlags {
  const reduced =
    animationsAreFrozen ||
    (input.comfort.motionOverride ? input.comfort.reduceMotion : input.systemReduced || input.comfort.reduceMotion);
  return {
    reduced,
    animate: !reduced,
    particles: !reduced && !input.comfort.quiet,
    glyphs: !input.comfort.quiet,
    bob: !reduced,
  };
}

export function shanghaiClock(now?: Date): Clock {
  const instant = now ?? clockOverride ?? new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(instant).map((part) => [part.type, part.value]));
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  const sunday = parts.weekday === "Sun";
  const saturday = parts.weekday === "Sat";
  return {
    ymd,
    hour: Number(parts.hour),
    sunday,
    workday: !sunday && !saturday,
    weekKey: isoWeek(ymd),
    monthDay: `${parts.month}-${parts.day}`,
  };
}

export function weekKeyOf(ymd: string) {
  return isoWeek(ymd);
}

export function seasonOf(clock = shanghaiClock()) {
  const month = Number(clock.ymd.slice(5, 7));
  if (month >= 3 && month <= 5) {
    return { id: "spring" as const, label: "春日田色", tint: "rgba(186, 220, 140, 0.22)" };
  }
  if (month >= 6 && month <= 8) {
    return { id: "summer" as const, label: "夏日田色", tint: "rgba(255, 210, 110, 0.2)" };
  }
  if (month >= 9 && month <= 11) {
    return { id: "autumn" as const, label: "秋日田色", tint: "rgba(214, 132, 64, 0.22)" };
  }
  return { id: "winter" as const, label: "冬日田色", tint: "rgba(168, 198, 220, 0.24)" };
}

/** Four solar-term days, fixed each year (Asia/Shanghai calendar date). */
export const FESTIVALS = [
  { monthDay: "02-04", label: "立春", pa: "春幡挂上了。田还凉，人可以先站一站。" },
  { monthDay: "05-05", label: "立夏", pa: "青苗节。全村只报合计，不点名。" },
  { monthDay: "08-07", label: "立秋", pa: "收成灯亮了。把锄头靠一靠就好。" },
  { monthDay: "11-07", label: "立冬", pa: "围炉日。湖边的位子还在。" },
] as const;

export function festivalOf(clock = shanghaiClock()) {
  return FESTIVALS.find((item) => item.monthDay === clock.monthDay) ?? null;
}

export function nextFestival(clock = shanghaiClock()) {
  const ordered = [...FESTIVALS].sort((a, b) => a.monthDay.localeCompare(b.monthDay));
  return ordered.find((item) => item.monthDay > clock.monthDay) ?? ordered[0];
}

export function ringClosure(person: PersonWithState) {
  if (!person.scored) return { work: false, fish: false, task: false, any: false };
  const work = workRatio(person.work) >= RING_CLOSE.work;
  const fish = fishRatio(person.fish) >= RING_CLOSE.fish;
  const task = taskRatio(person.on_task) >= RING_CLOSE.task;
  return { work, fish, task, any: work || fish || task };
}

export function messageSparkCount(msgs: number) {
  if (msgs <= 0) return 0;
  if (msgs < 20) return 1;
  if (msgs < 100) return 2;
  return 3;
}

export type Availability = { tone: "green" | "yellow" | "red"; label: string };

export function availabilityFor(
  person: { scored: boolean; fish?: number; on_task?: number },
  clock: Clock,
  preset: StatusId | null,
): Availability {
  if (preset === "leave") return { tone: "red", label: "今日请假" };
  if (preset === "meeting") return { tone: "red", label: "会议中" };
  if (preset === "dive") return { tone: "yellow", label: "潜水摸鱼" };
  if (preset === "lunch" || clock.hour === 12 || clock.hour === 13) return { tone: "yellow", label: "午饭时段" };
  if (preset === "focus") return { tone: "yellow", label: "专注中" };
  if (!person.scored) return { tone: "yellow", label: "未评分" };
  if ((person.fish ?? 0) >= 2) return { tone: "yellow", label: "湖边" };
  if ((person.on_task ?? 0) >= 0.68) return { tone: "green", label: "在任务上" };
  if (clock.hour < 9 || clock.hour >= 19) return { tone: "yellow", label: "村里灯还亮着" };
  return { tone: "green", label: "可以打招呼" };
}

export type GlyphKind = "stretch" | "cast" | "mug" | "bowl" | "leaf";

export function glyphFor(person: PersonWithState, hour: number): GlyphKind {
  if (hour === 12 || hour === 13) return "bowl";
  if (hour === 15 || hour === 16) return "mug";
  if (person.scored && person.on_task >= 0.68) return "stretch";
  if (person.scored && person.fish >= 2) return "cast";
  return "leaf";
}

export function activityLevel(person: PersonWithState) {
  if (!person.scored) return 0;
  const avg = (workRatio(person.work) + fishRatio(person.fish) + taskRatio(person.on_task)) / 3;
  if (avg >= 0.75) return 4;
  if (avg >= 0.5) return 3;
  if (avg >= 0.25) return 2;
  if (avg > 0) return 1;
  return 0;
}

export function teamTotals(people: PersonWithState[]) {
  let work = 0;
  let fish = 0;
  let task = 0;
  let n = 0;
  for (const person of people) {
    if (!person.scored) continue;
    work += person.work;
    fish += person.fish;
    task += person.on_task;
    n += 1;
  }
  return {
    work,
    fish,
    taskMean: n ? task / n : 0,
    n,
  };
}

function isoWeek(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: keep the session in memory only */
  }
}

export type LocalPrefs = {
  rev: number;
  comfort: Comfort;
  selfName: string | null;
  preset: StatusId | null;
};

const SERVER_PREFS: LocalPrefs = {
  rev: 0,
  comfort: DEFAULT_COMFORT,
  selfName: null,
  preset: null,
};

let prefs: LocalPrefs = SERVER_PREFS;
const prefListeners = new Set<() => void>();

function publishPrefs(next: Omit<LocalPrefs, "rev">) {
  prefs = { rev: prefs.rev + 1, ...next };
  prefListeners.forEach((listener) => listener());
}

export function subscribePrefs(listener: () => void) {
  prefListeners.add(listener);
  return () => prefListeners.delete(listener);
}

export function getPrefSnapshot() {
  return prefs;
}

export function getServerPrefSnapshot() {
  return SERVER_PREFS;
}

export function hydratePrefs() {
  if (prefs.rev > 0) return;
  publishPrefs({
    comfort: loadComfort(),
    selfName: loadSelf().name,
    preset: loadSelf().preset,
  });
}

export function comfortFromStorage(raw: string | null): Comfort {
  if (!raw) return { ...DEFAULT_COMFORT };
  try {
    const stored = JSON.parse(raw) as Partial<Comfort> | null;
    if (!stored || typeof stored !== "object") return { ...DEFAULT_COMFORT };
    return {
      quiet: stored.quiet !== undefined ? Boolean(stored.quiet) : true,
      hideScores: Boolean(stored.hideScores),
      reduceMotion: Boolean(stored.reduceMotion),
      motionOverride: Boolean(stored.motionOverride),
      showAllPlates: Boolean(stored.showAllPlates),
      ambient: stored.ambient !== undefined ? Boolean(stored.ambient) : true,
      festivalSkin: stored.festivalSkin !== undefined ? Boolean(stored.festivalSkin) : true,
      jobLook: stored.jobLook !== undefined ? Boolean(stored.jobLook) : true,
      sfxMuted: stored.sfxMuted !== undefined ? Boolean(stored.sfxMuted) : true,
    };
  } catch {
    return { ...DEFAULT_COMFORT };
  }
}

export function loadComfort(): Comfort {
  if (typeof window === "undefined") return { ...DEFAULT_COMFORT };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(COMFORT_KEY);
  } catch {
    raw = null;
  }
  return comfortFromStorage(raw);
}

export function viewerStorageKey(viewer: string, bucket: "kindness" | "wave" | "garden") {
  return `village:${VIEWER_PREFIX}${viewer}:${bucket}`;
}

export function saveComfort(comfort: Comfort) {
  writeJson(COMFORT_KEY, comfort);
  publishPrefs({ comfort, selfName: prefs.selfName, preset: prefs.preset });
}

function readSelfRecord(): { name?: string; preset?: string } {
  if (typeof window !== "undefined") {
    try {
      const session = window.sessionStorage.getItem(SELF_SESSION);
      if (session) return JSON.parse(session) as { name?: string; preset?: string };
    } catch {
      /* fall through to localStorage */
    }
  }
  return readJson(SELF_KEY, {});
}

export function loadSelf(): { name: string | null; preset: StatusId | null } {
  const stored = readSelfRecord();
  const preset = STATUS_PRESETS.find((item) => item.id === stored.preset)?.id ?? null;
  const name = typeof stored.name === "string" && stored.name.trim() ? stored.name : null;
  return { name, preset };
}

export function saveSelf(name: string | null, preset: StatusId | null) {
  const record = { name, preset };
  writeJson(SELF_KEY, record);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(SELF_SESSION, JSON.stringify(record));
    } catch {
      /* session storage can be blocked; localStorage still holds the identity */
    }
  }
  publishPrefs({ comfort: prefs.comfort, selfName: name, preset });
}

function viewerName() {
  return prefs.selfName;
}

function loadKindness(viewer: string): Record<string, KindnessEntry> {
  return readJson(viewerStorageKey(viewer, "kindness"), {});
}

export function kindnessStatus(name: string, clock = shanghaiClock(), viewer = viewerName()) {
  if (!viewer) {
    return { usedToday: false, weekCount: 0, canSend: false, sundayBonus: false, needIdentity: true as const };
  }
  const view = kindnessView(loadKindness(viewer)[name], clock);
  return { ...view, needIdentity: false as const };
}

const NEED_IDENTITY = "先在体贴设置里选定「我是谁」。善意、挥手和状态记在这个名字上。";

export function revertKindness(name: string, clock = shanghaiClock(), viewer = viewerName()) {
  if (!viewer) return false;
  const book = loadKindness(viewer);
  const undone = undoKindness(book[name], clock);
  if (!undone) return false;
  book[name] = undone;
  writeJson(viewerStorageKey(viewer, "kindness"), book);
  publishPrefs({ comfort: prefs.comfort, selfName: prefs.selfName, preset: prefs.preset });
  return true;
}

export function kindnessDayCounts(viewer = viewerName()) {
  if (!viewer) return {} as Record<string, number>;
  const book = loadKindness(viewer);
  return Object.fromEntries(Object.entries(book).map(([name, entry]) => [name, entry.days.length]));
}

const CARE_YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar days only. Sentences stored by mistake are dropped. */
export function kindnessDays(name: string, viewer = viewerName()): string[] {
  if (!viewer || !name) return [];
  const days = loadKindness(viewer)[name]?.days;
  if (!Array.isArray(days)) return [];
  return days.filter((day): day is string => typeof day === "string" && CARE_YMD.test(day));
}

export function kindnessOnDay(ymd: string, viewer = viewerName()) {
  if (!viewer) return false;
  return Object.values(loadKindness(viewer)).some((entry) => entry.days.includes(ymd));
}

export function spendKindness(name: string, clock = shanghaiClock(), viewer = viewerName()) {
  if (!viewer) return { ok: false as const, line: NEED_IDENTITY };
  const book = loadKindness(viewer);
  const spent = commitKindness(book[name], clock);
  if (!spent.ok) return { ok: false as const, line: spent.line };
  book[name] = spent.entry;
  writeJson(viewerStorageKey(viewer, "kindness"), book);
  publishPrefs({ comfort: prefs.comfort, selfName: prefs.selfName, preset: prefs.preset });
  return { ok: true as const, sundayBonus: spent.sundayBonus, weekCount: spent.weekCount };
}

export function sundayGlowNames(names: string[], clock = shanghaiClock(), viewer = viewerName()) {
  if (!clock.sunday || !viewer) return [];
  return names.filter((name) => kindnessStatus(name, clock, viewer).sundayBonus);
}

export function waveStatus(name: string, now = Date.now(), viewer = viewerName()) {
  if (!viewer) return { allowed: false, retryAfterMin: 0, needIdentity: true as const };
  const book = readJson<Record<string, number>>(viewerStorageKey(viewer, "wave"), {});
  return { ...waveView(book[name], now), needIdentity: false as const };
}

export function waveAllowed(name: string, now = Date.now(), viewer = viewerName()) {
  return waveStatus(name, now, viewer).allowed;
}

export function spendWave(name: string, now = Date.now(), viewer = viewerName()) {
  if (!viewer) return { ok: false as const, line: NEED_IDENTITY, retryAfterMin: 0 };
  const book = readJson<Record<string, number>>(viewerStorageKey(viewer, "wave"), {});
  const status = waveView(book[name], now);
  if (!status.allowed) {
    return { ok: false as const, line: waveExhaustedLine(status.retryAfterMin), retryAfterMin: status.retryAfterMin };
  }
  const fresh: Record<string, number> = {};
  for (const [key, at] of Object.entries(book)) {
    if (now - at < 48 * 60 * 60 * 1000) fresh[key] = at;
  }
  fresh[name] = now;
  writeJson(viewerStorageKey(viewer, "wave"), fresh);
  publishPrefs({ comfort: prefs.comfort, selfName: prefs.selfName, preset: prefs.preset });
  return { ok: true as const, line: "挥了挥手。", retryAfterMin: 0 };
}

export function loadGarden(name: string, viewer = viewerName()): { date: string; level: number }[] {
  if (!viewer) return [];
  const store = readJson<Record<string, Record<string, number>>>(viewerStorageKey(viewer, "garden"), {});
  const days = store[name] ?? {};
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-HISTORY_DAYS)
    .map(([date, level]) => ({ date, level }));
}

export function recordScoreHistory(payload: Pick<ScorePayload, "date" | "people" | "disclaimer">) {
  const book = readJson<HistoryBook>(SCORE_HISTORY_KEY, {});
  const next = mergeHistoryDay(book, {
    date: payload.date,
    disclaimer: payload.disclaimer,
    people: payload.people,
  });
  writeJson(SCORE_HISTORY_KEY, next);
  publishPrefs({ comfort: prefs.comfort, selfName: prefs.selfName, preset: prefs.preset });
}

export function localScoreHistory(name: string, today: string) {
  const book = readJson<HistoryBook>(SCORE_HISTORY_KEY, {});
  const end = historyEndDate(book, today);
  const days = personHistory(book, name, end);
  return {
    days,
    recordedDays: days.filter((day) => day.present).length,
    source: "local" as const,
  };
}

export function scoreInsights(weekKey: string) {
  const book = readJson<HistoryBook>(SCORE_HISTORY_KEY, {});
  const out: Record<string, { scoredDays: number; week: { work: number; fish: number; on_task: number }[] }> = {};
  for (const [date, points] of Object.entries(book)) {
    const inWeek = weekKeyOf(date) === weekKey;
    for (const point of points) {
      const row = out[point.name] ?? { scoredDays: 0, week: [] };
      if (point.scored && point.work != null && point.fish != null && point.on_task != null) {
        row.scoredDays += 1;
        if (inWeek) row.week.push({ work: point.work, fish: point.fish, on_task: point.on_task });
      }
      out[point.name] = row;
    }
  }
  return out;
}

export function recordGarden(date: string, people: PersonWithState[], viewer = viewerName()) {
  if (!viewer) return;
  const store = readJson<Record<string, Record<string, number>>>(viewerStorageKey(viewer, "garden"), {});
  for (const person of people) {
    const days = store[person.name] ?? {};
    days[date] = activityLevel(person);
    const kept = Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-HISTORY_DAYS);
    store[person.name] = Object.fromEntries(kept);
  }
  writeJson(viewerStorageKey(viewer, "garden"), store);
}
