/**
 * PV-PM-124 — 「去看村口」rests on the gate posts, not the viewer's field.
 * Zoom 3 centers the gate and clamps to the map corner, so the roof stays in frame.
 * Set GATE_ARRIVE_ENABLED to false to keep that corner frame.
 */

import { clampCamera, viewSpan } from "@/lib/pixel-scene";
import { GATE_POST } from "@/lib/worldcraft";

export const GATE_ARRIVE_ENABLED = true;

/**
 * Tight enough that the view bottom can sit above the first house row.
 * Zoom 3's span still covers that row from the top of the map.
 */
export const GATE_ARRIVE_ZOOM = 8;

/**
 * Bottom edge of the arrived view.
 * The painted gate is GATE_POST (88, 128). The first plots start at y 240,
 * the header tree near them sits at y 214, and the viewer's roof pin is lower.
 * 210 keeps the posts inside and those roofs outside.
 */
export const GATE_FRAME_BOTTOM = 210;

export type GateArriveFrame = {
  x: number;
  y: number;
  zoom: number;
  spanW: number;
  spanH: number;
};

export function gateArriveOn(enabled = GATE_ARRIVE_ENABLED) {
  return enabled;
}

export function gateArriveMark(enabled = GATE_ARRIVE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Camera for the gate. Null keeps the old zoom-3 corner clamp. */
export function gateArriveCamera(enabled = GATE_ARRIVE_ENABLED): GateArriveFrame | null {
  if (!enabled) return null;
  const zoom = GATE_ARRIVE_ZOOM;
  const span = viewSpan(zoom);
  const focus = clampCamera(GATE_POST.x - span.w / 2, GATE_FRAME_BOTTOM - span.h, zoom);
  return { x: focus.x, y: focus.y, zoom, spanW: span.w, spanH: span.h };
}

/** Only the gate sentence uses the tighter frame. Lantern, pond, and bench stay put. */
export function gateArriveFor(kind: string | null | undefined, enabled = GATE_ARRIVE_ENABLED) {
  if (kind !== "gate") return null;
  return gateArriveCamera(enabled);
}

/** Once the gate frame lands, the camera does not drift back onto the viewer. */
export function gateArriveHolds(kind: string | null | undefined, enabled = GATE_ARRIVE_ENABLED) {
  return Boolean(gateArriveFor(kind, enabled));
}

export function frameContains(frame: GateArriveFrame, x: number, y: number) {
  return x >= frame.x && x < frame.x + frame.spanW && y >= frame.y && y < frame.y + frame.spanH;
}
