/**
 * PV-MAGIC-001 — 魔法小镇. pixelfx effects over the village map.
 * Ambient weather, landmark loops, per-person auras from numeric scores, and tap spells.
 * Privacy: auras read only work / fish / on_task / msgs counts and the scored flag. No copy names a chat.
 * Each block has its own flag. Set MAGIC_TOWN_ENABLED to false to switch the whole layer off.
 */

export const MAGIC_TOWN_ENABLED = true;
/** Weather overlay: fireflies, aurora, mist, leaves, petals, snow, god rays. */
export const MAGIC_AMBIENT_ENABLED = true;
/** Portal, magic circle, fountain, bonfire, floating lanterns, chimney smoke, road glints. */
export const MAGIC_LANDMARKS_ENABLED = true;
/** Orbs, halos, fish bubbles, and sleepy sparkles above people. Numbers only. */
export const MAGIC_AURA_ENABLED = true;
/** Tap a person, the ground, or a landmark to cast. */
export const MAGIC_SPELLS_ENABLED = true;
/** 今日魔法: one surprise per calendar day. */
export const MAGIC_DAILY_ENABLED = true;
/** 魔法：多 / 少 / 关 in 体贴设置. Off keeps the default level. */
export const MAGIC_SETTING_ENABLED = true;

export type MagicLevel = "many" | "few" | "off";

export const MAGIC_LEVELS: readonly { id: MagicLevel; label: string }[] = [
  { id: "many", label: "多" },
  { id: "few", label: "少" },
  { id: "off", label: "关" },
];

export const DEFAULT_MAGIC_LEVEL: MagicLevel = "many";

export function magicLevelFrom(raw: unknown): MagicLevel {
  return raw === "many" || raw === "few" || raw === "off" ? raw : DEFAULT_MAGIC_LEVEL;
}

export function magicOn(level: MagicLevel, enabled = MAGIC_TOWN_ENABLED) {
  return enabled && level !== "off";
}

export type MagicBudget = {
  /** Draw anything at all. */
  on: boolean;
  /** Time moves. False paints one still frame (reduced motion). */
  animate: boolean;
  /** Screen weather layers at once. */
  weather: number;
  /** Weather redraws per second. */
  weatherFps: number;
  /** Visible person auras at once. */
  auras: number;
  /** Live one-shot spells at once. */
  spells: number;
  landmarks: boolean;
  /** Light strength multiplier for glow pixels. */
  glow: number;
};

const OFF: MagicBudget = { on: false, animate: false, weather: 0, weatherFps: 0, auras: 0, spells: 0, landmarks: false, glow: 0 };

export function magicBudget(
  level: MagicLevel,
  input: { reduceMotion: boolean; narrow?: boolean },
  enabled = MAGIC_TOWN_ENABLED,
): MagicBudget {
  if (!magicOn(level, enabled)) return OFF;
  const many = level === "many";
  if (input.reduceMotion) {
    // Still frames only: landmarks and auras hold one pose, no weather, no bursts.
    return {
      on: true,
      animate: false,
      weather: 0,
      weatherFps: 0,
      auras: MAGIC_AURA_ENABLED ? (many ? 10 : 5) : 0,
      spells: 0,
      landmarks: MAGIC_LANDMARKS_ENABLED,
      glow: 0.7,
    };
  }
  const narrow = Boolean(input.narrow);
  return {
    on: true,
    animate: true,
    weather: MAGIC_AMBIENT_ENABLED ? (many ? 2 : 1) : 0,
    weatherFps: many ? (narrow ? 12 : 15) : 10,
    auras: MAGIC_AURA_ENABLED ? (many ? (narrow ? 12 : 18) : 6) : 0,
    spells: MAGIC_SPELLS_ENABLED ? (many ? (narrow ? 6 : 10) : 3) : 0,
    landmarks: MAGIC_LANDMARKS_ENABLED,
    glow: many ? 1 : 0.75,
  };
}

/* ---------------------------------------------------------------- auras */

export type AuraKind = "arcane" | "holy" | "fish" | "sleepy";

export type AuraInput =
  | { scored: false }
  | { scored: true; work: number; fish: number; on_task: number; msgs: number };

export type Aura = { kind: AuraKind; strength: number; tier: 0 | 1 | 2 };

export const AURA_WORK = 2.5;
export const AURA_FISH = 2.5;
export const AURA_TASK = 0.8;

/** Spark size from the message count. A count, never the messages. */
export function sparkTier(msgs: number): 0 | 1 | 2 {
  const n = Number.isFinite(msgs) ? msgs : 0;
  if (n >= 80) return 2;
  if (n >= 20) return 1;
  return 0;
}

