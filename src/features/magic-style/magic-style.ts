/**
 * PV-MAGIC-STYLE-001 — one visual language for every magic pixel.
 * Three small ramps on top of the map's own colours (warm gold, cool cyan, pale violet) plus a soft mist,
 * and three tiers: back (faint), ambient (middle) and play (the only bright one).
 * Pure functions: the painters in magic-town and magic-play call these; nothing here touches the DOM.
 */
export const MAGIC_STYLE_ENABLED = true;

export type Rgb = readonly [number, number, number];
export type Family = "gold" | "cyan" | "violet" | "mist";
export type Tier = "back" | "ambient" | "play";

function hex(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Dark to light. */
export const RAMPS: Record<Family, readonly string[]> = {
  gold: ["#7a4a1c", "#b9772a", "#e8b04a", "#ffe08a", "#fff6d6"],
  cyan: ["#1e5a6e", "#2f8fa6", "#5fd0d8", "#a8f0ec", "#effffd"],
  violet: ["#4a3470", "#7656a8", "#a888d8", "#d4c0f4", "#f8f0ff"],
  mist: ["#5a5450", "#8a827a", "#bdb4a8", "#e8e0d4", "#f6f0e6"],
};
const RAMP_RGB: Record<Family, Rgb[]> = {
  gold: RAMPS.gold.map(hex),
  cyan: RAMPS.cyan.map(hex),
  violet: RAMPS.violet.map(hex),
  mist: RAMPS.mist.map(hex),
};

export function ramp(family: Family, step: number) {
  const list = RAMPS[family];
  return list[Math.max(0, Math.min(list.length - 1, Math.round(step)))];
}

/** Every colour the magic layer may put on screen. */
export function paletteColors() {
  return Object.values(RAMPS).flat();
}

export type TierStyle = {
  /** Multiplies the effect's own alpha. */
  alpha: number;
  /** Brightest ramp step the tier may use. */
  top: number;
};

export const TIERS: Record<Tier, TierStyle> = {
  back: { alpha: 0.42, top: 2 },
  ambient: { alpha: 0.78, top: 3 },
  play: { alpha: 1, top: 4 },
};

/** Hue family for an RGB colour. Greys go to mist; reds, oranges and yellows to gold; greens and blues to cyan. */
export function familyOf(r: number, g: number, b: number): Family {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (sat < 0.18) return "mist";
  let hue: number;
  const d = max - min;
  if (max === r) hue = (((g - b) / d) % 6) * 60;
  else if (max === g) hue = ((b - r) / d + 2) * 60;
  else hue = ((r - g) / d + 4) * 60;
  if (hue < 0) hue += 360;
  if (hue >= 345 || hue < 75) return "gold";
  if (hue < 250) return "cyan";
  return "violet";
}

/** 0..4 ramp step from perceived lightness, capped by the tier. */
export function stepOf(r: number, g: number, b: number, top: number) {
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return Math.max(0, Math.min(top, Math.round(light * 4.4 - 0.2)));
}

/** Quarter-step alpha; anything fainter than a whisper is dropped so no grey haze builds up. */
export function quantAlpha(alpha: number) {
  if (alpha < 0.12) return 0;
  return Math.min(1, Math.round(alpha * 4) / 4) || 0.25;
}

const LUT_CACHE = new Map<Tier, Uint8Array>();
/** 15-bit colour to ramp colour, per tier. */
function lutFor(tier: Tier) {
  const got = LUT_CACHE.get(tier);
  if (got) return got;
  const top = TIERS[tier].top;
  const lut = new Uint8Array(32768 * 3);
  for (let i = 0; i < 32768; i += 1) {
    const r = ((i >> 10) & 31) * 8.2;
    const g = ((i >> 5) & 31) * 8.2;
    const b = (i & 31) * 8.2;
    const rgb = RAMP_RGB[familyOf(r, g, b)][stepOf(r, g, b, top)];
    lut[i * 3] = rgb[0];
    lut[i * 3 + 1] = rgb[1];
    lut[i * 3 + 2] = rgb[2];
  }
  LUT_CACHE.set(tier, lut);
  return lut;
}

/** Recolour RGBA pixels in place onto the ramps, with tiered, quantised alpha. */
export function harmonize(data: Uint8ClampedArray, tier: Tier, enabled = MAGIC_STYLE_ENABLED) {
  if (!enabled) return data;
  const lut = lutFor(tier);
  const tierAlpha = TIERS[tier].alpha;
  for (let p = 0; p < data.length; p += 4) {
    const a = data[p + 3];
    if (a === 0) continue;
    const alpha = quantAlpha((a / 255) * tierAlpha);
    if (alpha === 0) {
      data[p + 3] = 0;
      continue;
    }
    const i = ((data[p] >> 3) << 10) | ((data[p + 1] >> 3) << 5) | (data[p + 2] >> 3);
    data[p] = lut[i * 3];
    data[p + 1] = lut[i * 3 + 1];
    data[p + 2] = lut[i * 3 + 2];
    data[p + 3] = Math.round(alpha * 255);
  }
  return data;
}

/* ---------------------------------------------------------------- motion */

export const STEP_FPS = 12;

/** Time stepped to the shared 12fps beat: particle looks change on the beat, positions glide. */
export function beat(time: number, fps = STEP_FPS) {
  return Math.floor(time * fps) / fps;
}

export function smoothstep(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function easeOutCubic(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
}

export function easeInCubic(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x;
}

/** Rise, hold and fall over a life: 0 at both ends, 1 in the middle. */
export function envelope(age: number, life: number, rise = 0.15, fall = 0.3) {
  if (age <= 0 || age >= life) return 0;
  const up = rise > 0 ? easeOutCubic(age / rise) : 1;
  const down = fall > 0 ? smoothstep((life - age) / fall) : 1;
  return Math.min(up, down);
}

/* ---------------------------------------------------------------- zoom tiers */

export type ZoomTier = "map" | "near" | "close";

export function zoomTier(zoom: number): ZoomTier {
  const z = Math.round(zoom) || 1;
  return z <= 1 ? "map" : z === 2 ? "near" : "close";
}

/** Standing loops on screen at once, per zoom tier. A full map stays quiet. */
export function loopCap(tier: ZoomTier, narrow: boolean) {
  if (tier === "map") return narrow ? 4 : 5;
  if (tier === "near") return narrow ? 8 : 12;
  return narrow ? 10 : 14;
}

/** Person auras on screen at once. */
export function auraCap(tier: ZoomTier, narrow: boolean) {
  if (tier === "map") return 3;
  return narrow ? 5 : 8;
}

/** World size scale for particles: a full map shows fewer, never bigger, specks. */
export function particleCount(base: number, tier: ZoomTier) {
  if (tier === "map") return Math.max(1, Math.round(base * 0.4));
  if (tier === "near") return base;
  return Math.max(1, Math.round(base * 0.8));
}
