/**
 * PV-PM-113 — the header menu keeps refresh and leaving.
 * 「分数从哪来」 stays on the page once. Visitor copy is a short legend line.
 * Set the flag false to put the essay and the extra button back.
 */

export const HEADER_LEAN_ENABLED = true;
export const VISITOR_LEGEND = "还没选自己";
export const SCORE_SOURCE = "分数从哪来";

export function headerLeanOn(enabled = HEADER_LEAN_ENABLED) {
  return enabled;
}

export function headerLeanMark(enabled = HEADER_LEAN_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function showScoreSourceButton(enabled = HEADER_LEAN_ENABLED) {
  return !enabled;
}

export function visitorLegend(hasSelf: boolean, enabled = HEADER_LEAN_ENABLED) {
  if (!enabled || hasSelf) return "";
  return VISITOR_LEGEND;
}

export function scoreSourceCount(copies: string[]) {
  return copies.filter((line) => line.includes(SCORE_SOURCE)).length;
}
