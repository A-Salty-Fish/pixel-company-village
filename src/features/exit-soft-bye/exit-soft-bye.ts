/**
 * PV-PM-060 — one canned line beside 出村.
 * It never asks again, and it never waits on the player. The leave still happens.
 * Set EXIT_SOFT_BYE_ENABLED to false to leave at once with no line.
 */

export const EXIT_SOFT_BYE_ENABLED = true;
export const EXIT_SOFT_BYE_MS = 1_200;
export const EXIT_SOFT_BYE_LINE = "慢慢走。村口还在。";

export function exitByePlan(enabled = EXIT_SOFT_BYE_ENABLED) {
  if (!enabled) return { line: null as string | null, waitMs: 0 };
  return { line: EXIT_SOFT_BYE_LINE, waitMs: EXIT_SOFT_BYE_MS };
}

export function exitByeCopy() {
  return [EXIT_SOFT_BYE_LINE];
}
