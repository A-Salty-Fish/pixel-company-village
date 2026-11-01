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
/** Screen sweeps (转场): star iris on 我是谁, wipes on big zoom steps and at dusk and dawn. */
export const MAGIC_TRANSITIONS_ENABLED = true;
/** Birds, bats, frogs, ghosts and friends drifting around the landmarks. */
export const MAGIC_CRITTERS_ENABLED = true;
/** Little game-style pops: LEVEL UP on your own cat, a combo counter on fast taps, a daily badge. */
export const MAGIC_UI_FEEDBACK_ENABLED = true;
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
  /** Landmark loops drawn at once, nearest the core first. */
  landmarkCap: number;
  /** Screen sweeps (转场) on zoom, day/night and 我是谁. */
  transitions: boolean;
  /** Light strength multiplier for glow pixels. */
  glow: number;
};

const OFF: MagicBudget = {
  on: false,
  animate: false,
  weather: 0,
  weatherFps: 0,
  auras: 0,
  spells: 0,
  landmarks: false,
  landmarkCap: 0,
  transitions: false,
  glow: 0,
};

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
      landmarkCap: many ? 30 : 12,
      transitions: false,
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
    landmarkCap: many ? (narrow ? 26 : 44) : 12,
    transitions: MAGIC_TRANSITIONS_ENABLED && many,
    glow: many ? 1 : 0.75,
  };
}

/** Lighter budget for a phone that has fallen under ~24fps: one weather layer, slower weather, fewer auras and spells. */
export function strainedBudget(budget: MagicBudget): MagicBudget {
  if (!budget.on || !budget.animate) return budget;
  return {
    ...budget,
    weather: Math.min(budget.weather, 1),
    weatherFps: Math.min(budget.weatherFps, 8),
    auras: Math.min(budget.auras, 6),
    spells: Math.min(budget.spells, 4),
    landmarkCap: Math.min(budget.landmarkCap, 14),
    transitions: false,
  };
}

/* ---------------------------------------------------------------- auras */

export type AuraKind = "arcane" | "holy" | "fish" | "sleepy" | "dozing" | "charged" | "popular";

export type AuraInput =
  | { scored: false }
  | { scored: true; work: number; fish: number; on_task: number; msgs: number };

export type Aura = { kind: AuraKind; strength: number; tier: 0 | 1 | 2 };

export const AURA_WORK = 2.5;
export const AURA_FISH = 2.5;
export const AURA_TASK = 0.8;
/** Top of the scale: a charged orb for work, zzz for fish. */
export const AURA_WORK_TOP = 4.5;
export const AURA_FISH_TOP = 4;

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
  if (person.work >= AURA_WORK)
    options.push({ kind: person.work >= AURA_WORK_TOP ? "charged" : "arcane", strength: person.work / 5, tier });
  if (person.on_task >= AURA_TASK) options.push({ kind: "holy", strength: person.on_task, tier });
  if (person.fish >= AURA_FISH)
    options.push({ kind: person.fish >= AURA_FISH_TOP ? "dozing" : "fish", strength: person.fish / 5, tier });
  // a busy day by count alone (never the messages) earns a few floating hearts
  if (!options.length && tier === 2) options.push({ kind: "popular", strength: 0.3, tier });
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

/** Effect ids from src/vendor/pixelfx/fx, plus the village's own under "village/". Tap a person: one of these. */
export const PERSON_SPELLS = [
  // arcane
  "arcane/blink-in",
  "arcane/blink-out",
  "arcane/mana-burst",
  "arcane/star-fall",
  "arcane/time-stop",
  "arcane/spell-charge",
  // holy
  "holy/heal",
  "holy/heal-aoe",
  "holy/feather-burst",
  "holy/holy-pillar",
  "holy/resurrection",
  "holy/divine-shield",
  // ice
  "ice/frost-nova",
  "ice/snowflake-burst",
  "ice/freeze",
  "ice/ice-shatter",
  "ice/icicle-fall",
  "ice/ice-spikes",
  // nature and water
  "nature/healing-bloom",
  "nature/spore-burst",
  "nature/leaf-storm",
  "water/water-orb",
  "water/geyser",
  // pickups and spawn
  "pickups/collect-burst",
  "pickups/chest-open",
  "pickups/power-star",
  "spawn/coin-drop",
  "spawn/poof",
  "spawn/egg-hatch",
  "spawn/spawn-portal",
  "spawn/respawn-beam",
  // party
  "ui/confetti",
  "ui/exclamation",
  "explosions/firework-burst",
  "explosions/cartoon-pow",
  "explosions/implosion",
  "explosions/plasma-explosion",
  "explosions/smoke-bomb",
  // sparks and gadgets
  "lightning/charge-up",
  "lightning/electrified",
  "lightning/ball-lightning",
  "scifi/warp-in",
  "scifi/warp-out",
  "scifi/force-field",
  "scifi/glitch",
  "fire/fire-ring",
  "village/heart-pop",
  "village/star-pop",
] as const;

