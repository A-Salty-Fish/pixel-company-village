"use client";

import { STATE_LABELS } from "@/lib/animation";
import { fishRatio, signalTag, taskRatio, workRatio } from "@/lib/interactions";
import type { PersonWithState } from "@/lib/types";
import {
  messageSparkCount,
  RING_CLOSE,
  ringClosure,
  type Availability,
} from "@/lib/village-life";

type Props = {
  person: PersonWithState;
  disclaimer: string;
  line: string | null;
  waveNote: string | null;
  kindnessNote: string;
  sundayNote: string | null;
  hideScores: boolean;
  isSelf: boolean;
  availability: Availability;
  history: HistoryDayView[];
  historySource: string;
  recordedDays: number;
  canKindness: boolean;
  canWave: boolean;
  hasIdentity: boolean;
  onPlay: () => void;
  onWave: () => void;
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

export function SignalCard({
  person,
  disclaimer,
  line,
  waveNote,
  kindnessNote,
  sundayNote,
  hideScores,
  isSelf,
  availability,
  history,
  historySource,
  recordedDays,
  canKindness,
  canWave,
  hasIdentity,
  onPlay,
  onWave,
}: Props) {
  const showScores = person.scored && (!hideScores || isSelf);
  const rings = ringClosure(person);
  return (
    <aside
      className="hud-panel overflow-hidden"
      data-signal-card={person.scored ? "scored" : "unscored"}
      data-testid="signal-card"
    >
      <div className="hud-title">今日信号卡</div>
      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="pixel-title text-[#2a1a10]">{person.name}</h2>
          <span className="hud-chip">{person.scored ? STATE_LABELS[person.state] : "今日暂无评分"}</span>
        </div>

        <p className="flex items-center gap-2 text-xs text-[#4a3a28]" data-availability={availability.label}>
          <span className={`avail-dot avail-${availability.tone}`} aria-hidden />
          <span>{availability.label}</span>
        </p>

        {showScores ? (
          <>
            <p className="pixel-label text-[#6a3d18]">人话标签 · {signalTag(person.work, person.fish, person.on_task)}</p>
            <div className="flex flex-wrap items-end gap-4" data-activity-rings>
              <Ring label="干活" ratio={workRatio(person.work)} closed={rings.work} tone="work" hint="0–3" />
              <Ring label="摸鱼" ratio={fishRatio(person.fish)} closed={rings.fish} tone="fish" hint="0–3" />
              <Ring label="在任务上" ratio={taskRatio(person.on_task)} closed={rings.task} tone="task" hint="0–1" />
            </div>
            <p className="text-[11px] leading-5 text-[#6a3d18]">
              环合上的线：干活 {Math.round(RING_CLOSE.work * 100)}%，摸鱼 {Math.round(RING_CLOSE.fish * 100)}%，在任务上{" "}
              {Math.round(RING_CLOSE.task * 100)}%。合上的环会在田边开一点花。
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
        ) : person.scored && hideScores ? (
          <p className="pixel-label text-[#4a3a28]">别人的分数先收起来了。把自己选进「我是谁」后，自己的卡仍然完整。</p>
        ) : (
          <p className="pixel-label text-[#4a3a28]">今日暂无评分。名册上有这个人，但没有 work / fish / on_task，不会编造。</p>
        )}

        {showScores || !person.scored ? (
          <HistoryWindow days={history} source={historySource} recordedDays={recordedDays} />
        ) : null}

        <p className="disclaimer-banner">{disclaimer}</p>
        <p className="text-xs text-[#6a3d18]" data-kindness-quota>
          {kindnessNote}
        </p>
        {sundayNote ? <p className="hud-stat pixel-label text-[#2a1a10]">{sundayNote}</p> : null}

        {line ? (
          <p className="hud-stat pixel-label text-[#2a1a10]" data-event-line>
            {line}
          </p>
        ) : (
          <p className="text-xs leading-5 text-[#6a3d18]">再点一次这个人：点头，坐下，再吓一跳。</p>
        )}
        {waveNote ? (
          <p className="text-xs text-[#6a3d18]" data-wave-note>
            {waveNote}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="hud-btn" onClick={onPlay} data-play-interaction disabled={!hasIdentity || !canKindness}>
            今日互动
          </button>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={onWave} data-wave disabled={!hasIdentity || !canWave}>
            挥手
          </button>
        </div>
      </div>
    </aside>
  );
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
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (pct / 100);
  return (
    <div className="ring-item" data-ring={tone} data-closed={closed ? "1" : "0"}>
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={radius} className="ring-track" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          className={`ring-value ring-${tone}`}
          strokeDasharray={`${dash} ${circ - dash}`}
          transform="rotate(-90 24 24)"
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
}: {
  days: HistoryDayView[];
  source: string;
  recordedDays: number;
}) {
  const windowDays = days.length || 30;
  return (
    <div data-testid="history-window" data-history-source={source} data-recorded-days={recordedDays}>
      <div className="pixel-label mb-1 text-[#6a3d18]">近 {windowDays} 日数值</div>
      <div className="history-grid" aria-label="近 30 日数值，只在这张卡上">
        {days.map((day) => (
          <span
            key={day.date}
            className={`garden-cell garden-${day.present ? cellLevel(day) : "empty"}`}
            title={dayTitle(day)}
            data-history-day={day.date}
            data-history-present={day.present ? "1" : "0"}
          />
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#2a1a10]">
        {days
          .filter((day) => day.present)
          .map((day) => (
            <li key={day.date}>{dayTitle(day)}</li>
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

function dayTitle(day: HistoryDayView) {
  if (!day.present) return `${day.date} · 没有录入`;
  if (!day.scored || day.work === null || day.fish === null || day.on_task === null) {
    return `${day.date} · 这一天没有评分`;
  }
  return `${day.date} · 干活 ${day.work.toFixed(2)} · 摸鱼 ${day.fish.toFixed(2)} · 在任务上 ${day.on_task.toFixed(2)} · 消息 ${day.msgs ?? 0}`;
}
