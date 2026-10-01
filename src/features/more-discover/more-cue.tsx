"use client";

import { useEffect, useRef, useState } from "react";
import { NARROW_CHROME_MAX_PX } from "@/features/narrow-chrome/narrow-chrome";
import {
  MORE_DISCOVER_ENABLED,
  MORE_DISCOVER_KEY,
  MORE_DISCOVER_MS,
  moreCueMode,
  moreDiscoverStored,
  type MoreCue,
} from "@/features/more-discover/more-discover";

function readStored() {
  try {
    return window.localStorage.getItem(MORE_DISCOVER_KEY);
  } catch {
    return moreDiscoverStored();
  }
}

function writeStored() {
  try {
    window.localStorage.setItem(MORE_DISCOVER_KEY, moreDiscoverStored());
  } catch {
    /* private mode */
  }
}

/** Dot on 更多. The parent button is the hit target. */
export function MoreDiscoverDot({
  ready,
  opened,
  reduceMotion,
}: {
  ready: boolean;
  opened: boolean;
  reduceMotion: boolean;
}) {
  const [mode, setMode] = useState<MoreCue>("off");
  const seen = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    if (!MORE_DISCOVER_ENABLED || !ready || finished.current) return;
    const narrow = window.matchMedia(`(max-width: ${NARROW_CHROME_MAX_PX}px)`).matches;
    if (!narrow) return;
    let hide = 0;
    const show = window.setTimeout(() => {
      if (finished.current) return;
      if (opened) {
        finished.current = true;
        writeStored();
        setMode("off");
        return;
      }
      if (!seen.current && readStored() === moreDiscoverStored()) {
        finished.current = true;
        return;
      }
      const next = moreCueMode({
        stored: null,
        width: window.innerWidth,
        mapReady: true,
        opened: false,
        elapsedMs: 0,
        reduceMotion,
      });
      if (next === "off") return;
      seen.current = true;
      setMode(next);
      hide = window.setTimeout(() => {
        finished.current = true;
        writeStored();
        setMode("off");
      }, MORE_DISCOVER_MS);
    }, 0);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [ready, opened, reduceMotion]);

  if (mode === "off") return null;
  return <span className="map-more-cue" data-testid="more-discover" data-more-cue={mode} aria-hidden />;
}
