/**
 * PV-PM-087 — wave and 相伴 sit on the narrow first screen.
 * Opening 更多 is not required. The receipt still uses the companion cue.
 * Set FIRST_SCREEN_SOCIAL_ENABLED to false to fold them back under 更多.
 */

export const FIRST_SCREEN_SOCIAL_ENABLED = true;
export const FIRST_SCREEN_SOCIAL_PX = 480;
export const FIRST_WAVE_LABEL = "挥手";

export function firstScreenSocialOn(enabled = FIRST_SCREEN_SOCIAL_ENABLED) {
  return enabled;
}

export function firstScreenSocial(width: number, enabled = FIRST_SCREEN_SOCIAL_ENABLED) {
  return enabled && Number.isFinite(width) && width > 0 && width <= FIRST_SCREEN_SOCIAL_PX;
}

/** One tap on the map. A second tap into 更多 does not count as this entry. */
export function waveOnFirstScreen(enabled = FIRST_SCREEN_SOCIAL_ENABLED) {
  return enabled;
}

export function firstSocialCopy() {
  return [FIRST_WAVE_LABEL, "相伴 · 开着", "相伴"];
}
