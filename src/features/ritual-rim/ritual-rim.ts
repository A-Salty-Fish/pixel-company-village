/**
 * PV-PM-040 — when today's ritual beat is stored, one short toast and a warm rim.
 * The day keeps one of the three named beats. Reload does not play it again.
 * Set RITUAL_RIM_ENABLED to false to skip the toast and the rim.
 */

export const RITUAL_RIM_ENABLED = true;
export const RITUAL_RIM_MS = 2600;
export const RITUAL_BEAT_TOTAL = 3;
export const RITUAL_RIM_TOAST = "今日仪式做完了。";

export function ritualRimOffer(input: { justCompleted: boolean; alreadyShown: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? RITUAL_RIM_ENABLED;
  return enabled && input.justCompleted && !input.alreadyShown;
}

export function ritualRimCopy() {
  return [RITUAL_RIM_TOAST];
}
