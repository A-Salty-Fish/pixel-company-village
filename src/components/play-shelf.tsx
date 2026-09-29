"use client";

import { quoteByIndex } from "@/lib/interactions";
import {
  FESTIVAL_FIELD,
  PROP_ITEMS,
  type MuseumShelf,
  type PlayBlob,
  type VisitDay,
} from "@/lib/play-systems";

type VisitView = {
  days: VisitDay[];
  filled: number;
  goal: number;
  span: number;
  met: boolean;
};

type Props = {
  selfName: string | null;
  play: PlayBlob;
  visit: VisitView;
  museum: MuseumShelf[];
  quoteTotal: number;
  festival: boolean;
  spotlights: string[];
  note: { title: string; lines: [string, string] } | null;
  onProp: (id: string | null) => void;
  onFreeze: () => void;
  onQuote: () => void;
};

export function PlayShelf({ selfName, play, visit, museum, quoteTotal, festival, spotlights, note, onProp, onFreeze, onQuote }: Props) {
  return (
    <details className="hud-panel overflow-hidden" data-testid="play-shelf">
      <summary className="hud-title cursor-pointer">村里的事</summary>
      <div className="space-y-4 px-3 py-3 text-sm text-[#2a1a10]">
        <section data-testid="visit-calendar">
          <h3 className="pixel-label">拜访周历 · 只给你自己看</h3>
          <p className="mt-1 text-xs leading-5 text-[#6a3d18]">
            打开村子并送出一次关照，这一天才算数。{visit.span} 天里满 {visit.goal} 天就好。
            {visit.met ? " 这窗已经满了。" : ` 目前 ${visit.filled}/${visit.goal}。`}
            断了也不公示。
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {visit.days.map((day) => (
              <span key={day.date} className={`hud-chip ${day.counts ? "hud-roster-on" : ""}`} data-visit-day={day.date} data-visit-count={day.counts ? "1" : "0"}>
                {day.date.slice(5)} {day.counts ? "到过" : "空"}
              </span>
            ))}
          </div>
          {selfName && play.freezeTokens > 0 ? (
            <button type="button" className="hud-btn mt-2" onClick={onFreeze}>
              用一枚节日冻结（还剩 {play.freezeTokens}）
            </button>
          ) : (
            <p className="mt-1 text-xs text-[#6a3d18]">节日当天会得一枚冻结，用来补自己周历里的空日。</p>
          )}
        </section>

        <section data-testid="museum-shelf">
          <h3 className="pixel-label">村里博物架</h3>
          <ul className="mt-1 space-y-1 text-xs leading-5">
            {museum.map((shelf) => (
              <li key={shelf.id} data-museum={shelf.id} data-unlocked={shelf.unlocked ? "1" : "0"}>
                {shelf.unlocked ? "已揭" : "未揭"} · {shelf.deco} · {shelf.label}
              </li>
            ))}
          </ul>
        </section>

        <section data-testid="quote-atlas">
          <h3 className="pixel-label">
            村语图鉴 {play.quotes.length}/{quoteTotal}
          </h3>
          <button type="button" className="hud-btn mt-2" onClick={onQuote} disabled={!selfName}>
            收一句罐头村语
          </button>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6a3d18]">
            {Array.from({ length: quoteTotal }, (_, index) => (
              <li key={index}>{play.quotes.includes(index) ? quoteByIndex(index) : "未揭开"}</li>
            ))}
          </ul>
        </section>

        <section data-testid="prop-picker">
          <h3 className="pixel-label">我的地块摆件</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">只摆在你自己的田上，存在这台浏览器。可以清空。</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROP_ITEMS.map((item) => (
              <button key={item.id} type="button" className="hud-btn hud-btn-ghost" disabled={!selfName} onClick={() => onProp(item.id)}>
                {item.label}
              </button>
            ))}
            <button type="button" className="hud-btn hud-btn-ghost" disabled={!selfName} onClick={() => onProp(null)}>
              清空
            </button>
          </div>
        </section>

        <section data-testid="feather-box">
          <h3 className="pixel-label">景观羽毛 {play.feathers.length}/2</h3>
          <p className="mt-1 text-xs text-[#6a3d18]">湖心和山脊各有一处。点到就收下，不排名。</p>
        </section>

        {festival ? (
          <section data-testid="festival-field">
            <h3 className="pixel-label">节日小场</h3>
            <p className="mt-1 text-xs text-[#6a3d18]">没有名次，没有奖品。站一站就好。</p>
            <ul className="mt-1 space-y-1 text-xs">
              {FESTIVAL_FIELD.map((station) => (
                <li key={station.id}>
                  {station.label} · {station.line}
                </li>
              ))}
            </ul>
            {spotlights.length > 0 ? <p className="mt-1 text-xs">今夜灯下：{spotlights.join("、")}。只是站位，不是榜。</p> : null}
          </section>
        ) : null}

        {note ? (
          <section data-testid="gather-vignette">
            <h3 className="pixel-label">{note.title}</h3>
            {note.lines.map((line) => (
              <p key={line} className="text-xs leading-5 text-[#6a3d18]">
                {line}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </details>
  );
}
