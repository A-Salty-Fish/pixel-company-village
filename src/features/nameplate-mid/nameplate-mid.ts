/**
 * PV-PM-018 — mid zoom shows a short glyph for people outside the full-plate cap.
 * Panorama and the closest step stay as they are. 全显名牌 still prints full names.
 * Set NAMEPLATE_MID_ENABLED to false to drop the short glyphs.
 */

export const NAMEPLATE_MID_ENABLED = true;
export const MID_ZOOM = 2;
export const SHORT_CAP = 10;
export const QUIET_SHORT_CAP = 4;

export function plateGlyph(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return [...trimmed][0] ?? "";
}

/** One character, nearest first, never the people who already have a full plate. */
export function shortPlateNames(input: {
  zoom: number;
  showAll: boolean;
  quiet: boolean;
  full: string[];
  people: { name: string; x: number; y: number }[];
  self: { x: number; y: number } | null;
  enabled?: boolean;
}) {
  const enabled = input.enabled ?? NAMEPLATE_MID_ENABLED;
  if (!enabled || input.showAll || Math.round(input.zoom) !== MID_ZOOM) return [];
  const cap = input.quiet ? QUIET_SHORT_CAP : SHORT_CAP;
  const skip = new Set(input.full);
  const origin = input.self;
  const ranked: { name: string; d: number }[] = [];
  for (const person of input.people) {
    if (skip.has(person.name) || !plateGlyph(person.name)) continue;
    const dx = origin ? person.x - origin.x : 0;
    const dy = origin ? person.y - origin.y : 0;
    ranked.push({ name: person.name, d: dx * dx + dy * dy });
  }
  ranked.sort((a, b) => a.d - b.d || a.name.localeCompare(b.name, "zh"));
  const chosen: string[] = [];
  for (const person of ranked) {
    if (chosen.length >= cap) break;
    chosen.push(person.name);
  }
  return chosen;
}
