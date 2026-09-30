/**
 * PV-PM-020 — a gentle autumn sky band and ground band.
 * Seasonal tint, not a theme swap: grass stays greener than the ink.
 * Paint this before the night wash so night can sit on top.
 * Quiet villages keep the bands; fallen leaves stay on their own flag.
 * Set AUTUMN_PALETTE_ENABLED to false to restore the untinted edges.
 */

export const AUTUMN_PALETTE_ENABLED = true;

export const AUTUMN_SKY = { r: 214, g: 142, b: 86, a: 0.18 };
export const AUTUMN_GROUND = { r: 168, g: 78, b: 36, a: 0.16 };
export const SKY_BAND = 0.2;
export const GROUND_BAND = 0.24;

export type Rgb = { r: number; g: number; b: number };

export function autumnPaletteMark(seasonId: string, enabled = AUTUMN_PALETTE_ENABLED): "warm" | "off" {
  if (!enabled || seasonId !== "autumn") return "off";
  return "warm";
}

export function mixTint(base: Rgb, ink: { r: number; g: number; b: number; a: number }): Rgb {
  const keep = 1 - ink.a;
  return {
    r: base.r * keep + ink.r * ink.a,
    g: base.g * keep + ink.g * ink.a,
    b: base.b * keep + ink.b * ink.a,
  };
}

/** Edge of the sky or ground band. The middle of the map is left alone. */
export function autumnEdge(base: Rgb, edge: "sky" | "ground", enabled = AUTUMN_PALETTE_ENABLED): Rgb {
  if (!enabled) return base;
  return mixTint(base, edge === "sky" ? AUTUMN_SKY : AUTUMN_GROUND);
}

export function paintAutumnPalette(ctx: CanvasRenderingContext2D, viewW: number, viewH: number) {
  if (!AUTUMN_PALETTE_ENABLED) return "off" as const;
  const skyH = Math.max(8, Math.round(viewH * SKY_BAND));
  const groundH = Math.max(8, Math.round(viewH * GROUND_BAND));
  ctx.save();
  ctx.globalAlpha = 1;
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, `rgba(${AUTUMN_SKY.r}, ${AUTUMN_SKY.g}, ${AUTUMN_SKY.b}, ${AUTUMN_SKY.a})`);
  sky.addColorStop(1, `rgba(${AUTUMN_SKY.r}, ${AUTUMN_SKY.g}, ${AUTUMN_SKY.b}, 0)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, skyH);
  const ground = ctx.createLinearGradient(0, viewH - groundH, 0, viewH);
  ground.addColorStop(0, `rgba(${AUTUMN_GROUND.r}, ${AUTUMN_GROUND.g}, ${AUTUMN_GROUND.b}, 0)`);
  ground.addColorStop(1, `rgba(${AUTUMN_GROUND.r}, ${AUTUMN_GROUND.g}, ${AUTUMN_GROUND.b}, ${AUTUMN_GROUND.a})`);
  ctx.fillStyle = ground;
  ctx.fillRect(0, viewH - groundH, viewW, groundH);
  ctx.restore();
  return "warm" as const;
}