/** 挥手 and 关照: a blessing lands on the one being cared for. */
export const KIND_SPELLS = [
  "holy/blessing",
  "holy/heal",
  "nature/healing-bloom",
  "holy/feather-burst",
  "ui/quest-complete",
  "village/heart-pop",
] as const;

/** Tap your own cat (我是谁): a little game pop. */
export const SELF_SPELLS = ["ui/level-up", "ui/achievement", "ui/quest-complete"] as const;

/** Ground taps away from people and landmarks. Mostly a soft glint; now and then something more. */
export const GROUND_SPELLS = [
  "village/ground-glint",
  "village/ground-glint",
  "village/ground-glint",
  "spawn/poof",
  "pickups/collect-burst",
  "nature/healing-bloom",
  "spawn/egg-hatch",
  "nature/spore-burst",
  "pickups/heart-pickup",
  "nature/vine-whip",
  "nature/thorns",
] as const;
/** After dark the ground answers with a little more drama. */
export const NIGHT_GROUND_SPELLS = [
  "village/ground-glint",
  "village/ground-glint",
  "lightning/lightning-strike",
  "shadow/hex-sigil",
  "lightning/zap-hit",
  "explosions/firework-burst",
] as const;
export const POND_SPELLS = ["water/splash", "water/wave-crash", "water/splash", "water/rain-splash"] as const;

/** A short status sticker that rides along on a person for a few seconds. */
export const STATUS_AFTER: Readonly<Record<string, { id: string; seconds: number }>> = {
  "explosions/cartoon-pow": { id: "status/stunned", seconds: 2.4 },
  "explosions/smoke-bomb": { id: "status/confused", seconds: 2.4 },
  "ice/freeze": { id: "status/frozen", seconds: 2.4 },
  "arcane/time-stop": { id: "status/slowed", seconds: 2.4 },
  "lightning/charge-up": { id: "status/haste", seconds: 2.4 },
  "holy/blessing": { id: "status/charmed", seconds: 4 },
  "village/heart-pop": { id: "status/charmed", seconds: 3 },
};

/** Fast taps (5 within a few seconds) pop a combo counter. */
export const COMBO_TAPS = 5;
export const COMBO_WINDOW_MS = 4000;
export const COMBO_SPELL = "ui/combo-counter";

/** Screen sweeps, in rotation. Drawn as light only (black parts add nothing), so the map never goes dark. */
export const TRANSITIONS = [
  "transitions/star-iris",
  "transitions/pixel-dissolve",
  "transitions/diamond-wipe",
  "transitions/slash-wipe",
  "transitions/shatter-wipe",
  "transitions/burn-away",
  "transitions/iris",
  "transitions/blinds",
  "transitions/glitch-wipe",
] as const;

/** Deterministic pick so tests and screenshots repeat. The scene feeds a fresh number per tap. */
export function pickSpell<T extends string>(set: readonly T[], roll: number, avoid?: string | null): T {
  const n = set.length;
  let index = Math.abs(Math.floor(roll)) % n;
  if (avoid && set[index] === avoid && n > 1) index = (index + 1) % n;
  return set[index];
}

/* ---------------------------------------------------------------- landmarks */

export type LandmarkId =
  | "plaza-circle"
  | "gate-portal"
  | "fountain"
  | "bonfire"
  | "lanterns"
  | "pond"
  | "tent-stall"
  | "night-market"
  | "shrine"
  | "warp-pad"
  | "star-orb"
  | "east-gate";

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
  { id: "tent-stall", title: "魔法帐篷", x: 760, y: 168, radius: 26, cast: "pickups/chest-open" },
  { id: "night-market", title: "夜市小摊", x: 1016, y: 924, radius: 30, cast: "ui/coin-collect" },
  { id: "shrine", title: "祈愿牌", x: 1090, y: 132, radius: 22, cast: "holy/holy-pillar" },
  { id: "warp-pad", title: "传送台", x: 34, y: 656, radius: 22, cast: "scifi/warp-in" },
  { id: "star-orb", title: "观星球", x: 600, y: 66, radius: 22, cast: "arcane/time-stop" },
  { id: "east-gate", title: "东口倒数牌", x: 1186, y: 656, radius: 22, cast: "ui/countdown" },
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

