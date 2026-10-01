/**
 * PV-PM-057 — the bottom 「回家」 eases the camera onto the caller's roof pin.
 * Choosing a name still uses identity land. This path is only the later home button.
 * Reduced motion eases the camera and skips the warm wash.
 * Set HOME_SETTLE_ENABLED to false to snap home the old way.
 */

export const HOME_SETTLE_ENABLED = true;
export const HOME_SETTLE_MS = 800;
export const HOME_WARM_MS = 1_000;
export const HOME_SETTLE_TOAST = "回到屋檐下了。";

export function roofFocus(home: { homeX: number; homeY: number }) {
  return { x: home.homeX + 48, y: home.homeY + 24 };
}

export function homeSettleEase(t: number) {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 1));
  return 1 - (1 - x) ** 3;
}

export function homeSettleFrame(input: {
  elapsedMs: number;
  durationMs?: number;
  from: { x: number; y: number; zoom: number };
  to: { x: number; y: number; zoom: number };
}) {
  const duration = input.durationMs ?? HOME_SETTLE_MS;
  const t = homeSettleEase(duration <= 0 ? 1 : input.elapsedMs / duration);
  return {
    x: input.from.x + (input.to.x - input.from.x) * t,
    y: input.from.y + (input.to.y - input.from.y) * t,
    zoom: input.from.zoom + (input.to.zoom - input.from.zoom) * t,
    done: input.elapsedMs >= duration,
  };
}

export function homeWarmOn(input: { elapsedMs: number; reduceMotion: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? HOME_SETTLE_ENABLED;
  if (!enabled || input.reduceMotion) return false;
  return input.elapsedMs >= 0 && input.elapsedMs < HOME_WARM_MS;
}

export function homeSettleCopy() {
  return [HOME_SETTLE_TOAST];
}
