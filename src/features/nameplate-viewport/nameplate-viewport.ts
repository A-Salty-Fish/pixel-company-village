/**
 * PV-PM-026 — 全显名牌 follows the viewport instead of pasting every name at full ink.
 * Far zoom fades the edges. Closer zoom drops labels away from the middle.
 * Neighbors and the viewer stay clear. Turning 全显 off leaves the quiet cap alone.
 * Set NAMEPLATE_VIEWPORT_ENABLED to false to paste full ink again.
 */

export const NAMEPLATE_VIEWPORT_ENABLED = true;

export type ViewportPlate = { draw: boolean; alpha: number; mode: "off" | "fade" | "near" };

export function viewportMode(showAll: boolean, zoom: number, enabled = NAMEPLATE_VIEWPORT_ENABLED): ViewportPlate["mode"] {
  if (!enabled || !showAll) return "off";
  return Math.round(zoom) <= 1 ? "fade" : "near";
}

export function plateViewport(input: {
  showAll: boolean;
  zoom: number;
  sx: number;
  sy: number;
  viewW: number;
  viewH: number;
  hot: boolean;
  enabled?: boolean;
}): ViewportPlate {
  const enabled = input.enabled ?? NAMEPLATE_VIEWPORT_ENABLED;
  const mode = viewportMode(input.showAll, input.zoom, enabled);
  if (mode === "off") return { draw: true, alpha: 1, mode };
  const nx = (input.sx - input.viewW / 2) / Math.max(1, input.viewW / 2);
  const ny = (input.sy - input.viewH / 2) / Math.max(1, input.viewH / 2);
  const edge = Math.min(1.3, Math.hypot(nx, ny));
  if (input.hot) return { draw: true, alpha: 1, mode };
  if (mode === "fade") return { draw: true, alpha: Math.max(0.28, 1 - edge * 0.62), mode };
  const limit = Math.round(input.zoom) >= 3 ? 0.58 : 0.8;
  if (edge > limit) return { draw: false, alpha: 0, mode };
  return { draw: true, alpha: Math.max(0.55, 1 - edge * 0.4), mode };
}
