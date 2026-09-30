"use client";

import { RITUAL_LINES, ritualStep, type RitualFlags } from "@/lib/ritual";

export function RitualGuide(props: { flags: RitualFlags; onSkip: () => void }) {
  const step = ritualStep(props.flags);
  if (step === "done") return null;
  return (
    <section className="hud-panel px-3 py-3" data-testid="ritual-guide" data-ritual-step={step}>
      <p className="pixel-label text-[#2a1a10]">先在村里走一圈</p>
      <ol className="mt-2 space-y-1 text-sm text-[#2a1a10]">
        <li data-ritual="self" data-current={step === "self" ? "1" : "0"}>
          {props.flags.self ? "已选定我是谁。" : RITUAL_LINES.self}
        </li>
        <li data-ritual="yard" data-current={step === "yard" ? "1" : "0"}>
          {props.flags.yard ? "院里或本周小事做过了。" : RITUAL_LINES.yard}
        </li>
        <li data-ritual="social" data-current={step === "social" ? "1" : "0"}>
          {props.flags.social ? "挥手或关照做过了。" : RITUAL_LINES.social}
        </li>
      </ol>
      <button type="button" className="hud-btn hud-btn-ghost mt-2" data-testid="ritual-skip" onClick={props.onSkip}>
        知道了，先自己逛
      </button>
    </section>
  );
}
