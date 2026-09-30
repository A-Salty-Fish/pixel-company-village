/**
 * PV-PM-027 — lantern, scarecrow, and path stones answer on the map.
 * A click aims the camera and the drawn state matches the panel counts.
 * Set YARD_TOY_FOCUS_ENABLED to false to leave toys as panel-only.
 */

import type { Pixel } from "@/lib/worldcraft";

export const YARD_TOY_FOCUS_ENABLED = true;

export const TOY_IDS = ["lantern", "scarecrow", "pebble"] as const;
export type ToyId = (typeof TOY_IDS)[number];

export const TOY_ANCHORS: Record<ToyId, { x: number; y: number }> = {
  lantern: { x: 852, y: 336 },
  scarecrow: { x: 348, y: 440 },
  pebble: { x: 200, y: 640 },
};

export type ToyLook = {
  lantern: boolean;
  scare: number;
  pebbles: number;
};

export function isToyId(id: string): id is ToyId {
  return (TOY_IDS as readonly string[]).includes(id);
}

export function toyAnchor(id: ToyId) {
  return TOY_ANCHORS[id];
}

export function toyPulseMark(id: string | null, enabled = YARD_TOY_FOCUS_ENABLED): ToyId | "off" {
  if (!enabled || !id || !isToyId(id)) return "off";
  return id;
}

/** World pixels for the three toys. Counts only, no sentences. */
export function toyWorldPixels(look: ToyLook, enabled = YARD_TOY_FOCUS_ENABLED): Pixel[] {
  if (!enabled) return [];
  const pixels: Pixel[] = [];
  const lamp = TOY_ANCHORS.lantern;
  pixels.push(
    { x: lamp.x, y: lamp.y, w: 3, h: 16, color: "#2a1a10" },
    {
      x: lamp.x - 4,
      y: lamp.y - 8,
      w: 11,
      h: 8,
      color: look.lantern ? "#f2d15c" : "#5a3214",
    },
  );
  if (look.lantern) {
    pixels.push({ x: lamp.x - 1, y: lamp.y - 6, w: 5, h: 4, color: "#fff6d8" });
  }
  const scare = TOY_ANCHORS.scarecrow;
  const lean = look.scare % 2 === 0 ? 0 : look.scare % 4 === 1 ? -3 : 3;
  pixels.push(
    { x: scare.x + lean, y: scare.y, w: 3, h: 18, color: "#6a3d18" },
    { x: scare.x - 6 + lean, y: scare.y - 6, w: 15, h: 6, color: "#c4a060" },
    { x: scare.x - 2 + lean, y: scare.y + 16, w: 8, h: 3, color: "#2f6a3a" },
  );
  const stone = TOY_ANCHORS.pebble;
  const count = Math.max(0, Math.min(5, Math.floor(look.pebbles)));
  for (let i = 0; i < count; i += 1) {
    pixels.push({ x: stone.x + i * 8, y: stone.y, w: 5, h: 4, color: "#d5e4ef" });
  }
  return pixels;
}

export function toyFocusPixels(x: number, y: number, enabled = YARD_TOY_FOCUS_ENABLED): Pixel[] {
  if (!enabled) return [];
  return [
    { x: x - 10, y: y - 10, w: 20, h: 2, color: "#fff6d8" },
    { x: x - 10, y: y + 8, w: 20, h: 2, color: "#fff6d8" },
    { x: x - 10, y: y - 8, w: 2, h: 18, color: "#f2d15c" },
    { x: x + 8, y: y - 8, w: 2, h: 18, color: "#f2d15c" },
  ];
}
