/**
 * PV-D-016 — nameplates get one pixel between glyphs and a wider shove
 * when two plates touch. Quiet caps stay where they are.
 * Set NAMEPLATE_AIR_ENABLED to false to pack glyphs again.
 */

export const NAMEPLATE_AIR_ENABLED = true;
export const NAMEPLATE_TRACKING = 1;
/** Extra pixels when a plate has to step away from another. */
export const NAMEPLATE_GAP = 6;
export const NAMEPLATE_GAP_TIGHT = 3;

export function nameplateAirMark(enabled = NAMEPLATE_AIR_ENABLED): "air" | "tight" {
  return enabled ? "air" : "tight";
}

export function nameplateTracking(enabled = NAMEPLATE_AIR_ENABLED) {
  return enabled ? NAMEPLATE_TRACKING : 0;
}

export function nameplateGap(enabled = NAMEPLATE_AIR_ENABLED) {
  return enabled ? NAMEPLATE_GAP : NAMEPLATE_GAP_TIGHT;
}

/** Left edges for each glyph. Tracking is the gap after every glyph except the last. */
export function glyphOffsets(widths: readonly number[], tracking: number) {
  const offsets: number[] = [];
  let cursor = 0;
  for (let index = 0; index < widths.length; index += 1) {
    offsets.push(cursor);
    const gap = index < widths.length - 1 ? Math.max(0, tracking) : 0;
    cursor += widths[index] + gap;
  }
  return offsets;
}

export function trackedSpan(widths: readonly number[], tracking: number) {
  if (widths.length === 0) return 0;
  const offsets = glyphOffsets(widths, tracking);
  return offsets[offsets.length - 1] + widths[widths.length - 1];
}
