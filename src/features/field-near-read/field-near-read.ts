/**
 * PV-PM-118 — the two nearest people in the frame keep a readable name.
 * Two characters are enough. Farther people may stay one glyph or unlabeled.
 * Zooming in, or stepping to the next sentence, does not blank the field.
 * 全显名牌 is left alone. Set FIELD_NEAR_READ_ENABLED to false to drop the pair.
 */

export const FIELD_NEAR_READ_ENABLED = true;
export const FIELD_NEAR_COUNT = 2;
export const FIELD_NEAR_CHARS = 2;

export type FieldSpot = { name: string; x: number; y: number };

export function fieldNearReadOn(enabled = FIELD_NEAR_READ_ENABLED) {
  return enabled;
}

export function fieldNearReadMark(enabled = FIELD_NEAR_READ_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Two characters are enough to recognize someone standing in the same field. */
export function nearFieldLabel(name: string, chars = FIELD_NEAR_CHARS) {
  const glyphs = [...name.trim()];
  if (glyphs.length <= chars) return glyphs.join("");
  return glyphs.slice(0, chars).join("");
}

export function plateTextReads(name: string, text: string, chars = FIELD_NEAR_CHARS) {
  const trimmed = name.trim();
  const need = Math.min(chars, [...trimmed].length);
  if (need <= 0 || !text) return false;
  return [...text].length >= need && trimmed.startsWith(text);
}

export function inCameraFrame(person: { x: number; y: number }, camX: number, camY: number, spanW: number, spanH: number) {
  return person.x >= camX && person.y >= camY && person.x <= camX + spanW && person.y <= camY + spanH;
}

/**
 * The two nearest neighbors whose feet are in this camera.
 * People outside the frame stay out, even if they stand closer in the world.
 * 全显名牌 does not use this list.
 */
export function nearestFieldMates(input: {
  people: FieldSpot[];
  self: FieldSpot | null;
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
  count?: number;
  enabled?: boolean;
  showAll?: boolean;
}) {
  const enabled = input.enabled ?? FIELD_NEAR_READ_ENABLED;
  if (!enabled || input.showAll || !input.self) return [];
  const self = input.self;
  const framed = input.people.filter(
    (person) => person.name !== self.name && inCameraFrame(person, input.camX, input.camY, input.spanW, input.spanH),
  );
  framed.sort((a, b) => {
    const da = (a.x - self.x) * (a.x - self.x) + (a.y - self.y) * (a.y - self.y);
    const db = (b.x - self.x) * (b.x - self.x) + (b.y - self.y) * (b.y - self.y);
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name, "zh");
  });
  return framed.slice(0, input.count ?? FIELD_NEAR_COUNT);
}

/**
 * The morning lamp arms once. After a name is chosen, that lamp follows the porch
 * so the landing frame still holds the caller. Dew stays on the field.
 */
export function lampPorchAfterSelf(input: { id: string; seen: boolean; hasRoof: boolean; enabled?: boolean }) {
  if (!input.seen) return "arm" as const;
  const enabled = input.enabled ?? FIELD_NEAR_READ_ENABLED;
  if (enabled && input.hasRoof && input.id === "lamp") return "follow" as const;
  return "keep" as const;
}
