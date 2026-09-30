"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UNDO_MS } from "@/lib/play-systems";
import { undoSecondsLeft } from "@/lib/wave-d";

type Props = {
  onUndo: () => void;
  onExpire: () => void;
};

type Clock = { until: number; now: number };

/**
 * The deadline starts here, on the commit that shows the button.
 * Stamping it in the page click handler let a slow confirm render burn
 * the first second before this row painted.
 */
export function KindnessUndo({ onUndo, onExpire }: Props) {
  const expireRef = useRef(onExpire);
  const [clock, setClock] = useState<Clock | null>(null);

  useEffect(() => {
    expireRef.current = onExpire;
  });

  useLayoutEffect(() => {
    const now = Date.now();
    // After the parent commit, before paint. The follow-up render is only this row,
    // so the first painted label is still 「撤销（3秒）」.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deadline is wall-clock at paint, not derived state
    setClock({ until: now + UNDO_MS, now });
  }, []);

  const until = clock?.until;

  useEffect(() => {
    if (until == null) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      if (now >= until) {
        expireRef.current();
        return;
      }
      setClock((current) => (current && current.until === until ? { until, now } : current));
    }, 200);
    return () => window.clearInterval(id);
  }, [until]);

  if (!clock || until == null) return null;
  const remaining = until - clock.now;
  if (remaining <= 0) return null;
  const seconds = undoSecondsLeft(until, clock.now);
  return (
    <div
      className="hud-stat pixel-label flex flex-wrap items-center gap-2 text-[#2a1a10]"
      data-testid="kindness-undo"
      data-undo-until={until}
      data-undo-at={until - UNDO_MS}
      data-undo-seconds={seconds}
      data-undo-ms={UNDO_MS}
      data-undo-remaining={remaining}
    >
      <span>刚才消耗了 1 次善意。</span>
      <button type="button" className="hud-btn hud-btn-ghost" onClick={onUndo}>
        撤销（{seconds}秒）
      </button>
    </div>
  );
}
