/**
 * PV-PM-081 — the phone map keeps a first screen of village.
 * An open header, legend, or settings sheet must not shrink the farm
 * under MAP_ROOM_MIN_PX. The thumb bar stays below that farm.
 * Set MAP_ROOM_ENABLED to false to let the header pad grow again.
 */

export const MAP_ROOM_ENABLED = true;
export const MAP_ROOM_MIN_PX = 280;
export const MAP_ROOM_NARROW_PX = 480;

export function mapRoomOn(enabled = MAP_ROOM_ENABLED) {
  return enabled;
}

export function mapRoomMark(enabled = MAP_ROOM_ENABLED): "room" | "off" {
  return enabled ? "room" : "off";
}

export function mapKeepsRoom(height: number, min = MAP_ROOM_MIN_PX) {
  return Number.isFinite(height) && height >= min;
}

/**
 * Layout pad uses the closed header. An expanded fold overlays the map
 * instead of pushing the farm down.
 */
export function headerLayoutPad(collapsedPx: number, expandedPx: number, enabled = MAP_ROOM_ENABLED) {
  const closed = Math.max(0, Math.round(Number.isFinite(collapsedPx) ? collapsedPx : 0));
  const open = Math.max(0, Math.round(Number.isFinite(expandedPx) ? expandedPx : 0));
  if (!enabled) return open;
  return closed > 0 ? closed : open;
}

export function legendStartsClosed(enabled = MAP_ROOM_ENABLED) {
  return enabled;
}
