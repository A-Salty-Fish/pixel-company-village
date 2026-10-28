/**
 * PV-FIX-1172 — 「我是谁」 is easy to find on the first visit.
 * Guests see a dark, labeled 「我是谁？点这里选名字」 button: the bottom bar on
 * phones, and a button beside the visitor line on wide screens (where the
 * picker otherwise sits in closed 体贴设置). The picker gets a name filter and
 * tappable names, and choosing one shows 「已选定：名字」 for a moment.
 * Only display names are shown. Nothing is logged or stored beyond 我是谁.
 * Set WHO_ENTRY_ENABLED to false to go back to the 1.17.1 entry and picker.
 */

export const WHO_ENTRY_ENABLED = true;

export const WHO_ENTRY_LABEL = "我是谁？点这里选名字";
export const WHO_ENTRY_SEARCH = "输入名字里的一个字";
export const WHO_ENTRY_EMPTY = "没找到这个名字。";
export const WHO_PICKED_MS = 3200;

export function whoEntryOn(enabled = WHO_ENTRY_ENABLED) {
  return enabled;
}

/** Guests get the strong labeled entry. After a name is chosen it is plain 我是谁 again. */
export function whoEntryLabel(hasSelf: boolean, enabled = WHO_ENTRY_ENABLED) {
  if (!enabled || hasSelf) return "我是谁";
  return WHO_ENTRY_LABEL;
}

export function whoPickedLine(name: string | null) {
  if (!name) return null;
  return `已选定：${name}`;
}

/** Case-insensitive substring filter. Empty query keeps every name in order. */
export function filterWhoNames(names: readonly string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [...names];
  return names.filter((name) => name.toLowerCase().includes(q));
}
