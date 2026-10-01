"use client";

import { SIGNAL_CARE_EMPTY, signalCareView } from "@/features/signal-care/signal-care";

export function SignalCareNote({ days, bondCount }: { days: readonly string[]; bondCount: number }) {
  const view = signalCareView({ days, bondCount });
  if (!view) return null;
  return (
    <section
      className="signal-care"
      data-testid="signal-care"
      data-module="signal-care"
      data-care-count={String(view.careCount)}
      data-bond-count={String(view.bondCount)}
      data-care-date={view.lastDate ?? ""}
    >
      <p className="pixel-label text-[#2a1a10]">
        关照 {view.careCount} · 熟识 {view.bondCount}
      </p>
      <p className="text-xs text-[#6a3d18]">{view.lastDate ? `上次关照 ${view.lastDate}` : SIGNAL_CARE_EMPTY}</p>
      <p className="text-xs text-[#6a3d18]">{view.line}</p>
    </section>
  );
}
