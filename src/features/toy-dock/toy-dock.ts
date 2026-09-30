/**
 * PV-PM-030 — lantern, scarecrow, and path stones stay on the same screen as the map.
 * A click must not scroll the canvas away. Name and state sit on the map.
 * Set TOY_DOCK_ENABLED to false to leave toys in the lower list only.
 */

export const TOY_DOCK_ENABLED = true;

export const TOY_DOCK_IDS = ["lantern", "scarecrow", "pebble"] as const;
export type ToyDockId = (typeof TOY_DOCK_IDS)[number];

export function toyDockLocksScroll(id: string, enabled = TOY_DOCK_ENABLED) {
  return enabled && (TOY_DOCK_IDS as readonly string[]).includes(id);
}

export function toyDockItems(look: { lantern: boolean; scare: number; pebbles: number }) {
  return [
    { id: "lantern" as const, label: "灯笼", state: look.lantern ? "亮" : "灭" },
    { id: "scarecrow" as const, label: "稻草人", state: String(Math.max(0, Math.floor(look.scare))) },
    { id: "pebble" as const, label: "路石", state: String(Math.max(0, Math.floor(look.pebbles))) },
  ];
}

/** True when the map is mostly off-screen and should be brought back. */
export function mapNeedsRecall(
  rect: { top: number; bottom: number; height: number },
  viewportHeight: number,
) {
  if (rect.height <= 0 || viewportHeight <= 0) return false;
  const visible = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  return visible < Math.min(rect.height, viewportHeight) * 0.62;
}

export function recallMap(node: HTMLElement | null) {
  if (!node || typeof window === "undefined") return false;
  const rect = node.getBoundingClientRect();
  if (!mapNeedsRecall(rect, window.innerHeight)) return false;
  node.scrollIntoView({ block: "nearest", inline: "nearest" });
  return true;
}

export function toyDockCopy(look: { lantern: boolean; scare: number; pebbles: number }) {
  return toyDockItems(look).map((item) => `${item.label}${item.state}`);
}
