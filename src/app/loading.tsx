import { focalVillageMark } from "@/features/focal-village/focal-village";
import { woodPlaqueMark } from "@/features/wood-plaque/wood-plaque";

export default function Loading() {
  return (
    <div
      className="farm-page mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4"
      data-testid="village-boot"
      data-wood-plaque={woodPlaqueMark()}
      data-focal-village={focalVillageMark()}
    >
      <header className="hud-panel">
        <div className="hud-title">像素公司村</div>
        <p className="px-3 py-3 text-sm text-[#4a3a28]">正在请名册…</p>
      </header>
      <div className="hud-panel px-3 py-3 text-sm text-[#6a3d18]">田色和节日条还在路上。</div>
      <div className="hud-panel overflow-hidden" data-testid="roster-boot">
        <div className="hud-title">田亩名册</div>
        <div className="space-y-2 p-3">
          <div className="boot-row" />
          <div className="boot-row" />
          <div className="boot-row" />
        </div>
      </div>
    </div>
  );
}
