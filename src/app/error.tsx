"use client";

import { focalVillageMark } from "@/features/focal-village/focal-village";
import { woodPlaqueMark } from "@/features/wood-plaque/wood-plaque";

export default function VillageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      className="farm-page flex flex-1 items-center justify-center px-4 py-10"
      data-wood-plaque={woodPlaqueMark()}
      data-focal-village={focalVillageMark()}
    >
      <div className="hud-panel max-w-md overflow-hidden" data-testid="village-boundary">
        <div className="hud-title">村子还在</div>
        <div className="space-y-3 px-4 py-4 text-sm text-[#2a1a10]">
          <p>有一块数据坏了，整村先停在这里。名字和分数还可以再铺一次。</p>
          <button type="button" className="hud-btn" onClick={() => reset()}>
            再铺一次
          </button>
        </div>
      </div>
    </div>
  );
}
