/**
 * PV-PM-075 — a thin sky band for dawn, day, dusk, and night.
 * The farm and the path stay under the existing night wash. This band
 * never covers the lower map, so night paths stay readable.
 * Set SKY_WASH_ENABLED to false to leave the sky untinted.
 */

export const SKY_WASH_ENABLED = true;
export const SKY_WASH_BAND = 0.18;

export type SkyBand = "dawn" | "day" | "dusk" | "night";

export type SkyInk = { r: number; g: number; b: number; a: number };

const INK: Record<SkyBand, SkyInk> = {
  dawn: { r: 242, g: 168, b: 96, a: 0.22 },
  day: { r: 255, g: 236, b: 196, a: 0.12 },
  dusk: { r: 196, g: 92, b: 72, a: 0.2 },
  night: { r: 186, g: 206, b: 232, a: 0.16 },
};

export function skyWashOn(enabled = SKY_WASH_ENABLED) {
  return enabled;
}

/** Same clock words as the glance line, with a dawn slice before midday. */
export function skyWashBand(hour: number): SkyBand {
  const h = Math.floor(hour);
  if (h >= 5 && h < 10) return "dawn";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

export function skyWashMark(hour: number, enabled = SKY_WASH_ENABLED): SkyBand | "off" {
  if (!enabled) return "off";
  return skyWashBand(hour);
}

export function skyWashInk(band: SkyBand): SkyInk {
  return INK[band];
}

export function skyBandHeight(viewH: number) {
  return Math.max(8, Math.round(Math.max(0, viewH) * SKY_WASH_BAND));
}

/** True only inside the top band. A path in the middle of the map is false. */
export function skyWashCovers(y: number, viewH: number) {
  return y >= 0 && y < skyBandHeight(viewH);
}

export function paintSkyWash(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  hour: number,
  enabled = SKY_WASH_ENABLED,
) {
  const mark = skyWashMark(hour, enabled);
  if (mark === "off") return "off" as const;
  const ink = skyWashInk(mark);
  const band = skyBandHeight(viewH);
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, band);
  grad.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${ink.a})`);
  grad.addColorStop(1, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, band);
  ctx.restore();
  return mark;
}
