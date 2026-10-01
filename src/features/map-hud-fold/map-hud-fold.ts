/**
 * PV-PM-042 / PV-PM-046 — narrow map keeps zoom, 找我, and 静音.
 * Legend, today note, emotes, 相伴, and yard counts wait in 更多 or 院子.
 * Set MAP_HUD_FOLD_ENABLED to false to leave every control on the map.
 */

import { TOY_ANCHORS, type ToyId } from "@/features/yard-toy-focus/yard-toy-focus";

export const MAP_HUD_FOLD_ENABLED = true;

export const PERSISTENT_HUD = ["zoom", "find", "mute"] as const;

const FOLDED_HUD = ["legend", "today", "emote", "plates", "ambient", "company", "toys", "weather", "stay"] as const;

export type HudSlot = (typeof PERSISTENT_HUD)[number] | (typeof FOLDED_HUD)[number];

export function persistentHud(enabled = MAP_HUD_FOLD_ENABLED): readonly string[] {
  if (!enabled) return [...PERSISTENT_HUD, ...FOLDED_HUD];
  return PERSISTENT_HUD;
}

export function hudStaysOut(slot: HudSlot, enabled = MAP_HUD_FOLD_ENABLED) {
  return persistentHud(enabled).includes(slot);
}

/** Yard counts show after 院子 or a tap on the map object. */
export function toyDockVisible(
  input: { yard: boolean; toyPulse: boolean },
  enabled = MAP_HUD_FOLD_ENABLED,
) {
  if (!enabled) return true;
  return input.yard || input.toyPulse;
}

export function hitToy(x: number, y: number, radius = 36): ToyId | null {
  let best: ToyId | null = null;
  let bestDist = radius * radius;
  for (const id of Object.keys(TOY_ANCHORS) as ToyId[]) {
    const spot = TOY_ANCHORS[id];
    const dist = (x - spot.x) ** 2 + (y - spot.y) ** 2;
    if (dist <= bestDist) {
      best = id;
      bestDist = dist;
    }
  }
  return best;
}

export function toyTapCopy(id: ToyId, look: { lantern: boolean; scare: number; pebbles: number }) {
  if (id === "lantern") {
    return { toast: look.lantern ? "灯笼亮着。" : "灯笼灭着。", state: look.lantern ? "亮" : "灭" };
  }
  if (id === "scarecrow") {
    const state = String(Math.max(0, Math.floor(look.scare)));
    return { toast: "稻草人在田边。", state };
  }
  const state = String(Math.max(0, Math.floor(look.pebbles)));
  return { toast: "路石在路边。", state };
}
