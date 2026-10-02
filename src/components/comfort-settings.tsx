"use client";

import type { Comfort, StatusId } from "@/lib/village-life";
import { STATUS_PRESETS } from "@/lib/village-life";
import { SettingsDiscover } from "@/features/compact-settings-discover/discover-badge";
import { LIGHT_SFX_ENABLED } from "@/features/light-sfx/light-sfx";

type Props = {
  comfort: Comfort;
  selfName: string | null;
  preset: StatusId | null;
  names: string[];
  motionReduced: boolean;
  pickerTestId?: string;
  onComfort: (next: Comfort) => void;
  onSelf: (name: string | null, preset: StatusId | null) => void;
};

export function ComfortSettings({
  comfort,
  selfName,
  preset,
  names,
  motionReduced,
  pickerTestId = "self-picker",
  onComfort,
  onSelf,
}: Props) {
  return (
    <>
    {/* compact-settings-discover checkpoint */}
    <SettingsDiscover />
    <details
      className="hud-panel"
      data-comfort-settings
      data-testid="comfort-settings"
      data-quota-source="local"
    >
      <summary className="hud-title cursor-pointer">体贴设置</summary>
      <div className="space-y-3 px-3 py-3">
        <p className="text-xs leading-5 text-[#6a3d18]">
          这些开关存在这台浏览器。我是谁：{selfName ?? "还没选定"}。善意、挥手、状态和田历都记在这个显示名上，换一台电脑不会跟着走。
        </p>
        <details className="comfort-group" open data-testid="comfort-quiet">
          <summary className="pixel-label cursor-pointer">安静</summary>
          <label className="mt-2 flex items-start gap-2 text-sm text-[#2a1a10]">
            <input
              type="checkbox"
              data-testid="quiet-toggle"
              checked={comfort.quiet}
              onChange={(event) => onComfort({ ...comfort, quiet: event.target.checked })}
            />
            <span>安静村子：少一点花瓣、广播和头顶小动作。新来的人默认开着。</span>
          </label>
        </details>
        <details className="comfort-group" data-testid="comfort-decor">
          <summary className="pixel-label cursor-pointer">装饰</summary>
          <div className="mt-2 space-y-3">
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                checked={comfort.ambient}
                onChange={(event) => onComfort({ ...comfort, ambient: event.target.checked })}
              />
              <span>村里氛围：整点广播、晨钟、团聚小段</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                checked={comfort.festivalSkin}
                onChange={(event) => onComfort({ ...comfort, festivalSkin: event.target.checked })}
              />
              <span>节日装饰层</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                checked={comfort.jobLook}
                onChange={(event) => onComfort({ ...comfort, jobLook: event.target.checked })}
              />
              <span>岗位小外观：按当天最高的一项换一把小道具。未评分仍是灰猫。</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                checked={comfort.hideScores}
                onChange={(event) => onComfort({ ...comfort, hideScores: event.target.checked })}
              />
              <span>先收起别人的分数：仍能看名字、挥手和关照。自己的卡保持完整。</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                data-testid="reduce-motion"
                checked={motionReduced}
                onChange={(event) =>
                  onComfort({ ...comfort, reduceMotion: event.target.checked, motionOverride: true })
                }
              />
              <span>减少动作：跟着系统的「减少动态」，也可以在这里强制停住装饰。</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#6a3d18]">
              <input type="checkbox" checked disabled data-testid="mute-stub" />
              <span>环境音保持关闭。这一轮没有声音。</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
              <input
                type="checkbox"
                data-testid="sfx-mute"
                checked={comfort.sfxMuted || !LIGHT_SFX_ENABLED}
                disabled={!LIGHT_SFX_ENABLED}
                onChange={(event) => onComfort({ ...comfort, sfxMuted: event.target.checked })}
              />
              <span>轻声静音：勾上就没有按钮轻点。去掉勾才响一声。少动时也不响。</span>
            </label>
          </div>
        </details>
        <details className="comfort-group" data-testid="comfort-plates">
          <summary className="pixel-label cursor-pointer">名牌</summary>
          <label className="mt-2 flex items-start gap-2 text-sm text-[#2a1a10]">
            <input
              type="checkbox"
              checked={comfort.showAllPlates}
              onChange={(event) => onComfort({ ...comfort, showAllPlates: event.target.checked })}
            />
            <span>远景也显示全部名牌</span>
          </label>
        </details>
        <details className="comfort-group" open>
          <summary className="pixel-label cursor-pointer">我是谁</summary>
          <label className="mt-2 block space-y-1 text-sm text-[#2a1a10]">
          <span className="pixel-label">选择自己的名字</span>
          <select
            className="hud-select"
            data-testid={pickerTestId}
            value={selfName ?? ""}
            onChange={(event) => onSelf(event.target.value || null, preset)}
          >
            <option value="">还没选定</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm text-[#2a1a10]">
          <span className="pixel-label">我的状态</span>
          <select
            className="hud-select"
            value={preset ?? ""}
            disabled={!selfName}
            onChange={(event) => onSelf(selfName, (event.target.value || null) as StatusId | null)}
          >
            <option value="">不挂状态</option>
            {STATUS_PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-[#6a3d18]">只有预设短句，没有自由输入。道具只出现在你选中的自己身上。</span>
        </label>
        </details>
      </div>
    </details>
    </>
  );
}
