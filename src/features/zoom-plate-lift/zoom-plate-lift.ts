/**
 * PV-PM-122 — one zoom from the field keeps the nearest readable plates
 * above the first-run strip. Invite-then-zoom is left to PV-PM-118.
 * Set ZOOM_PLATE_LIFT_ENABLED to false to leave plates where they land.
 */

export const ZOOM_PLATE_LIFT_ENABLED = true;

const CLEAR_GAP_CSS = 2;

export type PlateBox = { x: number; y: number; w: number; h: number };

export function zoomPlateLiftOn(enabled = ZOOM_PLATE_LIFT_ENABLED) {
  return enabled;
}

export function zoomPlateLiftMark(enabled = ZOOM_PLATE_LIFT_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Canvas bitmap Y a plate bottom must stay on or above. Null when the strip is clear of the map. */
export function plateClearBottom(input: {
  enabled?: boolean;
  canvasTop: number;
  canvasHeight: number;
  canvasBitmapH: number;
  guideTop: number;
  guideHeight: number;
}) {
  const enabled = input.enabled ?? ZOOM_PLATE_LIFT_ENABLED;
  if (!enabled) return null;
  if (input.canvasHeight <= 0 || input.canvasBitmapH <= 0 || input.guideHeight <= 0) return null;
  const canvasBottom = input.canvasTop + input.canvasHeight;
  const guideBottom = input.guideTop + input.guideHeight;
  if (guideBottom <= input.canvasTop || input.guideTop >= canvasBottom) return null;
  const limitCss = input.guideTop - input.canvasTop - CLEAR_GAP_CSS;
  if (limitCss <= 8) return null;
  return Math.floor((limitCss / input.canvasHeight) * input.canvasBitmapH);
}

export function plateNeedsLift(input: {
  name: string;
  selfName: string | null;
  nearNames: readonly string[];
  showAll: boolean;
  clearBottom: number | null;
}) {
  if (input.showAll || input.clearBottom == null) return false;
  if (input.selfName && input.name === input.selfName) return true;
  return input.nearNames.includes(input.name);
}

function overlaps(a: PlateBox, b: PlateBox) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Move a plate fully above the strip, then step it clear of plates already placed. */
export function liftPlateBox(box: PlateBox, clearBottom: number | null, occupied: readonly PlateBox[] = []) {
  if (clearBottom == null || !Number.isFinite(clearBottom) || box.h <= 0) return box;
  let next = box.y + box.h <= clearBottom ? { ...box } : { ...box, y: Math.max(2, clearBottom - box.h) };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const hit = occupied.find((other) => overlaps(next, other));
    if (!hit) break;
    const y = hit.y - next.h - 2;
    if (y < 2 || y >= next.y) break;
    next = { ...next, y };
  }
  return next;
}
