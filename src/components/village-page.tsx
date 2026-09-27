"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { STATE_LABELS, STATE_ORDER, withStates } from "@/lib/animation";
import {
  blockedKindnessFx,
  isKindnessKind,
  jokeFx,
  rollOpeningEvent,
  rollPlayEvent,
  waveFx,
  type VillageFx,
} from "@/lib/interactions";
import type { PersonWithState, ScorePayload } from "@/lib/types";
import { ComfortSettings } from "@/components/comfort-settings";
import { installVillageTestHook, testHooksEnabled, type VillageTestState } from "@/lib/test-hooks";
import { waveExhaustedLine } from "@/lib/quota-rules";
import { SignalCard } from "@/components/signal-card";
import { VillageScene } from "@/components/village-scene";
import {
  availabilityFor,
  festivalOf,
  getPrefSnapshot,
  getServerPrefSnapshot,
  hydratePrefs,
  kindnessStatus,
  localScoreHistory,
  motionGovernor,
  nextFestival,
  recordGarden,
  recordScoreHistory,
  saveComfort,
  saveSelf,
  seasonOf,
  setAnimationsFrozen,
  setTestClock,
  shanghaiClock,
  spendKindness,
  spendWave,
  waveStatus,
  subscribePrefs,
  subscribeSystemReduced,
  systemReducedSnapshot,
  sundayGlowNames,
  teamTotals,
  type Comfort,
  type SceneLife,
  type StatusId,
} from "@/lib/village-life";

type Props = {
  initial: ScorePayload;
};

