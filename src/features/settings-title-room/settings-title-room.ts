/**
 * PV-PM-120 — the reduced-motion line sits beside 「体贴设置」, not on the four characters.
 * It still stays off 村里. Set SETTINGS_TITLE_ROOM_ENABLED to false to cover the title again.
 */

export const SETTINGS_TITLE_ROOM_ENABLED = true;

export function settingsTitleRoomOn(enabled = SETTINGS_TITLE_ROOM_ENABLED) {
  return enabled;
}

export function settingsTitleRoomMark(enabled = SETTINGS_TITLE_ROOM_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export type Box = { top: number; right: number; bottom: number; left: number };

/** Height of the overlapping rectangle. Zero when the boxes only touch or miss. */
export function overlapHeight(a: Box, b: Box) {
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  if (right <= left || bottom <= top) return 0;
  return bottom - top;
}