export function inPond(x: number, y: number) {
  return x >= 32 && x <= 224 && y >= 32 && y <= 128;
}

/** Ground taps: the pond splashes, the rest mostly sparkles. roll picks from the pool; 0 is always the plain glint. */
export function groundSpell(x: number, y: number, roll = 0, night = false) {
  if (inPond(x, y)) return pickSpell(POND_SPELLS, roll);
  return pickSpell(night ? NIGHT_GROUND_SPELLS : GROUND_SPELLS, roll);
}

/* ---------------------------------------------------------------- 今日魔法 */

export type DailyMagic = {
  id:
    | "meteor"
    | "petals"
    | "fireworks"
    | "aurora"
    | "snowglobe"
    | "coins"
    | "feathers"
    | "lanterns"
    | "drizzle"
    | "thunder"
    | "moonclouds"
    | "gale"
    | "sunbeams";
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
  { id: "drizzle", title: "魔法细雨", line: "下一场不会淋湿人的小雨。", weather: "weather/rain", opener: "water/rain-splash" },
  { id: "thunder", title: "雷光夜", line: "天黑后云里会闪几道雷光。", weather: "weather/storm", opener: "lightning/lightning-strike" },
  { id: "moonclouds", title: "月下云", line: "晚上月亮躲在云后面。", weather: "weather/clouds", opener: "arcane/magic-circle-cast" },
  { id: "gale", title: "风雪日", line: "一阵小风雪从村里刮过。", weather: "weather/blizzard", opener: "ice/icicle-fall" },
  { id: "sunbeams", title: "晨光日", line: "一整天都有斜斜的光。", weather: "weather/god-rays", opener: "holy/sunburst" },
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
    if (daily === "weather/aurora" || daily === "weather/shooting-stars" || daily === "weather/storm" || daily === "weather/clouds")
      add(daily);
    else add(input.hour >= 22 || input.hour < 5 ? "weather/aurora" : "weather/shooting-stars");
    add(daily && daily !== "weather/god-rays" ? daily : null);
    add("weather/fog");
    return plan;
  }
  const nightOnly = ["weather/aurora", "weather/shooting-stars", "weather/fireflies", "weather/storm", "weather/clouds"];
  if (daily && !nightOnly.includes(daily)) add(daily);
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
  if (id === "weather/clouds") return { top: 0, bottom: 0.42 };
  if (id === "weather/storm") return { top: 0, bottom: 0.55 };
  if (id === "weather/god-rays") return { top: 0, bottom: 0.7 };
  if (id === "weather/fog") return { top: 0.7, bottom: 1 };
  return { top: 0, bottom: 1 };
}

/** Sky layers are painted once across the view (an aurora must not repeat); particle layers are tiled. */
export function weatherIsSky(id: string) {
  return (
    id === "weather/aurora" ||
    id === "weather/shooting-stars" ||
    id === "weather/god-rays" ||
    id === "weather/fog" ||
    id === "weather/clouds" ||
    id === "weather/storm"
  );
}

/* ---------------------------------------------------------------- counts */

/* ---------------------------------------------------------------- standing loops */

export type Loop = {
  id: string;
  x: number;
  y: number;
  opts?: Record<string, unknown>;
  scale?: number;
  alpha?: number;
  night?: boolean;
  day?: boolean;
  /** Critters wander: world pixels of sway on x and y, and seconds per round. */
  drift?: [number, number, number];
};

/**
 * The standing magic of the town, in draw priority (the budget keeps the head of the list).
 * World pixels, kept off the plot rows so a 100-person map keeps every seat.
 */