export function VillagePage({ initial }: Props) {
  const router = useRouter();
  const [payload, setPayload] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [fx, setFx] = useState<VillageFx | null>(null);
  const [jokeStep, setJokeStep] = useState<Record<string, number>>({});
  const prefs = useSyncExternalStore(subscribePrefs, getPrefSnapshot, getServerPrefSnapshot);
  const comfort = prefs.comfort;
  const selfName = prefs.selfName;
  const preset = prefs.preset;
  const [waveNote, setWaveNote] = useState<string | null>(null);
  const [clock, setClock] = useState(() => shanghaiClock());
  const [, setFreezeTick] = useState(0);
  const systemReduced = useSyncExternalStore(subscribeSystemReduced, systemReducedSnapshot, () => false);
  const people = useMemo(() => withStates(payload.people), [payload.people]);
  const selected = people.find((person) => person.name === selectedName) ?? null;
  const history =
    selected && prefs.rev > 0
      ? localScoreHistory(selected.name, clock.ymd)
      : { days: [], recordedDays: 0, source: "local" as const };
  const scoredCount = people.filter((person) => person.scored).length;
  const placeholderCount = people.length - scoredCount;

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("load_failed");
      setPayload((await res.json()) as ScorePayload);
    } catch {
      setError("分数暂时读不到，稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    hydratePrefs();
    const seeded = withStates(initial.people);
    recordGarden(initial.date, seeded);
    recordScoreHistory({ date: initial.date, people: seeded, disclaimer: initial.disclaimer });
    const id = window.setInterval(() => setClock(shanghaiClock()), 60_000);
    return () => window.clearInterval(id);
  }, [initial]);

  useEffect(() => {
    recordGarden(payload.date, people);
    recordScoreHistory({ date: payload.date, people, disclaimer: payload.disclaimer });
  }, [payload, people]);

  const season = seasonOf(clock);
  const festival = festivalOf(clock);
  const motion = motionGovernor({ systemReduced, comfort });
  const life: SceneLife = {
    quiet: comfort.quiet,
    reduceMotion: motion.reduced,
    seasonTint: season.tint,
    festival: Boolean(festival),
    glyphsOn: motion.glyphs,
    selfName,
    selfPreset: preset,
    sundayGlow:
      prefs.rev > 0
        ? sundayGlowNames(
            people.map((person) => person.name),
            clock,
          )
        : [],
  };

  function resolveKindness(target: string) {
    const spent = spendKindness(target);
    if (!spent.ok) return { ok: false as const, line: spent.line, sundayBonus: false };
    return { ok: true as const, line: "", sundayBonus: spent.sundayBonus };
  }

  function applyKindness(event: VillageFx | null) {
    if (!event || !isKindnessKind(event.kind)) return event;
    const spent = resolveKindness(event.actor);
    if (!spent.ok) {
      if (!selfName) return null;
      return blockedKindnessFx(event.actor, spent.line);
    }
    if (spent.sundayBonus) {
      return { ...event, line: `${event.line} 周日的田边多亮了一下。` };
    }
    return event;
  }

  function selectOnly(name: string | null) {
    setSelectedName(name);
    if (name !== selectedName) setWaveNote(null);
  }

  async function pick(name: string | null) {
    if (!name) {
      setSelectedName(null);
      return;
    }
    if (name === selectedName) {
      const step = jokeStep[name] ?? 0;
      setJokeStep((current) => ({ ...current, [name]: step + 1 }));
      setFx(jokeFx(name, step));
      return;
    }
    setSelectedName(name);
    setWaveNote(null);
    setFx(applyKindness(rollOpeningEvent(name, people)));
  }

  function play() {
    if (!selected) return;
    setFx(applyKindness(rollPlayEvent(selected.name, people)));
  }

  function wave() {
    if (!selected) return;
    if (!selfName) {
      setWaveNote("先在体贴设置里选定「我是谁」。挥手记在这个名字上。");
      return;
    }
    const spent = spendWave(selected.name);
    if (!spent.ok) {
      setWaveNote(spent.line);
      return;
    }
    setWaveNote(waveExhaustedLine(60));
    setFx(waveFx(selected.name));
  }

  function updateComfort(next: Comfort) {
    saveComfort(next);
  }

  function updateSelf(name: string | null, nextPreset: StatusId | null) {
    saveSelf(name, name ? nextPreset : null);
  }

  const pickRef = useRef(pick);
  const selectRef = useRef(selectOnly);
  const kindnessRef = useRef(resolveKindness);
  const stateRef = useRef<VillageTestState>({
    ready: false,
    rosterNames: [],
    selectedName: null,
    scored: {},
    season: season.id,
    festival: null,
    comfort: { quiet: false, hideScores: false, reduceMotion: false },
    selfName: null,
  });

  useEffect(() => {
    pickRef.current = pick;
    selectRef.current = selectOnly;
    kindnessRef.current = resolveKindness;
    stateRef.current = {
      ready: true,
      rosterNames: people.map((person) => person.name),
      selectedName,
      scored: Object.fromEntries(people.map((person) => [person.name, person.scored])),
      season: season.id,
      festival: festival?.label ?? null,
      comfort: {
        quiet: comfort.quiet,
        hideScores: comfort.hideScores,
        reduceMotion: motion.reduced,
      },
      selfName,
    };
  });

  useEffect(() => {
    if (!testHooksEnabled()) return;
    return installVillageTestHook({
      getState: () => stateRef.current,
      selectVillager: (name) => selectRef.current(name),
      playKindness: (name) => {
        selectRef.current(name);
        const spent = kindnessRef.current(name);
        setFx(spent.ok ? null : blockedKindnessFx(name, spent.line));
        return Promise.resolve({ ok: spent.ok, line: spent.line });
      },
      freezeAnimations: (on = true) => {
        setAnimationsFrozen(on);
        setFreezeTick((value) => value + 1);
      },
      setClock: (iso) => {
        setTestClock(iso);
        setClock(shanghaiClock());
      },
    });
  }, []);

  return (
    <div className="farm-page mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-5">
      <header className="hud-panel overflow-hidden">
        <div className="hud-title">像素公司村</div>
        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.22em] text-[#8a5528]">COZY COMPANY FARM</p>
            <p className="text-sm text-[#4a3a28]">
              {payload.date} 的趣味雷达 · 今日评分 {scoredCount} 人
              {placeholderCount > 0 ? ` · 未评分 ${placeholderCount} 人` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="hud-btn" onClick={refresh} disabled={loading}>
              {loading ? "回村中…" : "刷新今日分数"}
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={logout}>
              出村
            </button>
          </div>
        </div>
      </header>

      <div className="disclaimer-banner">{payload.disclaimer}</div>
      <SeasonBanner seasonLabel={season.label} seasonId={season.id} festival={festival} people={people} />

      {error ? <p className="hud-panel px-3 py-2 text-sm text-[#8a2020]">{error}</p> : null}

      <ComfortSettings
        comfort={comfort}
        selfName={selfName}
        preset={preset}
        names={people.map((person) => person.name)}
        onComfort={updateComfort}
        onSelf={updateSelf}
        motionReduced={motion.reduced}
      />

      <VillageScene people={people} selectedName={selectedName} fx={fx} life={life} onSelect={pick} />

      {selected ? (
        <SignalCard
          person={selected}
          disclaimer={payload.disclaimer}
          line={fx && fx.actor === selected.name ? fx.line : null}
          waveNote={waveNote ?? waveBlockedLine(selected.name, selfName)}
          kindnessNote={prefs.rev > 0 ? kindnessLine(selected.name, clock) : "关照：今日 0/1 · 本周 0/2"}
          sundayNote={
            prefs.rev > 0 && kindnessStatus(selected.name, clock).sundayBonus
              ? "这周两次关照都用上了，周日田边会多亮一下。"
              : null
          }
          hideScores={comfort.hideScores}
          isSelf={selected.name === selfName}
          availability={availabilityFor(selected, clock, selected.name === selfName ? preset : null)}
          history={history.days}
          historySource={history.source}
          recordedDays={history.recordedDays}
          canKindness={kindnessStatus(selected.name, clock).canSend}
          canWave={Boolean(selfName) && waveStatus(selected.name).allowed}
          hasIdentity={Boolean(selfName)}
          onPlay={play}
          onWave={wave}
        />
      ) : (
        <p className="px-1 text-sm text-[#4a3a28]/90">
          {people.length === 0
            ? "今天还没同事报到。空田没有分数。"
            : `村子按约 100 块田铺开。点小人，或点下面名册；灰色田是未评分，不会编造分数。`}
        </p>
      )}

      <section className="hud-panel overflow-hidden">
        <div className="hud-title">今日田亩名册</div>
        {people.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[#4a3a28]">等评分机器人投喂一条今日分数吧。</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => {
              const active = person.name === selectedName;
              return (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => pick(person.name)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                    active ? "hud-roster hud-roster-on" : "hud-roster"
                  }`}
                >
                  <div>
                    <div className="font-medium text-[#2a1a10]">{person.name}</div>
                    <div className="text-xs text-[#6a3d18]">{rosterLine(person, comfort.hideScores, person.name === selfName)}</div>
                  </div>
                  <span className="hud-chip">{person.scored ? STATE_LABELS[person.state] : "未评分"}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2 pb-6">
        <h2 className="text-sm font-medium text-[#4a3a28]">动画怎么来的</h2>
        <div className="flex flex-wrap gap-2">
          {STATE_ORDER.map((state) => (
            <span key={state} className="hud-chip">
              {STATE_LABELS[state]}
            </span>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#4a3a28]/80">
          小人动作只看当日 work / fish / on_task，消息只计条数。消息特别多时挥锄会稍快一点。
          名册里没有今日分数的人灰着站在自己的田边，点开写着「今日暂无评分」，不会编造分数。这是玩乐雷达，不是评价同事。
        </p>
        <p className="text-xs text-[#6a3d18]">{payload.disclaimer}</p>
        <p className="text-xs leading-5 text-[#6a3d18]/80">
          草地、水、树、房子、悬崖和七色猫咪村民来自 Little Wilds 完整包（Floppy Cat Studios，已购买可商用授权）。作物
          CC0 josehzz。名牌是 Fusion Pixel Font（OFL，TakWolf）。详见 CREDITS.md。
        </p>
      </section>
    </div>
  );
}

function rosterLine(person: PersonWithState, hideScores: boolean, isSelf: boolean): string {
  if (!person.scored) return "未评分";
  if (hideScores && !isSelf) return "分数已收起";
  return `工 ${person.work.toFixed(2)} · 鱼 ${person.fish.toFixed(2)} · 专注 ${person.on_task.toFixed(2)} · ${person.msgs} 条`;
}

function kindnessLine(name: string, clock: ReturnType<typeof shanghaiClock>) {
  const status = kindnessStatus(name, clock, getPrefSnapshot().selfName);
  if (status.needIdentity) return "先选定「我是谁」，关照按这个身份计数。";
  const counts = `关照：今日 ${status.usedToday ? 1 : 0}/1 · 本周 ${Math.min(2, status.weekCount)}/2`;
  if (!status.canSend) {
    return status.usedToday ? `${counts}。今天已经关照过这位同事了。` : `${counts}。这周两次关照都用过了。`;
  }
  return counts;
}

function waveBlockedLine(name: string, selfName: string | null) {
  if (!selfName) return null;
  const status = waveStatus(name, Date.now(), selfName);
  if (!status.allowed) return waveExhaustedLine(status.retryAfterMin);
  return null;
}

function SeasonBanner({
  seasonLabel,
  seasonId,
  festival,
  people,
}: {
  seasonLabel: string;
  seasonId: string;
  festival: { label: string; pa: string } | null;
  people: PersonWithState[];
}) {
  const upcoming = nextFestival();
  const totals = teamTotals(people);
  return (
    <section
      className={`season-banner season-${seasonId}`}
      data-season-banner
      data-testid="season-banner"
      data-season={seasonId}
      data-festival={festival ? festival.label : ""}
    >
      <p className="pixel-label text-[#2a1a10]">
        {seasonLabel}
        {festival ? ` · 今日${festival.label}` : ` · 下一个节日 ${upcoming.label} ${upcoming.monthDay}`}
      </p>
      {festival ? (
        <>
          <p className="mt-1 text-sm text-[#2a1a10]" data-village-pa>
            {festival.pa}
          </p>
          <p className="mt-1 text-xs text-[#4a3a28]">
            全村合计，不排名：干活 {totals.work.toFixed(1)} · 摸鱼 {totals.fish.toFixed(1)} · 在任务上均值{" "}
            {totals.taskMean.toFixed(2)}（{totals.n} 人有分）
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-[#4a3a28]">一年四节：立春 02-04、立夏 05-05、立秋 08-07、立冬 11-07。节日只报全村合计。</p>
      )}
    </section>
  );
}

