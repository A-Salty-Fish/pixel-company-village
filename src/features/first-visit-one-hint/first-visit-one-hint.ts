/**
 * PV-PM-094 — the first visit shows one 「知道了」 tip at a time.
 * Dismissing it reveals the next. The chip does not cover the map.
 * Set FIRST_VISIT_ONE_HINT_ENABLED to false to show the whole guide at once.
 */

export const FIRST_VISIT_ONE_HINT_ENABLED = true;
export const FIRST_VISIT_KEY = "village:first-visit-step-v1";

export const FIRST_VISIT_TIPS = [
  "先选定「我是谁」。",
  "做一件院里的事，或点一项本周小事。",
  "对一个人挥一次手，或送一次关照。",
  "减动开关在「村里新事」的「开关」里，点开就能看见。",
  "村里小玩和屋边角落各有十处，合上时也能看见进度。",
] as const;

const listeners = new Set<() => void>();

export function firstVisitOn(enabled = FIRST_VISIT_ONE_HINT_ENABLED) {
  return enabled;
}

export function subscribeFirstVisit(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitFirstVisit() {
  listeners.forEach((listener) => listener());
}

export function firstVisitTip(step: number, enabled = FIRST_VISIT_ONE_HINT_ENABLED) {
  if (!enabled) return null;
  if (!Number.isInteger(step) || step < 0 || step >= FIRST_VISIT_TIPS.length) return null;
  return FIRST_VISIT_TIPS[step] ?? null;
}

export function firstVisitAdvance(step: number) {
  return step + 1;
}

export function firstVisitDone(step: number) {
  return step >= FIRST_VISIT_TIPS.length;
}

/** The chip sits in the page flow. It does not cover the map. */
export function firstVisitBlocksMap() {
  return false;
}

export function readFirstVisitStep(raw: string | null) {
  const step = Number(raw ?? "0");
  if (!Number.isInteger(step) || step < 0) return 0;
  return step;
}

/**
 * Guide-seen hides the chip. A finished step key without that latch is leftover
 * from 「知道了」 after visit/guide keys were cleared — show the first tip again.
 */
export function firstVisitShownStep(seen: boolean, stepRaw: string | null) {
  if (seen) return FIRST_VISIT_TIPS.length;
  const step = readFirstVisitStep(stepRaw);
  if (firstVisitDone(step)) return 0;
  return step;
}

/** Stored visit still says a name was chosen, but identity is gone. */
export function firstVisitIdentityDropped(storedSelf: boolean, hasSelf: boolean) {
  return storedSelf && !hasSelf;
}

/** While a first-visit tip is up, other 「知道了」 tips wait. */
export function firstVisitHoldsSlot(input: { guideSeen: boolean; step: number; enabled?: boolean }) {
  const enabled = input.enabled ?? FIRST_VISIT_ONE_HINT_ENABLED;
  if (!enabled || input.guideSeen) return false;
  const shown = firstVisitDone(input.step) ? 0 : input.step;
  return !firstVisitDone(shown);
}

export function firstVisitCopy() {
  return [...FIRST_VISIT_TIPS];
}
