/**
 * PV-WIZARD-001 — every villager wears a little wizard outfit: pointed hat, robe, staff.
 * Robe and hat colours come from a fixed hash of the display name, so the same person always
 * looks the same. Scores only add small trim: work → robe hem runes, on_task → hat stars,
 * fish → a sleepy drooping hat tip. Unscored people are wizards too, just in plain homespun.
 * Only the display name and numeric scores are read. Set WIZARD_LOOK_ENABLED to false for the plain cats.
 */

export const WIZARD_LOOK_ENABLED = true;
/** Idle staff sway and the tap swing. False keeps the outfit but holds the staff still. */
export const WIZARD_POSE_ENABLED = true;

export type Facing = "down" | "up" | "left" | "right";

/** [main, shade, light] — ten robes that read apart on grass, paths and at night. */
export const ROBES: readonly (readonly [string, string, string])[] = [
  ["#5b3c9e", "#3a2468", "#8a6ad0"], // violet
  ["#2f4f9e", "#1c3068", "#5a80d4"], // royal blue
  ["#9e2f45", "#661c2c", "#d45a70"], // crimson
  ["#2f8a5a", "#1c5a38", "#5ac088"], // emerald
  ["#1f7f8a", "#124f58", "#4ab4c0"], // teal
  ["#8a3a86", "#5a2258", "#c26abe"], // plum
  ["#c0702a", "#82461a", "#e8a058"], // amber
  ["#3a3f66", "#22263f", "#6a70a0"], // midnight
  ["#b0405e", "#74283c", "#e07892"], // rose
  ["#6a7a2a", "#454f1a", "#9aac50"], // moss
];
export const PLAIN_ROBE = ["#8a7a62", "#5e5242", "#b2a284"] as const;
export const GEMS = ["#7ae8ff", "#ff7ad2", "#ffd84a", "#8aff7a", "#ff8a4a", "#c49aff"] as const;
export const TRIM = "#f2d15c";

export const WIZARD_WORK = 2.5;
export const WIZARD_WORK_TOP = 4.5;
export const WIZARD_TASK = 0.6;
export const WIZARD_TASK_TOP = 0.85;
export const WIZARD_FISH = 3.5;

export type WizardScores = { scored: false } | { scored: true; work: number; fish: number; on_task: number };

export type WizardStyle = {
  robe: number;
  /** 0 same hue as the robe, 1 the shade, 2 the deep midnight */
  hat: number;
  gem: number;
  trim: 0 | 1 | 2;
  star: 0 | 1 | 2;
  droop: boolean;
  plain: boolean;
  phase: number;
  key: string;
};

function hash(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function wizardStyle(name: string, scores: WizardScores): WizardStyle {
  const h = hash(`wizard:${name}`);
  const robe = h % ROBES.length;
  const hat = (h >>> 5) % 3;
  const gem = (h >>> 9) % GEMS.length;
  const phase = ((h >>> 13) % 628) / 100;
  if (!scores.scored) {
    return { robe, hat, gem, trim: 0, star: 0, droop: false, plain: true, phase, key: `p${robe}.${hat}` };
  }
  const trim: 0 | 1 | 2 = scores.work >= WIZARD_WORK_TOP ? 2 : scores.work >= WIZARD_WORK ? 1 : 0;
  const star: 0 | 1 | 2 = scores.on_task >= WIZARD_TASK_TOP ? 2 : scores.on_task >= WIZARD_TASK ? 1 : 0;
  const droop = scores.fish >= WIZARD_FISH;
  return { robe, hat, gem, trim, star, droop, plain: false, phase, key: `${robe}.${hat}.${trim}${star}${droop ? 1 : 0}` };
}

export function robeColors(style: WizardStyle) {
  return style.plain ? PLAIN_ROBE : ROBES[style.robe];
}

export function hatColors(style: WizardStyle): readonly [string, string, string] {
  const robe = robeColors(style);
  if (style.plain) return ["#6e604c", "#4a4034", "#948468"];
  if (style.hat === 1) return [robe[1], "#1a1028", robe[0]];
  if (style.hat === 2) return ROBES[7];
  return robe;
}

/** The cat sheet's tool poses (chop, dig, water) become a plain stand; the staff does the work instead. */
export function wizardAnim<T extends string>(anim: T): T | "idle" {
  return anim === "chop" || anim === "dig" || anim === "water" ? "idle" : anim;
}

export type WizardProp = "none" | "raise" | "book";

/** What the free hand does, from the score state only. */
export function wizardProp(state: string, t: number): WizardProp {
  if (state === "hard_work") return "raise";
  if (state === "focused") return "book";
  if (state === "mixed") return Math.floor(t * 0.35) % 2 === 0 ? "raise" : "book";
  return "none";
}

export type WizardPose = {
  /** staff tip offset in pixels, -1..1 */
  sway: number;
  /** 0 → upright, 1 → full forward swing */
  swing: number;
  /** gem flash 0..1 */
  flash: number;
};

export const SWING_MS = 620;

export function wizardPose(t: number, phase: number, tapElapsedMs: number, reduced: boolean, enabled = WIZARD_POSE_ENABLED): WizardPose {
  if (!enabled || reduced) return { sway: 0, swing: 0, flash: 0 };
  const sway = Math.round(Math.sin(t * 1.7 + phase) * 1.2);
  if (tapElapsedMs < 0 || tapElapsedMs > SWING_MS) {
    const flash = Math.max(0, Math.sin(t * 2.3 + phase * 2) - 0.92) * 12;
    return { sway, swing: 0, flash: Math.min(1, flash) };
  }
  const p = tapElapsedMs / SWING_MS;
  // quick wind-up, a snap forward, then ease back
  const swing = p < 0.18 ? -p / 0.18 * 0.25 : p < 0.4 ? -0.25 + ((p - 0.18) / 0.22) * 1.25 : 1 - (p - 0.4) / 0.6;
  return { sway: 0, swing: Math.max(-0.25, Math.min(1, swing)), flash: p > 0.3 && p < 0.7 ? 1 : 0 };
}

/** Which side the staff hangs on, relative to the anchor. */
export function staffSide(dir: Facing) {
  if (dir === "down") return 11;
  if (dir === "up") return -11;
  if (dir === "right") return 9;
  return -10;
}

/** The tip leans the way the wizard faces. */
export function hatLean(dir: Facing) {
  if (dir === "left") return -1;
  return 1;
}
