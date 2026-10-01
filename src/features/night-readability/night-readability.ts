/**
 * PV-PM-023 — night stays dark, but paths, water, roofs, and people stay readable.
 * Does not retune the PV-PM-016 wash. Path, pond, and roof shapes are drawn after that wash.
 * Set NIGHT_READABILITY_ENABLED to false to leave only the deep wash.
 */

import { contrastRatio, type Rgb } from "@/features/night-wash/night-wash";
import { LAMP_CORE, nightField } from "@/features/night-wash-v2/night-wash-v2";

export const NIGHT_READABILITY_ENABLED = true;

/**
 * PV-D-015 — a solid pond rectangle sat on the top-left of a narrow map
 * and read as an orphan blue block. Water tiles carry the pond.
 * Set true only to restore that slab.
 */
export const POND_SLAB_ENABLED = false;

export function pondSlabOn(enabled = POND_SLAB_ENABLED) {
  return enabled;
}

/** Local structure ink. The field under them is still the v2 night wash. */
export const PATH_INK: Rgb = { r: 168, g: 148, b: 96 };
/** Moonlit water. Brighter than the old slab so it separates from a readable night field. */
export const WATER_INK: Rgb = { r: 110, g: 176, b: 224 };
export const HOUSE_INK: Rgb = { r: 176, g: 132, b: 96 };
export const WALKER_INK: Rgb = { r: 214, g: 176, b: 132 };
export const AUTUMN_DOT: Rgb = { r: 212, g: 96, b: 42 };

export const STROKE = 4;

/** Same tiles as the ground paths and pond in the pixel map (16px tiles). */
const NORTH_PATH = { x: 0, y: 208, w: 1216, h: 32 };
const VERT_PATH = { x: 592, y: 208, w: 32, h: 896 };
const SOUTH_PATH = { x: 32, y: 640, w: 1152, h: 32 };
const POND = { x: 32, y: 32, w: 192, h: 96 };

export type NightReadMark = "lift" | "off";

export function nightReadMark(night: boolean, enabled = NIGHT_READABILITY_ENABLED): NightReadMark {
  return enabled && night ? "lift" : "off";
}

export function autumnDotsOn(seasonId: string, night: boolean, enabled = NIGHT_READABILITY_ENABLED) {
  return enabled && night && seasonId === "autumn";
}

/** Structure must separate from the dark field. Lamps stay the brightest accent. */
export function readabilityOk(field = nightField()) {
  const lamp = contrastRatio(LAMP_CORE, field);
  return (
    field.b > field.g &&
    contrastRatio(PATH_INK, field) >= 2 &&
    contrastRatio(WATER_INK, field) >= 2 &&
    contrastRatio(HOUSE_INK, field) >= 2 &&
    contrastRatio(WALKER_INK, field) >= 2.4 &&
    contrastRatio(AUTUMN_DOT, field) >= 2 &&
    contrastRatio(PATH_INK, WATER_INK) >= 1.15 &&
    PATH_INK.r > PATH_INK.b &&
    WATER_INK.b > WATER_INK.r &&
    HOUSE_INK.r > HOUSE_INK.b &&
    AUTUMN_DOT.r > AUTUMN_DOT.g &&
    AUTUMN_DOT.r > AUTUMN_DOT.b &&
    lamp >= 4.5 &&
    lamp > contrastRatio(WALKER_INK, field)
  );
}

type Cam = {
  viewW: number;
  viewH: number;
  camX: number;
  camY: number;
  worldW: number;
  worldH: number;
};

type House = { x: number; y: number };
type Walker = { x: number; y: number };

function rgb(color: Rgb) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function project(
  cam: Cam,
  x: number,
  y: number,
  w: number,
  h: number,
  minW = 0,
  minH = 0,
) {
  let sx = ((x - cam.camX) / cam.worldW) * cam.viewW;
  let sy = ((y - cam.camY) / cam.worldH) * cam.viewH;
  let sw = (w / cam.worldW) * cam.viewW;
  let sh = (h / cam.worldH) * cam.viewH;
  if (minW > 0 && sw < minW) {
    sx -= (minW - sw) / 2;
    sw = minW;
  }
  if (minH > 0 && sh < minH) {
    sy -= (minH - sh) / 2;
    sh = minH;
  }
  return { sx, sy, sw, sh };
}

function fillWorld(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgb,
  minW = 0,
  minH = 0,
) {
  const box = project(cam, x, y, w, h, minW, minH);
  if (box.sx + box.sw < 0 || box.sy + box.sh < 0 || box.sx > cam.viewW || box.sy > cam.viewH) return;
  ctx.fillStyle = rgb(color);
  ctx.fillRect(box.sx, box.sy, box.sw, box.sh);
}

function frameWorld(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgb,
) {
  const box = project(cam, x, y, w, h, 22, 18);
  if (box.sx + box.sw < 0 || box.sy + box.sh < 0 || box.sx > cam.viewW || box.sy > cam.viewH) return;
  const t = Math.max(3, Math.round(Math.min(box.sw, box.sh) * 0.18));
  ctx.fillStyle = rgb(color);
  ctx.fillRect(box.sx, box.sy, box.sw, t);
  ctx.fillRect(box.sx, box.sy + box.sh - t, box.sw, t);
  ctx.fillRect(box.sx, box.sy, t, box.sh);
  ctx.fillRect(box.sx + box.sw - t, box.sy, t, box.sh);
  ctx.fillRect(box.sx + t, box.sy - Math.max(3, t - 1), box.sw - t * 2, Math.max(3, t - 1));
}

/** Still strokes. Reduced motion uses the same pixels. */
export function paintNightReadability(
  ctx: CanvasRenderingContext2D,
  input: Cam & {
    night: boolean;
    seasonId: string;
    houses: House[];
    walkers: Walker[];
    reduced: boolean;
  },
) {
  void input.reduced;
  if (nightReadMark(input.night) !== "lift") return { mode: "off" as const, autumn: 0 };
  ctx.save();
  ctx.globalAlpha = 0.22;
  fillWorld(ctx, input, NORTH_PATH.x, NORTH_PATH.y, NORTH_PATH.w, NORTH_PATH.h, PATH_INK);
  fillWorld(ctx, input, VERT_PATH.x, VERT_PATH.y, VERT_PATH.w, VERT_PATH.h, PATH_INK);
  fillWorld(ctx, input, SOUTH_PATH.x, SOUTH_PATH.y, SOUTH_PATH.w, SOUTH_PATH.h, PATH_INK);
  if (pondSlabOn()) {
    ctx.globalAlpha = 0.82;
    fillWorld(ctx, input, POND.x, POND.y, POND.w, POND.h, WATER_INK);
    ctx.globalAlpha = 1;
    fillWorld(ctx, input, POND.x + 18, POND.y + 22, POND.w - 48, 4, WATER_INK);
    fillWorld(ctx, input, POND.x + 36, POND.y + 48, POND.w - 80, 4, WATER_INK);
  }
  ctx.globalAlpha = 0.35;
  for (const house of input.houses) {
    frameWorld(ctx, input, house.x - 8, house.y - 10, 32, 28, HOUSE_INK);
  }
  void input.walkers;
  let autumn = 0;
  if (autumnDotsOn(input.seasonId, input.night)) {
    for (let i = 0; i < 8; i += 1) {
      fillWorld(ctx, input, 96 + i * 140, 196, 8, 8, AUTUMN_DOT, 7, 7);
      autumn += 1;
    }
  }
  ctx.restore();
  return { mode: "lift" as const, autumn };
}
