/**
 * PV-WIZARD-001 painter. The robe and hat for one (style, facing, head height) are drawn once into a
 * tiny offscreen canvas and then blitted, so a hundred wizards cost a hundred drawImage calls.
 * The staff is a handful of live rects so it can sway and swing.
 */
import {
  GEMS,
  TRIM,
  hatColors,
  hatLean,
  robeColors,
  staffSide,
  type Facing,
  type WizardPose,
  type WizardProp,
  type WizardStyle,
} from "./wizard-look";

const W = 44;
const H = 70;
const OX = 22;
const OY = 62;
const CACHE_CAP = 360;
const cache = new Map<string, HTMLCanvasElement | null>();

/** Opaque top of the cat sheet frame, measured from the atlas. */
export function catHeadTop(anim: string, dir: Facing, frame: number) {
  if (anim === "walk") return frame % 4 === 1 || frame % 4 === 2 ? -36 : -37;
  if (anim === "sit") return (dir === "left" || dir === "right") && frame <= 5 ? -34 : -35;
  return -37;
}

function paintCostume(g: CanvasRenderingContext2D, style: WizardStyle, dir: Facing, headTop: number, seated: boolean) {
  const [robe, shade, light] = robeColors(style);
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(OX + x, OY + y, w, h);
  };
  /* robe */
  const top = headTop + 17;
  const bottom = seated ? 0 : -1;
  const rows = bottom - top + 1;
  const side = dir === "left" || dir === "right";
  for (let r = 0; r < rows; r += 1) {
    const y = top + r;
    const half = Math.min(11, (side ? 7 : 6) + Math.round((r / Math.max(1, rows - 1)) * (side ? 4 : 5)));
    px(-half, y, half * 2, 1, robe);
    px(-half, y, 1, 1, shade);
    px(half - 1, y, 1, 1, shade);
    if (r >= 2 && r < rows - 3) px(-half + 1, y, 1, 1, light);
    if (!side && dir === "down" && r >= 5 && r < rows - 1) px(0, y, 1, 1, shade);
    if (side && r >= 6 && r < rows - 1) px(dir === "right" ? -2 : 1, y, 1, 1, shade);
  }
  px(-11, bottom, 22, 1, shade);
  if (style.trim >= 1) px(-10, bottom - 1, 20, 1, TRIM);
  if (style.trim >= 2) for (let x = -8; x <= 7; x += 3) px(x, bottom - 4, 1, 1, TRIM);
  if (dir === "down") {
    // collar and a clasp
    px(-3, top, 6, 1, light);
    px(-2, top + 1, 4, 1, light);
    px(-1, top + 2, 2, 2, style.plain ? "#5e5242" : GEMS[style.gem]);
    // sleeves over the paws, cuffs open
    px(-10, top + 3, 3, 6, shade);
    px(7, top + 3, 3, 6, shade);
    px(-10, top + 8, 3, 1, light);
    px(7, top + 8, 3, 1, light);
  } else if (dir === "up") {
    // hood down the back
    px(-5, top, 10, 3, shade);
    px(-4, top + 3, 8, 1, shade);
    px(-3, top + 4, 6, 1, shade);
  } else {
    const f = dir === "right" ? 1 : -1;
    // both sleeves cover the paws; the near one is in front with a cuff
    px(-11, top + 2, 3, 7, shade);
    px(8, top + 2, 3, 7, shade);
    px(f > 0 ? 1 : -6, top + 4, 5, 6, shade);
    px(f > 0 ? 1 : -6, top + 9, 5, 1, light);
  }

  /* hat */
  const [hat, hatShade, hatLight] = hatColors(style);
  const brim = headTop + 6;
  // a wide two-row brim that hides the ears
  px(-10, brim - 1, 20, 1, hat);
  px(-11, brim, 22, 1, hat);
  px(-11, brim + 1, 22, 1, hatShade);
  px(-11, brim - 1, 1, 1, hatShade);
  px(10, brim - 1, 1, 1, hatShade);
  const tall = style.plain ? 10 : 13;
  const lean = hatLean(dir);
  const droop = style.droop || style.plain;
  let tipX = 0;
  let tipY = brim - tall;
  for (let i = 0; i < tall; i += 1) {
    const y = brim - 2 - i;
    const f = i / tall;
    const half = Math.max(1, Math.round(6.5 * (1 - f)));
    const bend = Math.round(lean * f * f * (droop ? 6 : 4));
    px(bend - half, y, half * 2, 1, hat);
    px(bend + half - 1, y, 1, 1, hatShade);
    if (half > 1 && i > 1) px(bend - half + 1, y, 1, 1, hatLight);
    tipX = bend;
    tipY = y;
  }
  if (droop) {
    // the tip flops over sideways
    px(tipX + lean * 1, tipY, 2, 1, hat);
    px(tipX + lean * 2, tipY + 1, 2, 1, hat);
    px(tipX + lean * 3, tipY + 2, 1, 1, hatShade);
    if (style.plain) px(-3, brim - 5, 2, 2, "#a89878");
  }
  // band
  const band = style.plain ? "#4a4034" : GEMS[style.gem];
  px(-6, brim - 3, 12, 1, band);
  if (!style.plain && dir !== "up") px(-1 + lean, brim - 4, 2, 1, TRIM);
  // stars by focus
  if (style.star >= 1) {
    const sx = Math.round(lean * 1.2);
    px(sx, brim - 7, 1, 1, TRIM);
    px(sx - 1, brim - 6, 1, 1, "#fff6c0");
  }
  if (style.star >= 2) {
    const sx = tipX + lean * (droop ? 3 : 0);
    const sy = tipY + (droop ? 2 : -1);
    px(sx, sy - 1, 1, 3, TRIM);
    px(sx - 1, sy, 3, 1, TRIM);
    px(sx, sy, 1, 1, "#fffbe0");
  }
}

