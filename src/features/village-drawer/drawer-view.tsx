"use client";

import type { ReactNode } from "react";
import { useDrawerDiscover } from "@/features/village-drawer-discover/discover-cue";
import { VILLAGE_DRAWER_ENABLED, VILLAGE_DRAWER_LABEL } from "@/features/village-drawer/village-drawer";

/** Default collapsed. No open attribute, so the map stays in front. */
export function VillageDrawer({
  children,
  discoverActive = false,
  reduceMotion = false,
  moreOpened = false,
}: {
  children: ReactNode;
  discoverActive?: boolean;
  reduceMotion?: boolean;
  moreOpened?: boolean;
}) {
  const { cue, markOpened } = useDrawerDiscover(discoverActive, reduceMotion, moreOpened);
  if (!VILLAGE_DRAWER_ENABLED) return children;
  return (
    <details
      className="hud-panel village-drawer"
      data-testid="village-drawer"
      data-module="village-drawer"
      data-drawer-cue={cue}
      onToggle={(event) => {
        if (event.currentTarget.open) markOpened();
      }}
    >
      <summary className="hud-title cursor-pointer">
        {cue !== "off" ? (
          <span className="drawer-discover-cue" data-testid="drawer-discover" data-drawer-cue={cue} aria-hidden />
        ) : null}
        {VILLAGE_DRAWER_LABEL}
      </summary>
      <div className="village-drawer-body">{children}</div>
    </details>
  );
}
