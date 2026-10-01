/**
 * PV-PM-058 — the whole 「村里」 wood sign lights once.
 * Needs a chosen self, and either week progress or today's ritual.
 * Opening the drawer or ~8s stores "1". Reduced motion still marks, without a pulse.
 * If 更多 is pulsing on the same visit, this waits until next time.
 * Set VILLAGE_DRAWER_DISCOVER_ENABLED to false to leave the sign plain.
 */

import { moreCueMode } from "@/features/more-discover/more-discover";

export const VILLAGE_DRAWER_DISCOVER_ENABLED = true;
export const VILLAGE_DRAWER_DISCOVER_KEY = "village:drawer-discover-v1";
export const VILLAGE_DRAWER_DISCOVER_MS = 8_000;

export type DrawerCue = "pulse" | "still" | "off" | "defer";

export function drawerDiscoverStored() {
  return "1" as const;
}

export function moreDiscoverBlocksDrawer(input: {
  stored: string | null;
  width: number;
  mapReady: boolean;
  opened: boolean;
  reduceMotion: boolean;
}) {
  return (
    moreCueMode({
      stored: input.stored,
      width: input.width,
      mapReady: input.mapReady,
      opened: input.opened,
      elapsedMs: 0,
      reduceMotion: input.reduceMotion,
    }) === "pulse"
  );
}

export function drawerDiscoverMode(input: {
  active: boolean;
  stored: string | null;
  opened: boolean;
  elapsedMs: number;
  reduceMotion: boolean;
  morePulse: boolean;
  deferred?: boolean;
  enabled?: boolean;
}): DrawerCue {
  const enabled = input.enabled ?? VILLAGE_DRAWER_DISCOVER_ENABLED;
  if (!enabled) return "off";
  if (input.deferred) return "defer";
  if (input.stored === drawerDiscoverStored()) return "off";
  if (!input.active) return "off";
  if (input.morePulse) return "defer";
  if (input.opened) return "off";
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < 0 || input.elapsedMs >= VILLAGE_DRAWER_DISCOVER_MS) {
    return "off";
  }
  return input.reduceMotion ? "still" : "pulse";
}

/** Write the mark when the sign was lit and then opened or timed out. A deferred visit stays unmarked. */
export function drawerDiscoverRemember(input: {
  active: boolean;
  opened: boolean;
  deferred: boolean;
  elapsedMs: number;
  stored: string | null;
}) {
  if (!input.active || input.deferred || input.stored === drawerDiscoverStored()) return false;
  if (input.opened) return true;
  return Number.isFinite(input.elapsedMs) && input.elapsedMs >= VILLAGE_DRAWER_DISCOVER_MS;
}

export function loadDrawerDiscover() {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(VILLAGE_DRAWER_DISCOVER_KEY);
  } catch {
    return drawerDiscoverStored();
  }
}

export function saveDrawerDiscover() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(VILLAGE_DRAWER_DISCOVER_KEY, drawerDiscoverStored());
  } catch {
    /* private mode */
  }
}
