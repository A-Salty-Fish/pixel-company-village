"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/animation";
import { KINDNESS_MENU, type KindnessMenuId } from "@/lib/copy";
import { fishRatio, signalTag, taskRatio, workRatio } from "@/lib/interactions";
import { GARDEN_CROPS } from "@/lib/play-systems";
import type { PersonWithState } from "@/lib/types";
import { messageSparkCount, RING_CLOSE, ringClosure, type Availability } from "@/lib/village-life";

type Props = {
  person: PersonWithState;
  dataDateLabel: string;
  dataDateDetail: string;
  disclaimer: string;
  line: string | null;
  waveHint: string;
  kindnessNote: string;
  sundayNote: string | null;
  hideScores: boolean;
  isSelf: boolean;
  availability: Availability;
  history: HistoryDayView[];
  historySource: string;
  recordedDays: number;
  today: string;
  canKindness: boolean;
  canWave: boolean;
  hasIdentity: boolean;
  undoSeconds: number;
  stickerLabels: string[];
  canSticker: boolean;
  anonNote: string | null;
  gardenCrop: string | null;
  onClose: () => void;
  onKindness: (action: KindnessMenuId) => void;
  onWave: () => void;
  onUndo: () => void;
  onSticker: () => void;
  onGarden: (crop: string) => void;
  onSecret: () => void;
};

export type HistoryDayView = {
  date: string;
  present: boolean;
  scored: boolean | null;
  work: number | null;
  fish: number | null;
  on_task: number | null;
  msgs: number | null;
};

