"use client";

import type { ReactNode } from "react";
import { VILLAGE_DRAWER_ENABLED, VILLAGE_DRAWER_LABEL } from "@/features/village-drawer/village-drawer";

/** Default collapsed. No open attribute, so the map stays in front. */
export function VillageDrawer({ children }: { children: ReactNode }) {
  if (!VILLAGE_DRAWER_ENABLED) return children;
  return (
    <details className="hud-panel village-drawer" data-testid="village-drawer" data-module="village-drawer">
      <summary className="hud-title cursor-pointer">{VILLAGE_DRAWER_LABEL}</summary>
      <div className="village-drawer-body">{children}</div>
    </details>
  );
}
