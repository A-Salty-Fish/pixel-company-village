"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { STATE_LABELS, STATE_ORDER, withStates } from "@/lib/animation";
import { scoreDateCopy, waveHint } from "@/lib/copy";
import {
  blockedKindnessFx,
  emoteFx,
  jokeFx,
  kindnessFx,
  quoteByIndex,
  quoteCount,
  type VillageFx,
} from "@/lib/interactions";
import type { KindnessMenuId } from "@/lib/copy";
import { ComfortSettings } from "@/components/comfort-settings";
import { PlayShelf } from "@/components/play-shelf";
import { installVillageTestHook, testHooksEnabled, type VillageTestState } from "@/lib/test-hooks";
import { SignalCard } from "@/components/signal-card";
import { VillageScene } from "@/components/village-scene";
import {
  bindViewer,
  getPlaySnapshot,
  getServerPlaySnapshot,
  markScoreSync,
  startBell,
  subscribePlay,
  updateAnon,
  updatePlay,
} from "@/lib/play-store";
import {
  addFeather,
  anonLine,
  broadcastFor,
  canEmote,
  canSecretFeed,
  cropTier,
  dominantAxis,
  familiarityLevel,
  featherCopy,
  forgetAnonFeed,
  forgetKindnessDay,
  forgetSecretDay,
  markAnonFeed,
  markSecretDay,
  morningBellDue,
  museumShelves,
  noteKindness,
  nowMs,
  scoreBand,
  setGardenCrop,
  setProp,
  stageNames,
  STICKERS,
  unlockQuote,
  unlockSticker,
  UNDO_MS,
  spendFreeze,
  vignetteFor,
  visitCalendar,
  type PlayBlob,
} from "@/lib/play-systems";
import type { PersonWithState, ScorePayload } from "@/lib/types";
import {
  availabilityFor,
  festivalOf,
  getPrefSnapshot,
  getServerPrefSnapshot,
  hydratePrefs,
  kindnessDayCounts,
  kindnessOnDay,
  kindnessStatus,
  localScoreHistory,
  motionGovernor,
  nextFestival,
  recordGarden,
  recordScoreHistory,
  revertKindness,
  saveComfort,
  saveSelf,
  scoreInsights,
  seasonOf,
  setAnimationsFrozen,
  setTestClock,
  shanghaiClock,
  spendKindness,
  spendWave,
  subscribePrefs,
  subscribeSystemReduced,
  sundayGlowNames,
  systemReducedSnapshot,
  teamTotals,
  waveStatus,
  type Comfort,
  type SceneLife,
} from "@/lib/village-life";

type Props = {
  initial: ScorePayload;
};

type UndoState = { name: string; until: number; secret: boolean };

