/**
 * PV-PM-028 — the map-bar wave leaves a receipt, including in a quiet village.
 * A nearby person is highlighted. The line is canned. No chat text is stored.
 * Set HEADER_WAVE_RECEIPT_ENABLED to false to keep the self-only emote.
 */

export const HEADER_WAVE_RECEIPT_ENABLED = true;

export const HEADER_WAVE_LINE = "邻里应了一下。";
export const HEADER_WAVE_SELF = "朝田边挥了一下。";
export const HEADER_WAVE_MS = 3000;

export type WaveSpot = { name: string; x: number; y: number };

export function headerWaveTarget(self: WaveSpot | null, others: WaveSpot[], enabled = HEADER_WAVE_RECEIPT_ENABLED) {
  if (!enabled || !self) return null;
  let best: WaveSpot | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const other of others) {
    if (other.name === self.name) continue;
    const dx = other.x - self.x;
    const dy = other.y - self.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

export function headerWaveLine(hasTarget: boolean, enabled = HEADER_WAVE_RECEIPT_ENABLED) {
  if (!enabled) return "";
  return hasTarget ? HEADER_WAVE_LINE : HEADER_WAVE_SELF;
}

export function headerWaveCopy() {
  return [HEADER_WAVE_LINE, HEADER_WAVE_SELF];
}