export function SignalCard(props: Props) {
  const [menu, setMenu] = useState<"closed" | "pick" | KindnessMenuId>("closed");
  const [secretAsk, setSecretAsk] = useState(false);

  const person = props.person;
  const showScores = person.scored && (!props.hideScores || props.isSelf);
  const rings = ringClosure(person);
  const pending = KINDNESS_MENU.find((item) => item.id === menu);
  return (
    <aside
      className="signal-card hud-panel overflow-hidden"
      data-signal-card={props.person.scored ? "scored" : "unscored"}
      data-testid="signal-card"
    >
      <div className="hud-title flex items-center justify-between gap-2">
        <span>信号卡</span>
        <button type="button" className="hud-icon" onClick={props.onClose} aria-label="关闭信号卡">
          ×
        </button>
      </div>
      <div className="signal-actions" data-testid="signal-actions">
        <button
          type="button"
          className="hud-btn"
          onClick={() => setMenu((current) => (current === "closed" ? "pick" : "closed"))}
          data-play-interaction
          disabled={!props.hasIdentity || !props.canKindness}
        >
          今日互动
        </button>
        <button
          type="button"
          className="hud-btn hud-btn-ghost"
          onClick={props.onWave}
          data-wave
          disabled={!props.hasIdentity || !props.canWave}
        >
          挥手
        </button>
        <p className="text-xs text-[#6a3d18]" data-wave-note>
          {props.waveHint}
        </p>
      </div>
      <div className="space-y-3 px-3 py-3">
        {menu === "pick" ? (
          <div className="kindness-menu" data-testid="kindness-menu">
            <p className="pixel-label text-[#2a1a10]">先选一种关照，确认后才扣次数。</p>
            <div className="flex flex-wrap gap-2">
              {KINDNESS_MENU.map((item) => (
                <button key={item.id} type="button" className="hud-btn hud-btn-ghost" onClick={() => setMenu(item.id)}>
                  {item.label}
                </button>
              ))}
              <button type="button" className="hud-btn hud-btn-ghost" onClick={() => setMenu("closed")}>
                先不用
              </button>
            </div>
          </div>
        ) : null}
        {pending ? (
          <div className="kindness-menu" data-testid="kindness-confirm">
            <p className="pixel-label text-[#2a1a10]">{pending.confirm}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="hud-btn"
                onClick={() => {
                  props.onKindness(pending.id);
                  setMenu("closed");
                }}
              >
                确认关照
              </button>
              <button type="button" className="hud-btn hud-btn-ghost" onClick={() => setMenu("pick")}>
                返回
              </button>
            </div>
          </div>
        ) : null}
        {props.undoSeconds > 0 ? (
          <p className="hud-stat pixel-label text-[#2a1a10]" data-testid="kindness-undo">
            刚才消耗了 1 次善意。
            <button type="button" className="hud-btn hud-btn-ghost ml-2" onClick={props.onUndo}>
              撤销（{props.undoSeconds}秒）
            </button>
          </p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="pixel-title text-[#2a1a10]">{props.person.name}</h2>
          <span className="hud-chip">{props.person.scored ? STATE_LABELS[props.person.state] : "未评分"}</span>
        </div>
        <p className="pixel-label text-[#6a3d18]" data-testid="data-date">
          {props.dataDateLabel}。{props.dataDateDetail}
        </p>
        <p className="flex items-center gap-2 text-xs text-[#4a3a28]" data-availability={props.availability.label}>
          <span className={`avail-dot avail-${props.availability.tone}`} aria-hidden />
          <span>{props.person.scored ? props.availability.label : "人在村里"}</span>
        </p>

        {showScores && person.scored ? (
          <>
            <p className="pixel-label text-[#6a3d18]">人话标签 · {signalTag(person.work, person.fish, person.on_task)}</p>
            <div className="signal-tray" data-activity-rings>
              <Ring label="干活" ratio={workRatio(person.work)} closed={rings.work} tone="work" hint="0–3" />
              <Ring label="摸鱼" ratio={fishRatio(person.fish)} closed={rings.fish} tone="fish" hint="0–3" />
              <Ring label="在任务上" ratio={taskRatio(person.on_task)} closed={rings.task} tone="task" hint="0–1" />
            </div>
            <p className="text-[11px] leading-5 text-[#6a3d18]">
              环合上的线：干活 {Math.round(RING_CLOSE.work * 100)}%，摸鱼 {Math.round(RING_CLOSE.fish * 100)}%，在任务上{" "}
              {Math.round(RING_CLOSE.task * 100)}%。合上的环会在田边留一朵花，粒子有上限。
            </p>
            <div className="hud-stat flex items-baseline justify-between gap-3" data-msg-spark>
              <div>
                <div className="pixel-label text-[#6a3d18]">消息火花</div>
                <div className="text-[11px] text-[#6a3d18]/80">只计条数，不是第四环，没有聊天原文</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="spark-row" aria-hidden>
                  {"✦".repeat(messageSparkCount(person.msgs))}
                </span>
                <span className="pixel-title text-[#2a1a10]">{person.msgs}</span>
              </div>
            </div>
          </>
        ) : person.scored && props.hideScores ? (
          <p className="pixel-label text-[#4a3a28]">别人的分数先收起来了。把自己选进「我是谁」后，自己的卡仍然完整。</p>
        ) : (
          <p className="pixel-label text-[#4a3a28]">名册里有这个人，这一评分日没有三项雷达数字，不会编造。</p>
        )}

        {showScores || !person.scored ? (
          <HistoryWindow days={props.history} source={props.historySource} recordedDays={props.recordedDays} today={props.today} />
        ) : null}

        <p className="text-xs text-[#6a3d18]" data-kindness-quota>
          {props.kindnessNote}
        </p>
        {props.sundayNote ? (
          <p className="hud-stat pixel-label text-[#2a1a10]" data-testid="sunday-bonus">
            {props.sundayNote}
          </p>
        ) : null}
        {props.anonNote ? <p className="hud-stat pixel-label text-[#2a1a10]">{props.anonNote}</p> : null}
        {props.line ? (
          <p className="hud-stat pixel-label text-[#2a1a10]" data-event-line>
            {props.line}
          </p>
        ) : (
          <p className="text-xs leading-5 text-[#6a3d18]">再点一次这个人：点头，坐下，再吓一跳。不消耗关照。</p>
        )}

        {props.isSelf && props.stickerLabels.length > 0 ? (
          <p className="pixel-label text-[#6a3d18]" data-testid="sticker-row">
            我的贴纸：{props.stickerLabels.join("、")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="hud-btn hud-btn-ghost" onClick={props.onSticker} disabled={!props.hasIdentity || !props.canSticker}>
            揭一张贴纸
          </button>
          <button
            type="button"
            className="hud-btn hud-btn-ghost"
            onClick={() => setSecretAsk(true)}
            disabled={!props.hasIdentity || !props.canKindness}
          >
            匿名投喂
          </button>
        </div>
        {secretAsk ? (
          <div className="kindness-menu" data-testid="secret-confirm">
            <p className="pixel-label">确认匿名留下一杯咖啡？会计入今天的关照，记录里不写是谁。</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="hud-btn"
                onClick={() => {
                  setSecretAsk(false);
                  props.onSecret();
                }}
              >
                确认投喂
              </button>
              <button type="button" className="hud-btn hud-btn-ghost" onClick={() => setSecretAsk(false)}>
                先不用
              </button>
            </div>
          </div>
        ) : null}
        <div data-testid="garden-layer">
          <p className="pixel-label text-[#6a3d18]">私人花园第二层{props.gardenCrop ? `：${cropLabel(props.gardenCrop)}` : ""}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {GARDEN_CROPS.map((crop) => (
              <button
                key={crop.id}
                type="button"
                className="hud-btn hud-btn-ghost"
                disabled={!props.hasIdentity}
                onClick={() => props.onGarden(crop.id)}
              >
                种{crop.label}
              </button>
            ))}
          </div>
        </div>
        <p className="disclaimer-banner">{props.disclaimer}</p>
      </div>
    </aside>
  );
}

function cropLabel(id: string) {
  return GARDEN_CROPS.find((crop) => crop.id === id)?.label ?? id;
}

function Ring({
  label,
  ratio,
  closed,
  tone,
  hint,
}: {
  label: string;
  ratio: number;
  closed: boolean;
  tone: "work" | "fish" | "task";
  hint: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (pct / 100);
  return (
    <div className="ring-item" data-ring={tone} data-closed={closed ? "1" : "0"}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={radius} className="ring-track" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          className={`ring-value ring-${tone}`}
          strokeDasharray={`${dash} ${circ - dash}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="pixel-label text-[#2a1a10]">{label}</div>
      <div className="text-[11px] text-[#6a3d18]">
        {pct}% · {hint}
        {closed ? " · 合上" : ""}
      </div>
    </div>
  );
}

function HistoryWindow({
  days,
  source,
  recordedDays,
  today,
}: {
  days: HistoryDayView[];
  source: string;
  recordedDays: number;
  today: string;
}) {
  const windowDays = days.length || 30;
  const ticks = days.filter((day, index) => index % 10 === 0 || index === days.length - 1);
  return (
    <div data-testid="history-window" data-history-source={source} data-recorded-days={recordedDays}>
      <div className="pixel-label mb-1 text-[#6a3d18]">近 {windowDays} 日数值</div>
      <div className="history-grid" aria-label="近 30 日数值，只在这张卡上">
        {days.map((day) => (
          <span
            key={day.date}
            className={`garden-cell garden-${day.present ? cellLevel(day) : "empty"}${day.date === today ? " history-today" : ""}`}
            title={dayTitle(day, today)}
            data-history-day={day.date}
            data-history-present={day.present ? "1" : "0"}
            data-history-today={day.date === today ? "1" : "0"}
          />
        ))}
      </div>
      <div className="history-axis" data-testid="history-axis">
        {ticks.map((day) => (
          <span key={day.date} data-axis-date={day.date}>
            {day.date.slice(5)}
            {day.date === today ? " 今天" : ""}
          </span>
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#2a1a10]">
        {days
          .filter((day) => day.present)
          .map((day) => (
            <li key={day.date}>{dayTitle(day, today)}</li>
          ))}
      </ul>
      <p className="mt-1 text-[11px] leading-5 text-[#6a3d18]">
        空格不是 0 分，是这一天没有录入。这张表只在打开的信号卡上，不铺到全村地图。
        {recordedDays <= 1
          ? ` 近 ${windowDays} 天里只有 ${recordedDays} 天有数字。更密的格子要等以后多日录入，记在这台浏览器里。`
          : " 这些数字只留在这台浏览器里。"}
      </p>
    </div>
  );
}

function cellLevel(day: HistoryDayView) {
  if (!day.scored || day.work === null || day.fish === null || day.on_task === null) return 0;
  const avg = (Math.min(1, day.work / 3) + Math.min(1, day.fish / 3) + Math.min(1, day.on_task)) / 3;
  if (avg >= 0.75) return 4;
  if (avg >= 0.5) return 3;
  if (avg >= 0.25) return 2;
  if (avg > 0) return 1;
  return 0;
}

function dayTitle(day: HistoryDayView, today: string) {
  const mark = day.date === today ? "今天" : day.date;
  if (!day.present) return `${mark} · 没有录入`;
  if (!day.scored || day.work === null || day.fish === null || day.on_task === null) {
    return `${mark} · 这一天没有评分`;
  }
  return `${mark} · 干活 ${day.work.toFixed(2)} · 摸鱼 ${day.fish.toFixed(2)} · 在任务上 ${day.on_task.toFixed(2)} · 消息 ${day.msgs ?? 0}`;
}