export function VillagePage({ initial }: Props) {
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
  const [clock, setClock] = useState(() => shanghaiClock());
  const [, setFreezeTick] = useState(0);
  const [forceTimeout, setForceTimeout] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [split, setSplit] = useState(0.46);
  const playSnap = useSyncExternalStore(subscribePlay, getPlaySnapshot, getServerPlaySnapshot);
  const play = playSnap.play;
  const anon = playSnap.anon;
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [nowTick, setNowTick] = useState(() => nowMs());
  const [dismissedBroadcast, setDismissedBroadcast] = useState<string | null>(null);
  const [vignette, setVignette] = useState<{ title: string; lines: [string, string] } | null>(null);
  const [shelfLine, setShelfLine] = useState<string | null>(null);
  const systemReduced = useSyncExternalStore(subscribeSystemReduced, systemReducedSnapshot, () => false);
  const people = useMemo(() => withStates(payload.people), [payload.people]);
  const selected = people.find((person) => person.name === selectedName) ?? null;
  const history =
    selected && prefs.rev > 0
      ? localScoreHistory(selected.name, clock.ymd)
      : { days: [], recordedDays: 0, source: "local" as const };
  const scoredCount = people.filter((person) => person.scored).length;
  const placeholderCount = people.length - scoredCount;
  const dateCopy = scoreDateCopy(payload.date, clock.ymd);
  function commitPlay(recipe: (current: PlayBlob) => PlayBlob) {
    updatePlay(recipe);
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (res.status === 401) {
        // The proxy only sees the cleared cookie on a full navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- logout must leave the app router cache
        window.location.assign("/login");
        return;
      }
      if (!res.ok) throw new Error("load_failed");
      setPayload((await res.json()) as ScorePayload);
      markScoreSync(formatClock());
    } catch {
      setError("分数暂时读不到。上次成功的时间还留在上面。");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- logout must leave the app router cache
    window.location.assign("/login");
  }

  useEffect(() => {
    hydratePrefs();
    markScoreSync(formatClock());
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

  useEffect(() => {
    bindViewer(selfName, clock.ymd, festivalOf(clock)?.label ?? null);
  }, [selfName, clock]);

  useEffect(() => {
    if (!undo) return;
    const id = window.setInterval(() => {
      const now = nowMs();
      setNowTick(now);
      if (undo.until <= now) setUndo(null);
    }, 250);
    return () => window.clearInterval(id);
  }, [undo]);

  const undoSeconds = undo ? Math.max(0, Math.ceil((undo.until - nowTick) / 1000)) : 0;

  useEffect(() => {
    const reduced = motionGovernor({ systemReduced, comfort }).reduced;
    if (!selfName || comfort.quiet || !comfort.ambient || reduced) return;
    if (!morningBellDue(clock, getPlaySnapshot().play.bellDay, true)) return;
    updatePlay((current) => (current.bellDay === clock.ymd ? current : { ...current, bellDay: clock.ymd }));
    startBell();
  }, [selfName, clock, comfort, systemReduced]);

  const season = seasonOf(clock);
  const festival = festivalOf(clock);
  const motion = motionGovernor({ systemReduced, comfort });
  const insights = useMemo(() => (prefs.rev > 0 ? scoreInsights(clock.weekKey) : {}), [prefs.rev, clock.weekKey]);
  const familiarity = useMemo(() => {
    const counts = prefs.rev > 0 ? kindnessDayCounts() : {};
    return Object.fromEntries(people.map((person) => [person.name, familiarityLevel(counts[person.name] ?? 0)]));
  }, [people, prefs.rev]);
  const clubs = useMemo(() => {
    const out: Record<string, "work" | "fish" | "task"> = {};
    for (const person of people) {
      const samples = insights[person.name]?.week ?? [];
      const todaySample = person.scored ? [{ work: person.work, fish: person.fish, on_task: person.on_task }] : [];
      const axis = dominantAxis(samples.length > 0 ? samples : todaySample);
      if (axis) out[person.name] = axis;
    }
    return out;
  }, [people, insights]);
  const cropTiers = useMemo(() => {
    const out: Record<string, number> = {};
    for (const person of people) {
      const scoredDays = insights[person.name]?.scoredDays ?? (person.scored ? 1 : 0);
      out[person.name] = cropTier(scoredDays);
    }
    return out;
  }, [people, insights]);
  const spotlights = festival ? stageNames(people.map((person) => person.name), payload.date) : [];
  const life: SceneLife = {
    quiet: comfort.quiet,
    reduceMotion: motion.reduced,
    seasonTint: season.tint,
    festival: Boolean(festival),
    festivalId: festival?.label ?? null,
    festivalSkin: comfort.festivalSkin,
    glyphsOn: motion.glyphs,
    particles: motion.particles,
    showAllPlates: comfort.showAllPlates,
    jobLook: comfort.jobLook,
    selfName,
    selfPreset: preset,
    sundayGlow: prefs.rev > 0 ? sundayGlowNames(people.map((person) => person.name), clock) : [],
    familiarity,
    neighbors: Object.entries(familiarity)
      .filter(([, level]) => level > 0)
      .map(([name]) => name),
    spotlights,
    clubs,
    cropTiers,
    selfProp: play.prop,
    feathers: play.feathers,
    bell: playSnap.bell,
    gardenCrops: play.garden2,
  };

  function resolveKindness(target: string) {
    const spent = spendKindness(target);
    if (!spent.ok) return { ok: false as const, line: spent.line, sundayBonus: false };
    return { ok: true as const, line: "", sundayBonus: spent.sundayBonus };
  }

  function selectOnly(name: string | null) {
    setSelectedName(name);
  }

  function pick(name: string | null) {
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
    setFx(null);
  }

  function beginUndo(name: string, secret: boolean) {
    setUndo({ name, until: nowMs() + UNDO_MS, secret });
    setNowTick(nowMs());
  }

  function confirmKindness(action: KindnessMenuId) {
    if (!selected) return;
    const spent = resolveKindness(selected.name);
    if (!spent.ok) {
      if (selfName) setFx(blockedKindnessFx(selected.name, spent.line));
      return;
    }
    const event = kindnessFx(action, selected.name);
    setFx(spent.sundayBonus ? { ...event, line: `${event.line} 周日的田边多亮了一下。` } : event);
    beginUndo(selected.name, false);
    commitPlay((current) => noteKindness(current, shanghaiClock().ymd));
  }

  function secretFeed() {
    if (!selected || !selfName) return;
    const today = shanghaiClock();
    if (!canSecretFeed(play.secretDays, today.ymd)) {
      setShelfLine("今天的匿名投喂已经送出了。");
      return;
    }
    const spent = resolveKindness(selected.name);
    if (!spent.ok) {
      setFx(blockedKindnessFx(selected.name, spent.line));
      return;
    }
    updateAnon((current) => markAnonFeed(current, today.ymd, selected.name));
    commitPlay((current) => noteKindness(markSecretDay(current, today.ymd), today.ymd));
    const started = nowMs();
    setFx({
      id: started,
      kind: "coffee",
      actor: selected.name,
      line: "有人留下一杯咖啡。",
      startedAt: started,
      duration: 2400,
    });
    beginUndo(selected.name, true);
  }

  function undoLast() {
    if (!undo || !selfName) return;
    const today = shanghaiClock();
    revertKindness(undo.name, today, selfName);
    if (undo.secret) updateAnon((current) => forgetAnonFeed(current, today.ymd, undo.name));
    commitPlay((current) => {
      let next = undo.secret ? forgetSecretDay(current, today.ymd) : current;
      if (!kindnessOnDay(today.ymd, selfName)) next = forgetKindnessDay(next, today.ymd);
      return next;
    });
    setUndo(null);
    setFx(null);
  }

  function wave() {
    if (!selected) return;
    const spent = spendWave(selected.name);
    if (!spent.ok) {
      setFx(blockedKindnessFx(selected.name, spent.line));
      return;
    }
    setFx(emoteFx(selected.name, "wave"));
  }

  function emote(kind: "stretch" | "sit" | "clap" | "wave") {
    if (!selfName) return;
    const now = nowMs();
    if (!canEmote(play.emoteAt, now)) {
      setShelfLine("表情刚做过，稍等几秒。");
      return;
    }
    commitPlay((current) => ({ ...current, emoteAt: now }));
    setFx(emoteFx(selfName, kind));
  }

  function onSpot(spot: { id: string; kind: "gather" | "view"; title: string }) {
    if (spot.kind === "view") {
      if (!selfName) {
        setVignette({ title: spot.title, lines: ["先选定「我是谁」。", "羽毛才记在这个显示名上。"] });
        return;
      }
      commitPlay((current) => addFeather(current, spot.id));
      setVignette(featherCopy(spot.title));
      return;
    }
    if (!comfort.ambient) return;
    setVignette(vignetteFor(spot.title, clock.hour, scoreBand(teamTotals(people).taskMean)));
  }

  const broadcast = broadcastFor(clock.hour, comfort.quiet, comfort.ambient);
  const broadcastKey = broadcast ? `${clock.ymd}:${broadcast.id}` : null;
  const visit = visitCalendar(play, clock.ymd);
  const museum = museumShelves(scoredCount);
  const stickerLabels = STICKERS.filter((item) => play.stickers.includes(item.id)).map((item) => item.label);

  const selectRef = useRef(selectOnly);
  const kindnessRef = useRef(resolveKindness);
  const commitRef = useRef(commitPlay);
  const stateRef = useRef<VillageTestState>({
    ready: false,
    rosterNames: [],
    selectedName: null,
    scored: {},
    season: season.id,
    festival: null,
    comfort: { quiet: true, hideScores: false, reduceMotion: false },
    selfName: null,
  });
  useEffect(() => {
    selectRef.current = selectOnly;
    kindnessRef.current = resolveKindness;
    commitRef.current = commitPlay;
    stateRef.current = {
      ready: true,
      rosterNames: people.map((person) => person.name),
      selectedName,
      scored: Object.fromEntries(people.map((person) => [person.name, person.scored])),
      season: season.id,
      festival: festival?.label ?? null,
      comfort: { quiet: comfort.quiet, hideScores: comfort.hideScores, reduceMotion: motion.reduced },
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
        if (spent.ok) commitRef.current((current) => noteKindness(current, shanghaiClock().ymd));
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
      forceLoadTimeout: () => setForceTimeout(true),
    });
  }, []);

  const waveStatusNow = selected ? waveStatus(selected.name) : null;

  return (
    <div className="farm-page mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-5">
      <header className="hud-panel overflow-hidden">
        <div className="hud-title">像素公司村</div>
        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.22em] text-[#8a5528]">COZY COMPANY FARM</p>
            <p className="text-sm text-[#4a3a28]" data-testid="score-date" data-honesty={dateCopy.fresh ? "fresh" : "stale"}>
              {dateCopy.headline} · 有分 {scoredCount} 人
              {placeholderCount > 0 ? ` · 未评分 ${placeholderCount} 人` : ""}
            </p>
            <p className="text-xs text-[#6a3d18]">{dateCopy.detail}</p>
            <p className="text-xs text-[#6a3d18]" data-testid="last-score-sync">
              {loading ? "正在刷新…" : playSnap.syncedAt ? `上次成功 ${playSnap.syncedAt}` : "还没有成功读到分数"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="hud-btn" onClick={refresh} disabled={loading} data-testid="refresh-scores" data-loading={loading ? "1" : "0"}>
              {loading ? "正在刷新…" : "刷新今日分数"}
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={logout}>
              出村
            </button>
          </div>
        </div>
      </header>

      {broadcast && dismissedBroadcast !== broadcastKey ? (
        <div className="hud-panel flex items-center justify-between gap-3 px-3 py-2" data-testid="village-broadcast">
          <p className="pixel-label text-[#2a1a10]">{broadcast.line}</p>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={() => setDismissedBroadcast(broadcastKey)}>
            收起
          </button>
        </div>
      ) : null}
      {error ? <p className="hud-panel px-3 py-2 text-sm text-[#8a2020]">{error}</p> : null}
      {shelfLine ? <p className="px-1 text-xs text-[#6a3d18]">{shelfLine}</p> : null}

      <SeasonBanner seasonLabel={season.label} seasonId={season.id} festival={festival} people={people} />
      <ComfortSettings
        comfort={comfort}
        selfName={selfName}
        preset={preset}
        names={people.map((person) => person.name)}
        onComfort={(next: Comfort) => saveComfort(next)}
        onSelf={(name, nextPreset) => saveSelf(name, name ? nextPreset : null)}
        motionReduced={motion.reduced}
      />

      <div
        className="village-stage"
        data-card-open={selected ? "1" : "0"}
        style={{ ["--map-fr" as string]: String(split), ["--dock-fr" as string]: String(1 - split) }}
      >
        <div className="village-map-slot">
          <VillageScene
            people={people}
            selectedName={selectedName}
            fx={fx}
            life={life}
            forceTimeout={forceTimeout}
            bootAttempt={bootAttempt}
            onSelect={pick}
            onRetry={() => {
              setForceTimeout(false);
              setBootAttempt((value) => value + 1);
            }}
            onSpot={onSpot}
            onTogglePlates={() => saveComfort({ ...comfort, showAllPlates: !comfort.showAllPlates })}
            onEmote={selfName ? emote : undefined}
          />
        </div>
        <div
          className="split-bar"
          data-testid="split-bar"
          role="separator"
          aria-orientation="horizontal"
          aria-label="调整地图和信号卡"
          tabIndex={0}
          onPointerDown={(event) => {
            const stage = event.currentTarget.parentElement;
            if (!stage) return;
            const rect = stage.getBoundingClientRect();
            const move = (ev: PointerEvent) => {
              const ratio = (ev.clientY - rect.top) / Math.max(1, rect.height);
              setSplit(Math.min(0.72, Math.max(0.28, ratio)));
            };
            const up = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        />
        <div className="village-dock" data-testid="village-dock" data-open={selected ? "1" : "0"}>
          {selected ? (
            <SignalCard
              key={selected.name}
              person={selected}
              dataDateLabel={dateCopy.headline}
              dataDateDetail={dateCopy.detail}
              disclaimer={payload.disclaimer}
              line={fx && fx.actor === selected.name ? fx.line : null}
              waveHint={waveHint({
                hasIdentity: Boolean(selfName),
                allowed: Boolean(waveStatusNow?.allowed),
                retryAfterMin: waveStatusNow?.retryAfterMin ?? 0,
              })}
              kindnessNote={prefs.rev > 0 ? kindnessLine(selected.name, clock) : "先选定「我是谁」，关照按这个身份计数。"}
              sundayNote={
                prefs.rev > 0 && kindnessStatus(selected.name, clock).sundayBonus ? "这周两次关照都用上了，周日田边会多亮一下。" : null
              }
              hideScores={comfort.hideScores}
              isSelf={selected.name === selfName}
              availability={availabilityFor(selected, clock, selected.name === selfName ? preset : null)}
              history={history.days}
              historySource={history.source}
              recordedDays={history.recordedDays}
              today={clock.ymd}
              canKindness={Boolean(selfName) && kindnessStatus(selected.name, clock).canSend}
              canWave={Boolean(selfName) && Boolean(waveStatusNow?.allowed)}
              hasIdentity={Boolean(selfName)}
              undoSeconds={undo && undo.name === selected.name ? undoSeconds : 0}
              stickerLabels={selected.name === selfName ? stickerLabels : []}
              canSticker={Boolean(selfName) && play.stickerDay !== clock.ymd && play.stickers.length < STICKERS.length}
              anonNote={anonLine(anon, clock.ymd, selected.name)}
              gardenCrop={play.garden2[selected.name] ?? null}
              onClose={() => setSelectedName(null)}
              onKindness={confirmKindness}
              onWave={wave}
              onUndo={undoLast}
              onSticker={() => {
                if (!selfName) return;
                const result = unlockSticker(play, clock.ymd, saltOf(selected.name));
                setShelfLine(result.line);
                if (result.ok) commitPlay(() => result.blob);
              }}
              onGarden={(crop) => {
                if (!selfName) return;
                commitPlay((current) => setGardenCrop(current, selected.name, crop));
              }}
              onSecret={secretFeed}
            />
          ) : (
            <p className="px-3 py-3 text-sm text-[#4a3a28]">点小人，或点下面名册。远景默认收起名牌，拉近或按「全显」再看。</p>
          )}
        </div>
      </div>

      <PlayShelf
        selfName={selfName}
        play={play}
        visit={visit}
        museum={museum}
        quoteTotal={quoteCount()}
        festival={Boolean(festival)}
        spotlights={spotlights}
        note={vignette}
        onProp={(id) => commitPlay((current) => setProp(current, id))}
        onFreeze={() => commitPlay((current) => spendFreeze(current, clock.ymd))}
        onQuote={() => {
          if (!selfName) return;
          const index = Math.abs(saltOf(selfName) + play.quotes.length) % quoteCount();
          commitPlay((current) => unlockQuote(current, index, quoteCount()));
          setFx({
            id: nowMs(),
            kind: "quote",
            actor: selfName,
            line: quoteByIndex(index),
            startedAt: nowMs(),
            duration: 2400,
          });
        }}
      />

      <section className="hud-panel overflow-hidden">
        <div className="hud-title">田亩名册</div>
        {people.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[#4a3a28]">等评分机器人投喂一条分数吧。</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="roster-list">
            {people.map((person, index) => {
              const active = person.name === selectedName;
              return (
                <button
                  key={person.name}
                  type="button"
                  data-roster-item
                  data-roster-name={person.name}
                  onClick={() => pick(person.name)}
                  onKeyDown={(event) => moveRosterFocus(event, index)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-left ${active ? "hud-roster hud-roster-on" : "hud-roster"}`}
                >
                  <div>
                    <div className="font-medium text-[#2a1a10]">
                      {person.name}
                      {person.name === selfName ? " · 我" : ""}
                    </div>
                    <div className="text-xs text-[#6a3d18]">{rosterLine(person, comfort.hideScores, person.name === selfName)}</div>
                  </div>
                  <span className="hud-chip">{person.scored ? STATE_LABELS[person.state] : "未评分"}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2 pb-8">
        <h2 className="text-sm font-medium text-[#4a3a28]">动画怎么来的</h2>
        <div className="flex flex-wrap gap-2">
          {STATE_ORDER.map((state) => (
            <span key={state} className="hud-chip">
              {STATE_LABELS[state]}
            </span>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#4a3a28]/80">
          小人动作只看评分日的 work / fish / on_task，消息只计条数。未评分的人是灰猫。这是玩乐雷达，不是评价同事。
        </p>
        <p className="disclaimer-banner text-xs">{payload.disclaimer}</p>
        <p className="text-xs leading-5 text-[#6a3d18]/80">
          草地、水、树、房子、悬崖和七色猫咪村民来自 Little Wilds 完整包。作物 CC0 josehzz。名牌是 Fusion Pixel Font。详见 CREDITS.md。
        </p>
      </section>
    </div>
  );
}

function saltOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h + name.charCodeAt(i)) >>> 0;
  return h;
}

function formatClock() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function moveRosterFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-roster-item]"));
  const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
  const next = buttons[index + delta];
  next?.focus();
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