export const LANDMARK_LOOPS: readonly Loop[] = [
  // 魔法阵广场: rune circle on the crossroads, braziers on two corners
  { id: "arcane/rune-circle", x: 608, y: 676, scale: 0.6 },
  { id: "fire/brazier", x: 568, y: 640, scale: 0.42 },
  { id: "fire/brazier", x: 648, y: 640, scale: 0.42, opts: { seed: 5 } },
  // 村口传送门 beside the gate post
  { id: "arcane/portal", x: 60, y: 206, scale: 0.42 },
  // 许愿泉 on the pond bank, with fish under the water and ripples
  { id: "water/fountain", x: 300, y: 204, scale: 0.42 },
  { id: "critters/fish-school", x: 120, y: 84, scale: 0.6, alpha: 0.85 },
  { id: "water/ripples", x: 176, y: 108, scale: 0.5, alpha: 0.7 },
  // 篝火 by the picnic spot
  { id: "fire/campfire", x: 660, y: 214, scale: 0.4 },
  // 浮空灯 over the path lantern
  { id: "fire/spirit-flame", x: 610, y: 222, scale: 0.34, opts: { palette: ["#3a1406", "#7a2a0a", "#c8561a", "#f29a32", "#ffd06a", "#fff1b8"] } },
  { id: "fire/candle", x: 586, y: 214, scale: 0.5 },
  { id: "fire/candle", x: 634, y: 210, scale: 0.5, opts: { seed: 7 } },
  // 魔法帐篷: a little stall of potions and crystals in front of the tent
  { id: "pickups/potion", x: 736, y: 172, scale: 0.42 },
  { id: "pickups/crystal-shard", x: 760, y: 168, scale: 0.42 },
  { id: "pickups/gem-spin", x: 784, y: 172, scale: 0.42 },
  // 夜市小摊 at the bottom-right stall
  { id: "pickups/coin-spin", x: 994, y: 918, scale: 0.42 },
  { id: "pickups/key-glint", x: 1016, y: 914, scale: 0.42 },
  { id: "pickups/heart-pickup", x: 1038, y: 918, scale: 0.42 },
  { id: "pickups/loot-beam", x: 1016, y: 904, scale: 0.34, alpha: 0.7, night: true },
  // 祈愿牌: the cross sign gets a small sun by day and a holy candle by night
  { id: "holy/sunburst", x: 1090, y: 118, scale: 0.26, day: true },
  { id: "fire/torch", x: 1090, y: 128, scale: 0.34, night: true },
  // 观星球 between the house and the tent, a crystal by the pond
  { id: "arcane/arcane-orb", x: 600, y: 66, scale: 0.3 },
  { id: "ice/ice-crystal", x: 250, y: 64, scale: 0.36, night: true },
  // 传送台 and 东口: the two ends of the plaza road
  { id: "scifi/teleporter-pad", x: 34, y: 660, scale: 0.36 },
  { id: "pickups/power-star", x: 1186, y: 648, scale: 0.36 },
  // torches along the top road and the plaza road
  { id: "fire/torch", x: 440, y: 192, scale: 0.34 },
  { id: "fire/torch", x: 880, y: 192, scale: 0.34, opts: { seed: 4 } },
  { id: "fire/torch", x: 340, y: 636, scale: 0.34, opts: { seed: 6 } },
  { id: "fire/torch", x: 880, y: 636, scale: 0.34, opts: { seed: 9 } },
  // floating pickups along the plaza road, after dark
  { id: "pickups/xp-orb", x: 220, y: 664, scale: 0.42, night: true },
  { id: "pickups/coin-spin", x: 470, y: 664, scale: 0.42, night: true, opts: { seed: 3 } },
  { id: "pickups/gem-spin", x: 760, y: 664, scale: 0.42, night: true, opts: { seed: 5 } },
  { id: "pickups/crystal-shard", x: 1010, y: 664, scale: 0.42, night: true, opts: { seed: 7 } },
  // pond life
  { id: "water/bubbles", x: 64, y: 70, scale: 0.34, alpha: 0.6 },
  { id: "critters/frog", x: 196, y: 118, scale: 0.42, day: true },
  { id: "critters/jellyfish", x: 80, y: 64, scale: 0.34, alpha: 0.8, night: true },
  { id: "water/whirlpool", x: 176, y: 62, scale: 0.3, alpha: 0.55, night: true },
  // a plasma lamp on the house porch after dark
  { id: "lightning/plasma-ball", x: 540, y: 176, scale: 0.28, night: true },
  // chimney smoke on the two houses
  { id: "village/chimney-smoke", x: 510, y: 104, alpha: 0.85 },
  { id: "village/chimney-smoke", x: 782, y: 120, alpha: 0.85, opts: { seed: 8 } },
  // road glints on the top road and the long street
  { id: "village/road-glint", x: 380, y: 230, night: true },
  { id: "village/road-glint", x: 860, y: 230, night: true, opts: { seed: 12 } },
  { id: "village/road-glint", x: 608, y: 450, night: true, opts: { along: "y", seed: 14 } },
  { id: "village/road-glint", x: 300, y: 658, night: true, opts: { seed: 16 } },
  { id: "village/road-glint", x: 920, y: 658, night: true, opts: { seed: 18 } },
  // critters: wisps and butterflies drift over the meadow, birds by day, bats and a shy ghost by night
  { id: "critters/wisp", x: 1000, y: 120, scale: 0.5, night: true, drift: [30, 10, 14] },
  { id: "critters/wisp", x: 250, y: 560, scale: 0.5, night: true, opts: { seed: 3 }, drift: [24, 12, 17] },
  { id: "critters/butterfly", x: 960, y: 110, scale: 0.6, day: true, drift: [40, 14, 16] },
  { id: "critters/butterfly", x: 300, y: 330, scale: 0.6, day: true, opts: { seed: 5 }, drift: [30, 12, 13] },
  { id: "critters/bird", x: 330, y: 30, scale: 0.46, day: true, drift: [120, 8, 22] },
  { id: "critters/bird", x: 960, y: 560, scale: 0.42, day: true, opts: { seed: 4 }, drift: [90, 10, 19] },
  { id: "critters/bat", x: 1150, y: 60, scale: 0.42, night: true, drift: [60, 18, 11] },
  { id: "critters/bat", x: 160, y: 500, scale: 0.4, night: true, opts: { seed: 6 }, drift: [50, 16, 13] },
  { id: "critters/ghost", x: 1170, y: 790, scale: 0.4, alpha: 0.75, night: true, drift: [16, 10, 9] },
  { id: "critters/slime", x: 46, y: 1040, scale: 0.4, drift: [20, 0, 12] },
  { id: "critters/snake", x: 900, y: 1080, scale: 0.4, day: true, drift: [36, 0, 15] },
];

