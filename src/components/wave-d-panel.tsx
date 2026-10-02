"use client";

import { drawerHomeSwitch, mapHomeAria, mapHomeFace } from "@/features/one-home-word/one-home-word";
import { LANE_ACTS, type LaneActId } from "@/lib/lane";
import { YARD_ACTS, type YardActId } from "@/lib/yard";
import {
  CANNED_DIARY,
  INSTRUMENTS,
  WAVE_LABELS,
  WAVE_SYSTEMS,
  atlasRatio,
  diaryLine,
  postcardMeta,
  weekBoard,
  type WeekFacts,
  weekChores,
  choreStatusCopy,
  type WeekMark,
  type WaveDBlob,
  type WaveSystemId,
} from "@/lib/wave-d";

type Props = {
  selfName: string | null;
  wave: WaveDBlob;
  weekKey: string;
  ymd: string;
  quoteUnlocked: number;
  quoteTotal: number;
  names: string[];
  line: string | null;
  facts: WeekFacts;
  marks?: WeekMark | null;
  reduced: boolean;
  onReduceMotion: (on: boolean) => void;
  onToggle: (id: WaveSystemId, on: boolean) => void;
  onDiary: (index: number) => void;
  onPorch: () => void;
  onWater: () => void;
  onBench: () => void;
  pinHint?: string;
  onPin: (name: string) => void;
  onHat: (name: string) => void;
  onInstrument: (id: string | null) => void;
  onHome: () => void;
  onPostcard: () => void;
  onYard: (id: YardActId) => void;
  onLane: (id: LaneActId) => void;
};

