/**
 * PV-PM-012 — signal card leads with relation and local status.
 * Set RELATION_FIRST_ENABLED to false to restore the ring-first card.
 */

export const RELATION_FIRST_ENABLED = true;

export const RELATION_LEAD = "先看这位同事和这台电脑上的往来。";
export const SCORE_LABEL = "分数";

/** Rings stay behind the score disclosure. Status stays in front. */
export function signalCardOrder(enabled = RELATION_FIRST_ENABLED) {
  return enabled ? (["status", "score"] as const) : (["score", "status"] as const);
}
