/**
 * PV-PM-019 — a short afterglow once this session finishes the daily ritual.
 * Reload does not replay it: callers pass a timestamp only from the click.
 * 减少动作 holds one still tint, then clears. No fade frames.
 * Set RITUAL_AFTERGLOW_ENABLED to false to skip the wash and the line.
 */

export const RITUAL_AFTERGLOW_ENABLED = true;

export const AFTERGLOW_FADE_MS = 2800;
export const AFTERGLOW_STILL_MS = 1600;
export const AFTERGLOW_PEAK = 0.22;

export const AFTERGLOW_LINE = "余晖还留了一会儿。";

export const AFTERGLOW_INK = {
  dawn: { r: 242, g: 209, b: 92 },
  noon: { r: 126, g: 196, b: 214 },
  dusk: { r: 196, g: 92, b: 58 },
} as const;

export type AfterglowBeat = keyof typeof AFTERGLOW_INK;
export type AfterglowPhase = "fade" | "still" | "off";

export function afterglowPhase(
  elapsedMs: number,
  reduced: boolean,
  enabled = RITUAL_AFTERGLOW_ENABLED,
): AfterglowPhase {
  if (!enabled || !Number.isFinite(elapsedMs) || elapsedMs < 0) return "off";
  if (reduced) return elapsedMs < AFTERGLOW_STILL_MS ? "still" : "off";
  return elapsedMs < AFTERGLOW_FADE_MS ? "fade" : "off";
}

/** 0 when the glow is over. Reduced motion stays at the peak, then drops to 0. */
export function afterglowAlpha(elapsedMs: number, reduced: boolean, enabled = RITUAL_AFTERGLOW_ENABLED) {
  const phase = afterglowPhase(elapsedMs, reduced, enabled);
  if (phase === "off") return 0;
  if (phase === "still") return AFTERGLOW_PEAK;
  const t = elapsedMs / AFTERGLOW_FADE_MS;
  return Math.round(AFTERGLOW_PEAK * (1 - t) * 1000) / 1000;
}

export function afterglowDuration(reduced: boolean) {
  return reduced ? AFTERGLOW_STILL_MS : AFTERGLOW_FADE_MS;
}

export function paintRitualAfterglow(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  beat: AfterglowBeat,
  alpha: number,
) {
  if (!RITUAL_AFTERGLOW_ENABLED || alpha <= 0) return;
  const ink = AFTERGLOW_INK[beat];
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${alpha})`;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}
