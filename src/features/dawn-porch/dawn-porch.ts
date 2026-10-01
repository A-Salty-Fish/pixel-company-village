/**
 * PV-PM-056 — one canned morning line that pans the map.
 * Midday, dusk, and night do not grow this cue. A session shows it at most once.
 * Independent of the evening lantern.
 * Set DAWN_PORCH_ENABLED to false to leave the morning map unmarked.
 */

export const DAWN_PORCH_ENABLED = true;

export const DAWN_SPOTS = [
  { id: "lamp", label: "门灯还亮着", x: 852, y: 336 },
  { id: "dew", label: "露水还在田边", x: 300, y: 560 },
] as const;

export type DawnSpot = { id: (typeof DAWN_SPOTS)[number]["id"]; label: string; x: number; y: number };

export function isMorning(hour: number) {
  const h = Math.floor(hour);
  return h >= 5 && h <= 10;
}

export function dawnPorchOffer(input: { hour: number; alreadyShown: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? DAWN_PORCH_ENABLED;
  if (!enabled || input.alreadyShown) return false;
  return isMorning(input.hour);
}

function salt(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export function pickDawnSpot(ymd: string): DawnSpot {
  const spot = DAWN_SPOTS[salt(ymd) % DAWN_SPOTS.length] ?? DAWN_SPOTS[0];
  return { id: spot.id, label: spot.label, x: spot.x, y: spot.y };
}

/** Door lamp prefers the caller's porch. Dew stays on the field. */
export function dawnPanTarget(spot: DawnSpot, roof: { homeX: number; homeY: number } | null) {
  if (spot.id === "lamp" && roof) return { x: roof.homeX + 48, y: roof.homeY + 24 };
  return { x: spot.x, y: spot.y };
}

export function dawnPorchCopy() {
  return DAWN_SPOTS.map((spot) => spot.label);
}
