/**
 * PV-PM-023 — night stays dark, but paths, water, roofs, and people stay readable.
 * Does not retune the PV-PM-016 wash. Thin structure is drawn after that wash.
 * Set NIGHT_READABILITY_ENABLED to false to leave only the deep wash.
 */

import { contrastRatio, type Rgb } from "@/features/night-wash/night-wash";
import { LAMP_CORE, nightField } from "@/features/night-wash-v2/night-wash-v2";

export const NIGHT_READABILITY_ENABLED = true;

/** Local structure ink. The field under them is still the v2 night wash. */
export const PATH_INK: Rgb = { r: 168, g: 148, b: 96 };
export const WATER_INK: Rgb = { r: 36, g: 92, b: 168 };
export const HOUSE_INK: Rgb = { r: 176, g: 132, b: 96 };
export const WALKER_INK: Rgb = { r: 214, g: 176, b: 132 };
export const AUTUMN_DOT: Rgb = { r: 212, g: 96, b: 42 };

export const STROKE = 4;

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

function fillWorld(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgb,
) {
  const sx = ((x - cam.camX) / cam.worldW) * cam.viewW;
  const sy = ((y - cam.camY) / cam.worldH) * cam.viewH;
  const sw = (w / cam.worldW) * cam.viewW;
  const sh = (h / cam.worldH) * cam.viewH;
  if (sx + sw < 0 || sy + sh < 0 || sx > cam.viewW || sy > cam.viewH) return;
  ctx.fillStyle = rgb(color);
  ctx.fillRect(sx, sy, Math.max(STROKE, sw), Math.max(2, sh));
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
  ctx.globalAlpha = 0.92;
  fillWorld(ctx, input, 0, 220, 1216, STROKE, PATH_INK);
  fillWorld(ctx, input, 604, 208, STROKE, 860, PATH_INK);
  fillWorld(ctx, input, 32, 652, 1100, STROKE, PATH_INK);
  fillWorld(ctx, input, 48, 48, 150, 3, WATER_INK);
  fillWorld(ctx, input, 64, 72, 120, 3, WATER_INK);
  fillWorld(ctx, input, 56, 96, 90, 3, WATER_INK);
  for (const house of input.houses) {
    fillWorld(ctx, input, house.x - 2, house.y - 4, 18, 2, HOUSE_INK);
    fillWorld(ctx, input, house.x - 2, house.y + 12, 18, 2, HOUSE_INK);
    fillWorld(ctx, input, house.x - 2, house.y - 2, 2, 16, HOUSE_INK);
    fillWorld(ctx, input, house.x + 14, house.y - 2, 2, 16, HOUSE_INK);
  }
  for (const walker of input.walkers) {
    fillWorld(ctx, input, walker.x - 4, walker.y - 18, 8, 12, WALKER_INK);
  }
  let autumn = 0;
  if (autumnDotsOn(input.seasonId, input.night)) {
    for (let i = 0; i < 6; i += 1) {
      fillWorld(ctx, input, 180 + i * 160, 206, 5, 5, AUTUMN_DOT);
      autumn += 1;
    }
  }
  ctx.restore();
  return { mode: "lift" as const, autumn };
}