/** Which aura floats over this person, from numbers only. Null when nothing is high. */
export function auraFor(person: AuraInput): Aura | null {
  if (!person.scored) return { kind: "sleepy", strength: 0.1, tier: 0 };
  const tier = sparkTier(person.msgs);
  const options: Aura[] = [];
  if (person.work >= AURA_WORK) options.push({ kind: "arcane", strength: person.work / 5, tier });
  if (person.on_task >= AURA_TASK) options.push({ kind: "holy", strength: person.on_task, tier });
  if (person.fish >= AURA_FISH) options.push({ kind: "fish", strength: person.fish / 5, tier });
  if (!options.length) return null;
  options.sort((a, b) => b.strength - a.strength);
  return options[0];
}

/** Strongest auras first, unscored sparkles last, capped. Stable by input order on ties. */
export function pickAuras<T extends { aura: Aura | null }>(list: T[], cap: number): T[] {
  if (cap <= 0) return [];
  return list
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.aura)
    .sort((a, b) => (b.item.aura?.strength ?? 0) - (a.item.aura?.strength ?? 0) || a.index - b.index)
    .slice(0, cap)
    .map((entry) => entry.item);
}

/* ---------------------------------------------------------------- spells */

/** Effect ids from src/vendor/pixelfx/fx, plus the village's own under "village/". */
export const PERSON_SPELLS = [
  "ui/confetti",
  "explosions/firework-burst",
  "holy/heal",
  "holy/heal-aoe",
  "holy/feather-burst",
  "arcane/blink-in",
  "arcane/mana-burst",
  "arcane/star-fall",
  "ice/frost-nova",
  "ice/snowflake-burst",
  "nature/healing-bloom",
  "nature/spore-burst",
  "spawn/coin-drop",
  "pickups/collect-burst",
  "village/heart-pop",
  "village/star-pop",
] as const;

export const KIND_SPELLS = ["holy/blessing", "holy/heal", "nature/healing-bloom", "holy/feather-burst"] as const;

/** Deterministic pick so tests and screenshots repeat. The scene feeds a fresh number per tap. */
export function pickSpell<T extends string>(set: readonly T[], roll: number, avoid?: string | null): T {
  const n = set.length;
  let index = Math.abs(Math.floor(roll)) % n;
  if (avoid && set[index] === avoid && n > 1) index = (index + 1) % n;
  return set[index];
}

/* ---------------------------------------------------------------- landmarks */

export type LandmarkId = "plaza-circle" | "gate-portal" | "fountain" | "bonfire" | "lanterns" | "pond";

export type Landmark = {
  id: LandmarkId;
  title: string;
  x: number;
  y: number;
  /** Tap radius in world pixels. */
  radius: number;
  /** Spell cast when tapped. */
  cast: string;
  /** Where the spell lands, when not on the landmark itself. */
  castDy?: number;
};

/**
 * World pixels. Plaza is the crossroads (PLAZA), the gate is GATE_POST, the pond is the top-left water.
 * Nothing sits on a plot row, so a 100-person map keeps every seat.
 */
export const LANDMARKS: readonly Landmark[] = [
  { id: "plaza-circle", title: "魔法阵广场", x: 608, y: 664, radius: 34, cast: "arcane/magic-circle-cast" },
  { id: "gate-portal", title: "村口传送门", x: 66, y: 196, radius: 30, cast: "arcane/star-fall" },
  { id: "fountain", title: "许愿泉", x: 300, y: 196, radius: 26, cast: "water/geyser" },
  { id: "bonfire", title: "篝火", x: 660, y: 206, radius: 26, cast: "explosions/firework-rocket" },
  { id: "lanterns", title: "浮空灯", x: 610, y: 236, radius: 24, cast: "arcane/magic-circle-cast" },
  { id: "pond", title: "湖面", x: 128, y: 84, radius: 60, cast: "water/splash" },
];

export function hitLandmark(x: number, y: number, list: readonly Landmark[] = LANDMARKS): Landmark | null {
  let best: Landmark | null = null;
  let bestD = Infinity;
  for (const mark of list) {
    const d = (x - mark.x) ** 2 + (y - mark.y) ** 2;
    if (d <= mark.radius * mark.radius && d < bestD) {
      best = mark;
      bestD = d;
    }
  }
  return best;
}

/** Ground taps: water splashes, everything else sparkles. */
export function groundSpell(x: number, y: number) {
  const inPond = x >= 32 && x <= 224 && y >= 32 && y <= 128;
  return inPond ? "water/splash" : "village/ground-glint";
}

/* ---------------------------------------------------------------- 今日魔法 */

export type DailyMagic = {
  id: "meteor" | "petals" | "fireworks" | "aurora" | "snowglobe" | "coins" | "feathers" | "lanterns";
  title: string;
  line: string;
  /** Extra weather for the day, or null. */
  weather: string | null;
  /** Burst played once per session at the plaza. */
  opener: string;
};

