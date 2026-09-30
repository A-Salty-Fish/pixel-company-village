"use client";

import { RITUAL_ACT, RITUAL_BEATS, RITUAL_DONE_ACT, RITUAL_NEED, nearLine, ritualBeat, type RitualSave } from "@/lib/header-ritual";

export function HeaderRitual({
  viewer,
  hour,
  near,
  saved,
  onComplete,
}: {
  viewer: string | null;
  hour: number;
  near: number;
  saved: RitualSave | null;
  onComplete: () => void;
}) {
  const shown = saved ? RITUAL_BEATS[saved.beat] : ritualBeat(hour);
  const done = Boolean(saved);
  return (
    <section
      className="pt-3"
      data-testid="header-ritual"
      data-ritual-beat={shown.id}
      data-ritual-done={done ? "1" : "0"}
      data-ritual-near={String(near)}
      data-ritual-motion="still"
    >
      <p className="pixel-label text-[#2a1a10]">{shown.title}</p>
      <p className="mt-1 text-xs text-[#6a3d18]">{done ? shown.done : viewer ? shown.line : RITUAL_NEED}</p>
      <p className="mt-1 text-xs text-[#6a3d18]" data-testid="ritual-near">
        {nearLine(near)}
      </p>
      <button
        type="button"
        className="hud-btn mt-2"
        data-testid="header-ritual-act"
        disabled={!viewer || done}
        onClick={onComplete}
      >
        {done ? RITUAL_DONE_ACT : RITUAL_ACT}
      </button>
    </section>
  );
}
