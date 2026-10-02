/**
 * PV-PM-117 — the first-visit tip travels with the page.
 * It stays clear of the split, the roster, and 村里, and still clears the bottom bar.
 * After a name is chosen it stops teaching 先选定.
 * The reduced-motion line sits on 体贴设置.
 * Set TIP_FOLLOWS_CONTENT_ENABLED to false to pin the tip above the bar again.
 */

export const TIP_FOLLOWS_CONTENT_ENABLED = true;

export const TIP_AFTER_SELF = "先在地图上找我。";

export function tipFollowsOn(enabled = TIP_FOLLOWS_CONTENT_ENABLED) {
  return enabled;
}

export function tipFollowsMark(enabled = TIP_FOLLOWS_CONTENT_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function tipTeachesChooseSelf(line: string) {
  return line.includes("先选定");
}

/** Once a name is chosen, the visible tip no longer teaches that step. */
export function tipForIdentity(line: string, hasSelf: boolean, enabled = TIP_FOLLOWS_CONTENT_ENABLED) {
  if (!enabled || !hasSelf) return line;
  if (!tipTeachesChooseSelf(line)) return line;
  return TIP_AFTER_SELF;
}

export type TipBox = { top: number; right: number; bottom: number; left: number };

export function rectsIntersect(a: TipBox, b: TipBox) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** The tip's bottom still clears the bar. Traveling with the page must not fall under it. */
export function tipStillClearsBar(tipBottom: number, barTop: number, gap = 8) {
  if (!Number.isFinite(tipBottom) || !Number.isFinite(barTop)) return false;
  return barTop - tipBottom >= gap;
}