function costume(style: WizardStyle, dir: Facing, headTop: number, seated: boolean) {
  const key = `${style.key}|${dir}|${headTop}|${seated ? 1 : 0}|${style.gem}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (typeof document === "undefined") return null;
  if (cache.size >= CACHE_CAP) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) {
    cache.set(key, null);
    return null;
  }
  g.imageSmoothingEnabled = false;
  paintCostume(g, style, dir, headTop, seated);
  cache.set(key, canvas);
  return canvas;
}

export function wizardCacheSize() {
  return cache.size;
}

export function drawWizard(
  ctx: CanvasRenderingContext2D,
  style: WizardStyle,
  dir: Facing,
  x: number,
  y: number,
  headTop: number,
  seated: boolean,
  pose: WizardPose,
  prop: WizardProp,
  t: number,
  reduced: boolean,
) {
  const ax = Math.round(x);
  const ay = Math.round(y);
  const art = costume(style, dir, headTop, seated);
  if (art) ctx.drawImage(art, ax - OX, ay - OY);
  drawStaff(ctx, style, dir, ax, ay, pose, prop, t, reduced);
  if (prop === "book" && dir !== "up") drawBook(ctx, style, dir, ax, ay, t, reduced);
}

function drawStaff(
  ctx: CanvasRenderingContext2D,
  style: WizardStyle,
  dir: Facing,
  ax: number,
  ay: number,
  pose: WizardPose,
  prop: WizardProp,
  t: number,
  reduced: boolean,
) {
  const side = staffSide(dir);
  const lift = prop === "raise" ? 6 : 0;
  const baseX = ax + side;
  const baseY = ay - 1 - lift;
  const length = style.plain ? 24 : 28;
  const wood = style.plain ? "#6e4e2e" : "#7a4a24";
  const grain = style.plain ? "#8e6a44" : "#a8703a";
  let tipX: number;
  let tipY: number;
  if (pose.swing === 0) {
    const lower = Math.round(length * 0.55);
    ctx.fillStyle = wood;
    ctx.fillRect(baseX, baseY - lower, 2, lower);
    ctx.fillRect(baseX + pose.sway, baseY - length, 2, length - lower);
    ctx.fillStyle = grain;
    ctx.fillRect(baseX, baseY - lower + 2, 1, lower - 4);
    tipX = baseX + pose.sway;
    tipY = baseY - length;
  } else {
    const toward = dir === "down" || dir === "left" ? -1 : 1;
    const angle = pose.swing * 0.95 * toward;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    ctx.fillStyle = wood;
    for (let i = 0; i < length; i += 1) ctx.fillRect(Math.round(baseX + sin * i), Math.round(baseY - cos * i), 2, 1);
    tipX = Math.round(baseX + sin * length);
    tipY = Math.round(baseY - cos * length);
  }
  if (style.plain) {
    ctx.fillStyle = "#5a3a1c";
    ctx.fillRect(tipX - 1, tipY - 2, 4, 3);
    return;
  }
  // crook and gem
  ctx.fillStyle = wood;
  ctx.fillRect(tipX - 1, tipY - 1, 4, 1);
  const gem = GEMS[style.gem];
  const glow = prop === "raise" && !reduced ? 0.5 + Math.sin(t * 6) * 0.5 : 0;
  const flash = Math.max(pose.flash, glow);
  if (flash > 0.05) {
    ctx.globalAlpha = 0.35 * flash;
    ctx.fillStyle = gem;
    ctx.fillRect(tipX - 3, tipY - 6, 8, 7);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = gem;
  ctx.fillRect(tipX - 1, tipY - 4, 4, 3);
  ctx.fillRect(tipX, tipY - 5, 2, 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(tipX, tipY - 4, 1, 1);
  if (flash > 0.5) {
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(tipX + 0, tipY - 8, 1, 2);
    ctx.fillRect(tipX + 4, tipY - 3, 2, 1);
    ctx.fillRect(tipX - 3, tipY - 3, 2, 1);
  }
}

function drawBook(ctx: CanvasRenderingContext2D, style: WizardStyle, dir: Facing, ax: number, ay: number, t: number, reduced: boolean) {
  const bob = reduced ? 0 : Math.round(Math.sin(t * 2.2 + style.phase));
  const bx = dir === "down" ? ax - 5 : dir === "right" ? ax + 2 : ax - 11;
  const by = ay - 15 + bob;
  const [, shade] = robeColors(style);
  ctx.fillStyle = shade;
  ctx.fillRect(bx - 1, by + 4, 11, 1);
  ctx.fillStyle = "#f4ecd8";
  ctx.fillRect(bx, by, 4, 4);
  ctx.fillRect(bx + 5, by, 4, 4);
  ctx.fillStyle = "#8a6a4a";
  ctx.fillRect(bx + 4, by, 1, 5);
  ctx.fillStyle = "#b8a888";
  ctx.fillRect(bx + 1, by + 1, 2, 1);
  ctx.fillRect(bx + 6, by + 2, 2, 1);
  if (!reduced && Math.floor(t * 3 + style.phase) % 3 === 0) {
    ctx.fillStyle = GEMS[style.gem];
    ctx.fillRect(bx + 4, by - 3, 1, 1);
    ctx.fillRect(bx + 2, by - 5, 1, 1);
  }
}
