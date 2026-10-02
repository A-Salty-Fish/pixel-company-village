/**
 * #52 非挡合改刀 / quiet dusk — a quiet village keeps the evening windows.
 * Quiet still cuts motion and noise. It does not clear dusk.
 * Reduced motion is a separate switch and does not enter here.
 * Set QUIET_KEEPS_DUSK_ENABLED to false to let quiet blank dusk again.
 */

export const QUIET_KEEPS_DUSK_ENABLED = true;

export function quietKeepsDuskOn(enabled = QUIET_KEEPS_DUSK_ENABLED) {
  return enabled;
}

/** The dusk system stays available while quiet is on. */
export function duskSystemOn(
  input: { system: boolean; quiet: boolean },
  enabled = QUIET_KEEPS_DUSK_ENABLED,
) {
  if (!input.system) return false;
  if (enabled) return true;
  return !input.quiet;
}

/** Evening windows. Night hours stay with the night lamps. */
export function duskWindowsLit(
  input: { hour: number; system: boolean; quiet: boolean },
  enabled = QUIET_KEEPS_DUSK_ENABLED,
) {
  const hour = Math.floor(input.hour);
  const dusk = hour >= 17 && hour < 20;
  return dusk && duskSystemOn(input, enabled);
}
