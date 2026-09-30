/**
 * season-ground-props — denser fallen leaves and snow tufts on the ground.
 * Quiet villages stay clear. These pixels are not click targets.
 * Set SEASON_GROUND_PROPS_ENABLED to false to restore the bare ground.
 */

import type { Pixel } from "@/lib/worldcraft";

export const SEASON_GROUND_PROPS_ENABLED = true;

export const GROUND_CLUSTER_COUNT = 12;

const SLOTS: ReadonlyArray<readonly [number, number]> = [
  [280, 360],
  [360, 520],
  [440, 700],
  [520, 300],
  [600, 860],
  [680, 440],
  [760, 640],
  [840, 320],
  [920, 780],
  [1000, 500],
  [340, 900],
  [1080, 360],
];

export type GroundKind = "leaf" | "tuft" | "petal" | "grass";

function kindFor(seasonId: string): GroundKind {
  if (seasonId === "autumn") return "leaf";
  if (seasonId === "winter") return "tuft";
  if (seasonId === "spring") return "petal";
  return "grass";
}

function colorsFor(kind: GroundKind): [string, string] {
  if (kind === "leaf") return ["#d46a32", "#8a3a28"];
  if (kind === "tuft") return ["#fff6d8", "#d5e4ef"];
  if (kind === "petal") return ["#f4b4c4", "#fff6d8"];
  return ["#3a7d4a", "#6aaa3a"];
}

export function groundPropMark(
  seasonId: string,
  quiet: boolean,
  enabled = SEASON_GROUND_PROPS_ENABLED,
): "off" | GroundKind {
  if (!enabled || quiet || !seasonId) return "off";
  return kindFor(seasonId);
}

export function groundClusterCount(seasonId: string, quiet: boolean, enabled = SEASON_GROUND_PROPS_ENABLED) {
  if (groundPropMark(seasonId, quiet, enabled) === "off") return 0;
  return GROUND_CLUSTER_COUNT;
}

/** Paint-only. Callers must not register these with hit testing. */
export function groundPropsBlockClicks() {
  return false;
}

export function seasonGroundProps(seasonId: string, quiet: boolean, enabled = SEASON_GROUND_PROPS_ENABLED): Pixel[] {
  const kind = groundPropMark(seasonId, quiet, enabled);
  if (kind === "off") return [];
  const colors = colorsFor(kind);
  const wide = kind === "leaf" || kind === "tuft";
  const pixels: Pixel[] = [];
  for (let i = 0; i < SLOTS.length; i += 1) {
    const [x, y] = SLOTS[i];
    const color = colors[i % 2];
    const mate = colors[(i + 1) % 2];
    if (wide) {
      pixels.push(
        { x, y, w: 5, h: 2, color },
        { x: x + 2, y: y - 2, w: 3, h: 2, color: mate },
        { x: x + 5, y: y + 1, w: 3, h: 2, color },
      );
    } else {
      pixels.push(
        { x, y, w: 3, h: 2, color },
        { x: x + 2, y: y + 1, w: 2, h: 1, color: mate },
      );
    }
  }
  return pixels;
}
