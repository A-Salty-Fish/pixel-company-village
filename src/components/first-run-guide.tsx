"use client";

import { useSyncExternalStore } from "react";
import { GUIDE_KEY, GUIDE_LINES, guideSeen } from "@/lib/first-run";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSeen() {
  if (typeof window === "undefined") return true;
  try {
    return guideSeen(window.localStorage.getItem(GUIDE_KEY));
  } catch {
    return true;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(GUIDE_KEY, "1");
  } catch {
    /* private mode */
  }
  emit();
}

export function FirstRunGuide() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  if (seen) return null;
  return (
    <section className="hud-panel px-3 py-3" data-testid="first-run-guide" data-open="1">
      <h2 className="pixel-label text-[#2a1a10]">第一次来</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-[#6a3d18]">
        {GUIDE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <button type="button" className="hud-btn mt-3" data-testid="first-run-dismiss" onClick={dismiss}>
        知道了
      </button>
    </section>
  );
}
