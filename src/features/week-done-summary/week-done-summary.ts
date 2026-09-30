/**
 * PV-PM-015 — a finished week replaces the dead chore buttons.
 * Set WEEK_DONE_SUMMARY_ENABLED to false to put the three buttons back.
 * Thumbs name world traces. They are not a ranking.
 */

export const WEEK_DONE_SUMMARY_ENABLED = true;

export const WEEK_SETTLED_TITLE = "本周已安顿";
export const WEEK_SETTLED_NOTE = "脚印、水壶和布条还留在地图上。不跟别人比。";

export const WEEK_THUMBS = [
  { id: "footprints", label: "脚印" },
  { id: "kettle", label: "水壶" },
  { id: "ribbon", label: "布条" },
] as const;

export function weekPanelMode(complete: boolean, enabled = WEEK_DONE_SUMMARY_ENABLED) {
  return complete && enabled ? ("settled" as const) : ("chores" as const);
}