export const DAILY_MAGICS: readonly DailyMagic[] = [
  { id: "meteor", title: "流星夜", line: "今晚的天上多几颗流星。", weather: "weather/shooting-stars", opener: "arcane/star-fall" },
  { id: "petals", title: "花瓣雨", line: "风里带着粉色花瓣。", weather: "weather/cherry-blossoms", opener: "nature/healing-bloom" },
  { id: "fireworks", title: "烟花日", line: "广场上空放一轮烟花。", weather: null, opener: "explosions/firework-rocket" },
  { id: "aurora", title: "极光", line: "天黑后北边挂起极光。", weather: "weather/aurora", opener: "arcane/mana-burst" },
  { id: "snowglobe", title: "雪花球", line: "村子像被装进了雪花球。", weather: "weather/snow", opener: "ice/snowflake-burst" },
  { id: "coins", title: "金币雨", line: "广场上会掉几枚金币。", weather: null, opener: "spawn/coin-drop" },
  { id: "feathers", title: "羽毛日", line: "广场上空飘一阵白羽毛。", weather: null, opener: "holy/feather-burst" },
  { id: "lanterns", title: "暖光日", line: "广场亮起一圈暖光，萤火虫也来了。", weather: "weather/fireflies", opener: "holy/heal-aoe" },
];

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Same calendar day, same surprise, on every browser. */
export function dailyMagic(ymd: string): DailyMagic {
  return DAILY_MAGICS[hashText(`magic:${ymd}`) % DAILY_MAGICS.length];
}

export function dailyMagicLine(ymd: string, enabled = MAGIC_DAILY_ENABLED) {
  if (!enabled) return "";
  const day = dailyMagic(ymd);
  return `今日魔法：${day.title}。${day.line}`;
}

/* ---------------------------------------------------------------- weather plan */

export type WeatherInput = {
  night: boolean;
  seasonId: string;
  hour: number;
  daily: DailyMagic | null;
};

/** Weather layers, most important first. The budget trims the tail. */
export function weatherPlan(input: WeatherInput): string[] {
  const plan: string[] = [];
  const add = (id: string | null) => {
    if (id && !plan.includes(id)) plan.push(id);
  };
  const daily = input.daily?.weather ?? null;
  if (input.night) {
    add("weather/fireflies");
    if (daily === "weather/aurora" || daily === "weather/shooting-stars") add(daily);
    else add(input.hour >= 22 || input.hour < 5 ? "weather/aurora" : "weather/shooting-stars");
    add(daily && daily !== "weather/god-rays" ? daily : null);
    add("weather/fog");
    return plan;
  }
  if (daily && daily !== "weather/aurora" && daily !== "weather/shooting-stars" && daily !== "weather/fireflies") add(daily);
  const season = input.seasonId;
  add(season === "spring" ? "weather/cherry-blossoms" : season === "winter" ? "weather/snow" : season === "autumn" ? "weather/falling-leaves" : null);
  if (input.hour < 10) add("weather/god-rays");
  if (input.hour >= 17) add("weather/fog");
  add("weather/falling-leaves");
  return plan;
}

/** Which tile rows of the screen a weather layer covers (0..1 from the top). */
export function weatherBand(id: string): { top: number; bottom: number } {
  if (id === "weather/aurora" || id === "weather/shooting-stars") return { top: 0, bottom: 0.5 };
  if (id === "weather/god-rays") return { top: 0, bottom: 0.7 };
  if (id === "weather/fog") return { top: 0.7, bottom: 1 };
  return { top: 0, bottom: 1 };
}

/** Sky layers are painted once across the view (an aurora must not repeat); particle layers are tiled. */
export function weatherIsSky(id: string) {
  return id === "weather/aurora" || id === "weather/shooting-stars" || id === "weather/god-rays" || id === "weather/fog";
}

/* ---------------------------------------------------------------- counts */

export const AMBIENT_EFFECTS = [
  "weather/fireflies",
  "weather/aurora",
  "weather/shooting-stars",
  "weather/fog",
  "weather/falling-leaves",
  "weather/cherry-blossoms",
  "weather/snow",
  "weather/god-rays",
  "arcane/portal",
  "arcane/rune-circle",
  "water/fountain",
  "water/ripples",
  "fire/campfire",
  "fire/brazier",
  "fire/candle",
  "fire/spirit-flame",
  "critters/butterfly",
  "critters/fish-school",
  "critters/wisp",
  "holy/halo",
  "village/arcane-motes",
  "village/fish-bubbles",
  "village/sleepy-sparkle",
  "village/chimney-smoke",
  "village/road-glint",
] as const;

export function triggerEffects(): string[] {
  const all = new Set<string>([
    ...PERSON_SPELLS,
    ...KIND_SPELLS,
    ...LANDMARKS.map((mark) => mark.cast),
    ...DAILY_MAGICS.map((day) => day.opener),
    "village/ground-glint",
    "water/splash",
  ]);
  return [...all];
}
