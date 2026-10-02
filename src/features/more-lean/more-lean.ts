/**
 * PV-PM-115 — 「更多」 adds the legend, the yard, and nameplates.
 * It does not open a second today list, and the toolbar buttons do not pile up.
 * Set the flag false to put the old sheet back.
 */

export const MORE_LEAN_ENABLED = true;

export const MORE_LEAN_ADDS = ["图例", "院子", "全显名牌"] as const;

export function moreLeanOn(enabled = MORE_LEAN_ENABLED) {
  return enabled;
}

export function moreLeanMark(enabled = MORE_LEAN_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function moreSheetHidesToday(enabled = MORE_LEAN_ENABLED) {
  return enabled;
}

/** Axis-aligned boxes. Area 0 means they do not overlap. */
export function intersectionArea(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (width <= 0 || height <= 0) return 0;
  return width * height;
}

export function toolbarClear(boxes: { left: number; top: number; right: number; bottom: number }[]) {
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const left = boxes[i];
      const right = boxes[j];
      if (left && right && intersectionArea(left, right) > 0) return false;
    }
  }
  return true;
}
