/**
 * PV-PM-021 — a light frame when the score day is today.
 * Stale score days stay unmarked: the village remains "now".
 * Quiet villages keep the same readable line and a thinner frame.
 * Not a dialog. Set SCORE_DAY_IMMERSION_ENABLED to false to remove it.
 */

export const SCORE_DAY_IMMERSION_ENABLED = true;

export const SCORE_DAY_LINE = "今日分数在田里。";
export const SCORE_DAY_TEXT = "#4a3a28";

export type ScoreDayMark = "soft" | "quiet" | "off";

export function scoreDayMark(fresh: boolean, quiet: boolean, enabled = SCORE_DAY_IMMERSION_ENABLED): ScoreDayMark {
  if (!enabled || !fresh) return "off";
  return quiet ? "quiet" : "soft";
}

export function scoreDayAlpha(mode: ScoreDayMark) {
  if (mode === "soft") return 0.42;
  if (mode === "quiet") return 0.22;
  return 0;
}

export function scoreDayTextColor(mode: ScoreDayMark) {
  if (mode === "off") return "";
  return SCORE_DAY_TEXT;
}

export function paintScoreDayFrame(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  mode: ScoreDayMark,
) {
  const alpha = scoreDayAlpha(mode);
  if (!SCORE_DAY_IMMERSION_ENABLED || alpha <= 0) return;
  const thickness = mode === "quiet" ? 2 : 3;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(196, 106, 48, ${alpha})`;
  ctx.fillRect(0, 0, viewW, thickness);
  ctx.fillRect(0, viewH - thickness, viewW, thickness);
  ctx.fillRect(0, 0, thickness, viewH);
  ctx.fillRect(viewW - thickness, 0, thickness, viewH);
  ctx.restore();
}
