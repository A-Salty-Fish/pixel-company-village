"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { GUIDE_KEY, GUIDE_LINES, VISIT_KEY, guideSeen, visitComplete, visitStep, type VisitFlags } from "@/lib/first-run";
import {
  FIRST_VISIT_KEY,
  FIRST_VISIT_ONE_HINT_ENABLED,
  FIRST_VISIT_TIPS,
  emitFirstVisit,
  firstVisitDone,
  firstVisitShownStep,
  firstVisitTip,
  readFirstVisitStep,
  subscribeFirstVisit,
} from "@/features/first-visit-one-hint/first-visit-one-hint";

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
  emitFirstVisit();
}

/** Matches the server snapshot until the browser reads storage. */
let stepCache = 0;

function storedStep() {
  if (typeof window === "undefined") return 0;
  try {
    const seen = guideSeen(window.localStorage.getItem(GUIDE_KEY));
    const stepRaw = window.localStorage.getItem(FIRST_VISIT_KEY);
    if (!seen && firstVisitDone(readFirstVisitStep(stepRaw))) {
      window.localStorage.removeItem(FIRST_VISIT_KEY);
    }
    return firstVisitShownStep(seen, stepRaw);
  } catch {
    return 0;
  }
}

function readStep() {
  return stepCache;
}

function publishStep(step: number) {
  if (stepCache === step) return;
  stepCache = step;
  emitFirstVisit();
}

/** Drop the dismiss latch so a cleared identity can see the first tip again. */
export function forgetFirstVisit() {
  try {
    window.localStorage.removeItem(GUIDE_KEY);
    window.localStorage.removeItem(FIRST_VISIT_KEY);
  } catch {
    /* private mode */
  }
  stepCache = 0;
  emitFirstVisit();
  emit();
}

function dismissOne(flags: VisitFlags) {
  try {
    window.localStorage.setItem(VISIT_KEY, JSON.stringify(flags));
    window.localStorage.setItem(FIRST_VISIT_KEY, String(FIRST_VISIT_TIPS.length));
    window.localStorage.setItem(GUIDE_KEY, "1");
  } catch {
    /* private mode */
  }
  publishStep(FIRST_VISIT_TIPS.length);
  emit();
}

function OneVisitHint({ flags, onShowMotion }: { flags: VisitFlags; onShowMotion?: () => void }) {
  const step = useSyncExternalStore(subscribeFirstVisit, readStep, () => 0);
  useLayoutEffect(() => {
    publishStep(storedStep());
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== GUIDE_KEY && event.key !== FIRST_VISIT_KEY) return;
      publishStep(storedStep());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [flags]);
  if (visitComplete(flags)) return null;
  const tip = firstVisitTip(step);
  if (!tip) return null;
  const motion = tip.includes("减动开关");
  return (
    <section
      className="first-visit-hint"
      data-testid="first-run-guide"
      data-open="1"
      data-visit-step={visitStep(flags)}
      data-hint-index={step}
      data-blocks-map="0"
    >
      <p>{tip}</p>
      <button type="button" className="hud-btn" data-testid="first-run-dismiss" onClick={() => dismissOne(flags)}>
        知道了
      </button>
      {motion ? (
        <button type="button" className="hud-btn hud-btn-ghost" data-testid="first-run-motion" onClick={() => onShowMotion?.()}>
          去看减动开关
        </button>
      ) : null}
    </section>
  );
}

function FullVisitGuide({ flags, onShowMotion }: { flags: VisitFlags; onShowMotion?: () => void }) {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  if (seen || visitComplete(flags)) return null;
  const step = visitStep(flags);
  return (
    <section className="hud-panel px-3 py-3" data-testid="first-run-guide" data-open="1" data-visit-step={step}>
      <h2 className="pixel-label text-[#2a1a10]">先在村里走一圈</h2>
      <ol className="mt-2 space-y-1 text-sm text-[#2a1a10]">
        <li data-visit="self" data-current={step === "self" ? "1" : "0"}>
          {flags.self ? "已选定我是谁。" : GUIDE_LINES[0]}
        </li>
        <li data-visit="yard" data-current={step === "yard" ? "1" : "0"}>
          {flags.yard ? "院里或本周小事做过了。" : GUIDE_LINES[1]}
        </li>
        <li data-visit="social" data-current={step === "social" ? "1" : "0"}>
          {flags.social ? "挥手或关照做过了。" : GUIDE_LINES[2]}
        </li>
      </ol>
      <p className="mt-2 text-xs text-[#6a3d18]">{GUIDE_LINES[3]}</p>
      <p className="text-xs text-[#6a3d18]">{GUIDE_LINES[4]}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="hud-btn" data-testid="first-run-dismiss" onClick={dismiss}>
          知道了
        </button>
        <button
          type="button"
          className="hud-btn hud-btn-ghost"
          data-testid="first-run-motion"
          onClick={() => onShowMotion?.()}
        >
          去看减动开关
        </button>
      </div>
    </section>
  );
}

export function FirstRunGuide({ flags, onShowMotion }: { flags: VisitFlags; onShowMotion?: () => void }) {
  if (FIRST_VISIT_ONE_HINT_ENABLED) {
    return <OneVisitHint flags={flags} onShowMotion={onShowMotion} />;
  }
  return <FullVisitGuide flags={flags} onShowMotion={onShowMotion} />;
}