export function WaveDPanel(props: Props) {
  const board = weekBoard(props.weekKey);
  const chores = weekChores(props.weekKey, props.facts, props.marks);
  const diary = diaryLine(props.wave);
  const progress = atlasRatio(props.quoteUnlocked, props.quoteTotal);
  const card = postcardMeta(props.selfName, props.ymd);
  return (
    <details className="hud-panel" data-testid="wave-d-panel">
      <summary className="hud-title cursor-pointer">村里新事</summary>
      <div className="space-y-4 px-3 py-3 text-sm text-[#2a1a10]">
        <p className="text-xs leading-5 text-[#6a3d18]">这些都留在这台浏览器，可以关掉。不收录说过的话，也不跟别人比。</p>
        <section data-testid="wave-toggles">
          <h3 className="pixel-label">开关</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={props.reduced}
                onChange={(event) => props.onReduceMotion(event.target.checked)}
                data-testid="reduce-motion-toggle"
              />
              <span>减动开关</span>
            </label>
            {WAVE_SYSTEMS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={props.wave.toggles[id]}
                  onChange={(event) => props.onToggle(id, event.target.checked)}
                  data-wave-toggle={id}
                />
                <span>{id === "home" ? drawerHomeSwitch() : WAVE_LABELS[id]}</span>
              </label>
            ))}
          </div>
        </section>

        <section data-testid="week-board">
          <h3 className="pixel-label">{board.title}</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">{board.note}</p>
          <ul className="mt-1 space-y-1 text-xs" data-testid="week-chores">
            {chores.map((item) => (
              <li key={item.label} data-chore={item.label} data-done={item.done ? "1" : "0"}>
                {choreStatusCopy(item.label, item.done, props.facts.steps)}
              </li>
            ))}
          </ul>
        </section>

        <section data-testid="canned-diary">
          <h3 className="pixel-label">今日一句</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">{diary ?? "还没选。只能选罐头，不能自己写。"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CANNED_DIARY.map((line, index) => (
              <button
                key={line}
                type="button"
                className="hud-btn hud-btn-ghost"
                disabled={!props.selfName}
                data-testid={`diary-${index}`}
                onClick={() => props.onDiary(index)}
              >
                {line}
              </button>
            ))}
          </div>
        </section>

        <section data-testid="pin-board">
          <h3 className="pixel-label">收藏名牌 {props.wave.pins.length}/3</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {props.names.slice(0, 8).map((name) => (
              <button
                key={name}
                type="button"
                className="hud-btn hud-btn-ghost"
                disabled={!props.selfName}
                data-pin={name}
                aria-pressed={props.wave.pins.includes(name)}
                onClick={() => props.onPin(name)}
              >
                {props.wave.pins.includes(name) ? `已钉 ${name}` : name}
              </button>
            ))}
          </div>
          {props.pinHint ? (
            <p className="mt-2 text-xs text-[#8a2020]" data-testid="pin-hint">
              {props.pinHint}
            </p>
          ) : null}
        </section>

        <section data-testid="hat-board">
          <h3 className="pixel-label">生日帽</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">手动勾选，只在这台电脑上显示。</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {props.names.slice(0, 6).map((name) => (
              <button key={name} type="button" className="hud-btn hud-btn-ghost" disabled={!props.selfName} onClick={() => props.onHat(name)}>
                {props.wave.hats.includes(name) ? `帽 ${name}` : name}
              </button>
            ))}
          </div>
        </section>

        <section data-testid="yard-acts">
          <h3 className="pixel-label">院里小事</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">只做罐头动作，记在这个人身上。铃和穗最多三次。</p>
          <div className="yard-acts mt-2">
            {YARD_ACTS.map((act) => (
              <button
                key={act.id}
                type="button"
                className="hud-btn hud-btn-ghost yard-chip"
                disabled={!props.selfName || !props.wave.toggles.yard}
                data-testid={`yard-${act.id}`}
                data-yard-act={act.id}
                onClick={() => props.onYard(act.id)}
              >
                {act.label}
                {act.id === "bell" ? ` ${props.wave.yard.bell}/3` : ""}
                {act.id === "grain" ? ` ${props.wave.yard.grain}/3` : ""}
              </button>
            ))}
          </div>
        </section>

        <section data-testid="lane-acts">
          <h3 className="pixel-label">路边小事</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">只做罐头动作。石头和鸭子最多三次。</p>
          <div className="yard-acts mt-2">
            {LANE_ACTS.map((act) => (
              <button
                key={act.id}
                type="button"
                className="hud-btn hud-btn-ghost yard-chip lane-chip"
                disabled={!props.selfName || !props.wave.toggles.lane}
                data-testid={`lane-${act.id}`}
                data-lane-act={act.id}
                onClick={() => props.onLane(act.id)}
              >
                {act.label}
                {act.id === "stone" ? ` ${props.wave.lane.stone}/3` : ""}
                {act.id === "ducks" ? ` ${props.wave.lane.ducks}/3` : ""}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-2" data-testid="wave-actions">
          <button type="button" className="hud-btn" disabled={!props.selfName} onClick={props.onPorch}>
            {props.wave.porch ? "关上灯" : "点门灯"}
          </button>
          <button type="button" className="hud-btn" disabled={!props.selfName} onClick={props.onWater} data-testid="water-crop">
            浇自己的田
          </button>
          <button type="button" className="hud-btn hud-btn-ghost" disabled={!props.selfName} onClick={props.onBench} data-testid="sit-bench">
            {props.wave.sit ? "起身" : "坐长椅"}
          </button>
          <button type="button" className="hud-btn" disabled={!props.selfName} onClick={props.onHome} data-testid="go-home" aria-label={mapHomeAria()}>
            {mapHomeFace()}
          </button>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={props.onPostcard} data-testid="save-postcard">
            存明信片
          </button>
        </section>
        <p className="text-xs text-[#6a3d18]" data-testid="postcard-note">
          {card.caption}。只下载到这台电脑，不上传。
        </p>

        <section data-testid="instrument-row">
          <h3 className="pixel-label">迷你乐器 · 没有声音</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {INSTRUMENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="hud-btn hud-btn-ghost"
                disabled={!props.selfName}
                onClick={() => props.onInstrument(props.wave.instrument === item.id ? null : item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section data-testid="atlas-meter">
          <h3 className="pixel-label">图鉴 {Math.round(progress * 100)}%</h3>
          <div className="meter-track mt-1" aria-label={`图鉴进度 ${Math.round(progress * 100)}%`}>
            <div className="meter-fill meter-work" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </section>

        <section data-testid="chronicle">
          <h3 className="pixel-label">村史 · 只记条数</h3>
          {props.wave.chronicle.length === 0 ? (
            <p className="mt-1 text-xs text-[#6a3d18]">还没有记下打开、关照或评分的次数。</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs">
              {props.wave.chronicle.slice(-6).map((event) => (
                <li key={`${event.date}-${event.kind}`}>
                  {event.date} · {event.kind === "visit" ? "打开" : event.kind === "kindness" ? "关照" : "评分"} {event.n} 次
                </li>
              ))}
            </ul>
          )}
        </section>
        {props.line ? (
          <p className="text-xs text-[#6a3d18]" data-testid="wave-line">
            {props.line}
          </p>
        ) : null}
      </div>
    </details>
  );
}
