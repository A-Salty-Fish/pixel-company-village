"use client";

import { useSyncExternalStore } from "react";
import {
  COMPACT_SETTINGS_DISCOVER_ENABLED,
  DISCOVER_KEY,
  DISCOVER_TIP,
  discoverShouldShow,
  discoverStoredValue,
} from "@/features/compact-settings-discover/discover";
import { GUIDE_KEY, guideSeen } from "@/lib/first-run";
import {
  FIRST_VISIT_KEY,
  firstVisitHoldsSlot,
  readFirstVisitStep,
  subscribeFirstVisit,
} from "@/features/first-visit-one-hint/first-visit-one-hint";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const stopVisit = subscribeFirstVisit(listener);
  return () => {
    listeners.delete(listener);
    stopVisit();
  };
}

function readHidden() {
  if (!COMPACT_SETTINGS_DISCOVER_ENABLED) return true;
  if (typeof window === "undefined") return true;
  try {
    const step = readFirstVisitStep(window.localStorage.getItem(FIRST_VISIT_KEY));
    if (firstVisitHoldsSlot({ guideSeen: guideSeen(window.localStorage.getItem(GUIDE_KEY)), step })) return true;
    return !discoverShouldShow(window.localStorage.getItem(DISCOVER_KEY));
  } catch {
    return true;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(DISCOVER_KEY, discoverStoredValue());
  } catch {
    /* private mode */
  }
  emit();
}

export function SettingsDiscover() {
  const hidden = useSyncExternalStore(subscribe, readHidden, () => true);
  if (!COMPACT_SETTINGS_DISCOVER_ENABLED || hidden) return null;
  return (
    <p
      className="mb-1 flex items-center justify-between gap-2 rounded-sm border-2 border-[#c4a060] bg-[#fff6d8] px-2 py-1 text-[11px] leading-5 text-[#6a3d18]"
      data-testid="settings-discover"
      data-module="compact-settings-discover"
    >
      <span>{DISCOVER_TIP}</span>
      <button type="button" className="hud-btn hud-btn-ghost" data-testid="settings-discover-dismiss" onClick={dismiss}>
        知道了
      </button>
    </p>
  );
}
