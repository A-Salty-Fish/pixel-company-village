"use client";

import { useEffect, useRef, useState } from "react";
import { MORE_DISCOVER_KEY } from "@/features/more-discover/more-discover";
import { NARROW_CHROME_MAX_PX } from "@/features/narrow-chrome/narrow-chrome";
import {
  VILLAGE_DRAWER_DISCOVER_ENABLED,
  VILLAGE_DRAWER_DISCOVER_MS,
  drawerDiscoverMode,
  drawerDiscoverRemember,
  drawerDiscoverStored,
  loadDrawerDiscover,
  moreDiscoverBlocksDrawer,
  saveDrawerDiscover,
} from "@/features/village-drawer-discover/village-drawer-discover";

/** Lights 「村里」 once. A 更多 pulse on this visit defers the mark. */
export function useDrawerDiscover(active: boolean, reduceMotion: boolean, moreOpened: boolean) {
  const [phase, setPhase] = useState<"off" | "on">("off");
  const finished = useRef(false);
  const deferred = useRef(false);
  const started = useRef(false);
  const startedAt = useRef(0);
  const cue = phase === "off" ? "off" : reduceMotion ? "still" : "pulse";

  useEffect(() => {
    if (!VILLAGE_DRAWER_DISCOVER_ENABLED || !active || finished.current || deferred.current || started.current) return;
    const id = window.setTimeout(() => {
      if (finished.current || deferred.current || started.current) return;
      const stored = loadDrawerDiscover();
      if (stored === drawerDiscoverStored()) {
        finished.current = true;
        return;
      }
      let moreStored: string | null = null;
      let width = NARROW_CHROME_MAX_PX + 1;
      try {
        moreStored = window.localStorage.getItem(MORE_DISCOVER_KEY);
      } catch {
        moreStored = null;
      }
      width = window.innerWidth;
      const morePulse = moreDiscoverBlocksDrawer({
        stored: moreStored,
        width,
        mapReady: true,
        opened: moreOpened,
        reduceMotion,
      });
      const mode = drawerDiscoverMode({
        active: true,
        stored,
        opened: false,
        elapsedMs: 0,
        reduceMotion,
        morePulse,
      });
      if (mode === "defer") {
        deferred.current = true;
        return;
      }
      if (mode === "off") return;
      started.current = true;
      startedAt.current = Date.now();
      setPhase("on");
      window.setTimeout(() => {
        saveDrawerDiscover();
        finished.current = true;
        setPhase("off");
      }, VILLAGE_DRAWER_DISCOVER_MS);
    }, 0);
    return () => window.clearTimeout(id);
  }, [active, moreOpened, reduceMotion]);

  const markOpened = () => {
    if (finished.current) return;
    const elapsed = started.current ? Date.now() - startedAt.current : 0;
    const remember = drawerDiscoverRemember({
      active,
      opened: true,
      deferred: deferred.current && !started.current,
      elapsedMs: elapsed,
      stored: loadDrawerDiscover(),
    });
    if (!remember) return;
    saveDrawerDiscover();
    finished.current = true;
    setPhase("off");
  };

  return { cue, markOpened };
}