export function loopIsCritter(loop: Loop) {
  return loop.id.startsWith("critters/");
}

/** Where a loop sits at time t: critters sway on a slow figure-of-eight, everything else stays put. */
export function loopAt(loop: Loop, t: number, index: number) {
  if (!loop.drift) return { x: loop.x, y: loop.y };
  const [ax, ay, period] = loop.drift;
  const a = ((t + index * 1.7) / Math.max(1, period)) * Math.PI * 2;
  return { x: loop.x + Math.sin(a) * ax, y: loop.y + Math.sin(a * 2) * ay };
}

/* ---------------------------------------------------------------- counts */

export const WEATHER_EFFECTS = [
  "weather/fireflies",
  "weather/aurora",
  "weather/shooting-stars",
  "weather/fog",
  "weather/falling-leaves",
  "weather/cherry-blossoms",
  "weather/snow",
  "weather/god-rays",
  "weather/rain",
  "weather/storm",
  "weather/clouds",
  "weather/blizzard",
] as const;

export const AURA_EFFECTS = [
  "village/arcane-motes",
  "arcane/spell-charge",
  "holy/halo",
  "village/fish-bubbles",
  "status/sleep",
  "status/charmed",
  "village/sleepy-sparkle",
] as const;

const uniq = (list: readonly string[]) => [...new Set(list)];

/** Every effect the town can show, grouped the way the release notes count them. */
export function effectCatalog() {
  const landmarks = uniq(LANDMARK_LOOPS.filter((loop) => !loopIsCritter(loop)).map((loop) => loop.id));
  const critters = uniq(LANDMARK_LOOPS.filter(loopIsCritter).map((loop) => loop.id));
  const status = uniq(Object.values(STATUS_AFTER).map((entry) => entry.id));
  return {
    weather: [...WEATHER_EFFECTS],
    landmarks,
    critters,
    auras: uniq([...AURA_EFFECTS, ...status]),
    personSpells: uniq(PERSON_SPELLS),
    kindness: uniq(KIND_SPELLS),
    self: uniq(SELF_SPELLS),
    ground: uniq([...GROUND_SPELLS, ...NIGHT_GROUND_SPELLS, ...POND_SPELLS]),
    landmarkSpells: uniq(LANDMARKS.map((mark) => mark.cast)),
    daily: uniq(DAILY_MAGICS.map((day) => day.opener)),
    transitions: [...TRANSITIONS],
    ui: [COMBO_SPELL],
  };
}

/** Standing effects: weather, landmarks, critters, auras. */
export const AMBIENT_EFFECTS: readonly string[] = (() => {
  const c = effectCatalog();
  return uniq([...c.weather, ...c.landmarks, ...c.critters, ...c.auras]);
})();

export function triggerEffects(): string[] {
  const c = effectCatalog();
  return uniq([
    ...c.personSpells,
    ...c.kindness,
    ...c.self,
    ...c.ground,
    ...c.landmarkSpells,
    ...c.daily,
    ...c.transitions,
    ...c.ui,
  ]);
}

/** Every distinct effect id, pixelfx and village-made. */
export function allEffects(): string[] {
  return uniq([...AMBIENT_EFFECTS, ...triggerEffects()]);
}
