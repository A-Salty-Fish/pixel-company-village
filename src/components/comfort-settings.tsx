"use client";

import type { Comfort, StatusId } from "@/lib/village-life";
import { STATUS_PRESETS } from "@/lib/village-life";

type Props = {
  comfort: Comfort;
  selfName: string | null;
  preset: StatusId | null;
  names: string[];
  motionReduced: boolean;
  onComfort: (next: Comfort) => void;
  onSelf: (name: string | null, preset: StatusId | null) => void;
};

export function ComfortSettings({
  comfort,
  selfName,
  preset,
  names,
  motionReduced,
  onComfort,
  onSelf,
}: Props) {
  return (
    <details
      className="hud-panel overflow-hidden"
      data-comfort-settings
      data-testid="comfort-settings"
      data-quota-source="local"
    >
      <summary className="hud-title cursor-pointer">体贴设置</summary>
      <div className="space-y-3 px-3 py-3">
        <p className="text-xs leading-5 text-[#6a3d18]">
          舒适选项存在这台浏览器。先选定「我是谁」，善意、挥手、状态和田历才记在这个显示名上。键是
          viewer:你的显示名。换一台电脑不会同步。不是简单模式。
        </p>
        <label className="flex items-start gap-2 text-sm text-[#2a1a10]">
          <input
            type="checkbox"
            checked={comfort.quiet}
            onChange={(event) => onComfort({ ...comfort, quiet: event.target.checked })}
          />
          <span>安静村子：少一点花瓣和头顶小动作</span>
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
            checked={motionReduced}
            onChange={(event) =>
              onComfort({ ...comfort, reduceMotion: event.target.checked, motionOverride: true })
            }
          />
          <span>减少动作（系统偏好和这个开关合成一个动效治理；勾上后装饰动画停住）</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-[#6a3d18]">
          <input type="checkbox" checked disabled data-testid="mute-stub" />
          <span>环境音保持关闭。这一轮没有声音。</span>
        </label>
        <label className="block space-y-1 text-sm text-[#2a1a10]">
          <span className="pixel-label">我是谁</span>
          <select
            className="hud-select"
            data-testid="self-picker"
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
      </div>
    </details>
  );
}
