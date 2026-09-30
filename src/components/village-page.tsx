"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { STATE_LABELS, STATE_ORDER, withStates } from "@/lib/animation";
import { glanceLine, lightLabel, scoreDateCopy, waveHint } from "@/lib/copy";
import {
  blockedKindnessFx,
  emoteFx,
  jokeFx,
  kindnessFx,
  socialReplyMark,
  withSocialReply,
  quoteByIndex,
  quoteCount,
  type VillageFx,
} from "@/lib/interactions";
import type { KindnessMenuId } from "@/lib/copy";
import { ComfortSettings } from "@/components/comfort-settings";
import { FirstRunGuide } from "@/components/first-run-guide";
import { readVisit, VISIT_KEY, type VisitFlags } from "@/lib/first-run";
import { HeaderRitual } from "@/components/header-ritual";
import { PlayShelf } from "@/components/play-shelf";
import { VillageLoopsPanel } from "@/components/village-loops-panel";
import { YardNookPanel } from "@/components/yard-nook-panel";
import { WaveDPanel } from "@/components/wave-d-panel";
import { installVillageTestHook, testHooksEnabled, type VillageTestState } from "@/lib/test-hooks";
import { SignalCard } from "@/components/signal-card";
import { VillageScene } from "@/components/village-scene";
import { WEEK_DONE_SUMMARY_ENABLED } from "@/features/week-done-summary/week-done-summary";
import { WeekDoneSummary } from "@/features/week-done-summary/week-done-summary-view";
import { sessionIsNight } from "@/features/night-wash-v2/night-wash-v2";
import {
  AFTERGLOW_LINE,
  afterglowDuration,
  afterglowPhase,
  type AfterglowPhase,
} from "@/features/ritual-afterglow/ritual-afterglow";
import { autumnPaletteMark } from "@/features/autumn-palette/autumn-palette";
import autumnPaletteStyles from "@/features/autumn-palette/autumn-palette.module.css";
import { SCORE_DAY_LINE, scoreDayMark } from "@/features/score-day-immersion/score-day-immersion";
import scoreDayStyles from "@/features/score-day-immersion/score-day-immersion.module.css";
import { sfxMark } from "@/features/light-sfx/light-sfx";
import { LightSfxBridge } from "@/features/light-sfx/sfx-bridge";
import { ReleaseChip, ReleaseNotes } from "@/features/village-release/release-notes";
import { nightReadMark } from "@/features/night-readability/night-readability";
import {
  nextBeatLabel,
  nextBeatOffer,
  pickNextBeat,
  NEXT_BEAT_DONE,
} from "@/features/week-next-beat/next-beat";
import { YARD_TOY_FOCUS_ENABLED, isToyId, toyAnchor } from "@/features/yard-toy-focus/yard-toy-focus";
import {
  GESTURE_SFX_ENABLED,
  ambientBedOn,
  playGesture,
  syncAmbientBed,
  type GestureId,
} from "@/features/gesture-sfx/gesture-sfx";
import {
  HEADER_WAVE_MS,
  HEADER_WAVE_RECEIPT_ENABLED,
  headerWaveLine,
  headerWaveTarget,
} from "@/features/header-wave-receipt/header-wave-receipt";
import { POST_WEEK_PRESENCE_ENABLED, loadGlance, presencePhase, storeGlance, type GlanceSave } from "@/features/post-week-presence/presence";
import { PostWeekPresence } from "@/features/post-week-presence/presence-view";
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
  bindWave,
  getServerWaveSnapshot,
  getWaveSnapshot,
  migrateLegacyWave,
  subscribeWave,
  sweepVillageStorage,
  updateWave,
} from "@/lib/wave-d-store";
import { RITUAL_BEATS, loadRitual, ritualBeat, ritualNearCount, storeRitual, type RitualSave } from "@/lib/header-ritual";
import { placeVillagers } from "@/lib/pixel-scene";
import { applyLoop, emptyLoops, loopSalt, type LoopId } from "@/lib/village-loops";
import { bindLoops, getLoopSnapshot, getServerLoopSnapshot, subscribeLoops, updateLoops, updatePebbles } from "@/lib/village-loops-store";
import { applyNook, emptyNook, emptySession, nookSalt, type NookId } from "@/lib/yard-nook";
import { bindNook, getNookSnapshot, getServerNookSnapshot, subscribeNook, updateNook, updateNookSession } from "@/lib/yard-nook-store";
import {
  acceptTap,
  buildDecor,
  bumpChronicle,
  isolatePeople,
  postcardMeta,
  SPLIT_CARD,
  SPLIT_MAP,
  clampSplit,
  setDiary,
  setInstrument,
  setToggle,
  stepSplit,
  pinResult,
  sitDown,
  toggleHat,
  togglePorch,
  visitorCopy,
  waterOnce,
  weekChores,
  choreAction,
  choreButtonCopy,
  addStrollStep,
  strollStepLine,
  weekTally,
  weatherFor,
  noteWeekChore,
  emptyViewerChores,
  rememberViewerChores,
  WEEK_DONE_LINE,
  WEEK_KEPT_LINE,
  systemOn,
  type ViewerChoreFlags,
  type WaveDBlob,
  type WaveSystemId,
} from "@/lib/wave-d";
import { playLane, type LaneActId } from "@/lib/lane";
import { bondLine, bondNames, bumpBond, dropBond } from "@/lib/social-bond";
import { playYard, type YardActId } from "@/lib/yard";
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
  spendFreeze,
  vignetteFor,
  visitCalendar,
  type PlayBlob,
} from "@/lib/play-systems";
import type { PersonWithState, ScorePayload, VillagePerson } from "@/lib/types";
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

type UndoSession = { id: number; name: string; secret: boolean; viewer: string };

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
  const [ritualMark, setRitualMark] = useState<RitualSave | null>(null);
  const [ritualGlowAt, setRitualGlowAt] = useState<number | null>(null);
  const [ritualPhase, setRitualPhase] = useState<AfterglowPhase>("off");
  const [glanceMark, setGlanceMark] = useState<GlanceSave | null>(null);
  const [, setFreezeTick] = useState(0);
  const [forceTimeout, setForceTimeout] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [split, setSplit] = useState(0.46);
  const playSnap = useSyncExternalStore(subscribePlay, getPlaySnapshot, getServerPlaySnapshot);
  const waveSnap = useSyncExternalStore(subscribeWave, getWaveSnapshot, getServerWaveSnapshot);
  const waveState = waveSnap.wave;
  const [homePulse, setHomePulse] = useState(0);
  const [choreBook, setChoreBook] = useState<ReadonlyMap<string, ViewerChoreFlags>>(() => new Map());
  const [waveLine, setWaveLine] = useState<string | null>(null);
  const [visitFlags, setVisitFlags] = useState<VisitFlags | null>(null);
  const [loopLine, setLoopLine] = useState<{ viewer: string; text: string } | null>(null);
  const loopSnap = useSyncExternalStore(subscribeLoops, getLoopSnapshot, getServerLoopSnapshot);
  const [nookLine, setNookLine] = useState<{ viewer: string; text: string } | null>(null);
  const nookSnap = useSyncExternalStore(subscribeNook, getNookSnapshot, getServerNookSnapshot);
  const lastTap = useRef({ name: "", at: 0 });
  const play = playSnap.play;
  const anon = playSnap.anon;
  const [undo, setUndo] = useState<UndoSession | null>(null);
  const undoSeq = useRef(0);
  const [pinHint, setPinHint] = useState("");
  const [rosterMode, setRosterMode] = useState<"live" | "empty">("live");
  const [badNote, setBadNote] = useState(0);
  const kindnessAt = useRef(0);
  const [dismissedBroadcast, setDismissedBroadcast] = useState<string | null>(null);
  const [parchment, setParchment] = useState<null | "ritual" | "week" | "season">(null);
  const [mapAim, setMapAim] = useState<{ token: number; kind: string; x: number; y: number; at: number } | null>(null);
  const [ambientOn, setAmbientOn] = useState(false);
  const [gestureMark, setGestureMark] = useState<{ id: GestureId; audio: "played" | "silent" } | null>(null);
  const [headerWave, setHeaderWave] = useState<{ line: string; until: number } | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const sync = () => {
      const height = Math.ceil(node.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--village-header-h", `${height}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [vignette, setVignette] = useState<{ title: string; lines: [string, string] } | null>(null);
  const [shelfLine, setShelfLine] = useState<string | null>(null);
  const systemReduced = useSyncExternalStore(subscribeSystemReduced, systemReducedSnapshot, () => false);
  const people = useMemo(() => {
    if (rosterMode === "empty") return [];
    const raw = badNote
      ? [
          ...payload.people,
          {
            name: "坏档",
            scored: true as const,
            msgs: Number.NaN,
            work: Number.NaN,
            fish: Number.NaN,
            on_task: Number.NaN,
          },
        ]
      : payload.people;
    return withStates(isolatePeople(raw).people as VillagePerson[]);
  }, [payload.people, rosterMode, badNote]);
  const ritualNear = useMemo(() => {
    const placed = placeVillagers(people);
    const self = selfName ? (placed.find((person) => person.name === selfName) ?? null) : null;
    return ritualNearCount(self, placed);
  }, [people, selfName]);
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
        window.location.replace("/login");
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
    await fetch("/api/logout", { method: "POST", cache: "no-store" });
    // Full document load. A client-router return to "/" was reusing the shell
    // from before the cookie clear, so the header and roster stayed blank
    // until the next local event.
    window.location.replace("/login");
  }

  useEffect(() => {
    if (selfName) migrateLegacyWave(selfName);
  }, [selfName]);

  useEffect(() => {
    setUndo(null);
  }, [selfName]);

  const [splitReady, setSplitReady] = useState(false);
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("village:split-v1");
      const next = raw ? Number(raw) : NaN;
      if (Number.isFinite(next)) setSplit(clampSplit(next));
    } catch {
      /* session storage can be blocked */
    }
    setSplitReady(true);
  }, []);

  useEffect(() => {
    if (!splitReady) return;
    try {
      window.sessionStorage.setItem("village:split-v1", String(split));
    } catch {
      /* session storage can be blocked */
    }
  }, [split, splitReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("booted")) {
      params.delete("booted");
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", qs ? `/?${qs}` : "/");
    }
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/scores", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }
        if (!res.ok) return;
        setPayload((await res.json()) as ScorePayload);
      } catch {
        /* keep the server-rendered roster */
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    hydratePrefs();
    sweepVillageStorage();
    markScoreSync(formatClock());
    const seeded = withStates(initial.people);
    recordGarden(initial.date, seeded);
    recordScoreHistory({ date: initial.date, people: seeded, disclaimer: initial.disclaimer });
    const id = window.setInterval(() => setClock(shanghaiClock()), 60_000);
    return () => window.clearInterval(id);
  }, [initial]);

  useEffect(() => {
    setRitualMark(loadRitual(selfName, clock.ymd));
  }, [selfName, clock.ymd]);

  useEffect(() => {
    setGlanceMark(loadGlance(selfName, clock.weekKey));
  }, [selfName, clock.weekKey]);

  useEffect(() => {
    setVisitFlags(readVisit(window.localStorage.getItem(VISIT_KEY)));
  }, []);

  useEffect(() => {
    if (!visitFlags) return;
    window.localStorage.setItem(VISIT_KEY, JSON.stringify(visitFlags));
  }, [visitFlags]);

  useEffect(() => {
    if (!selfName) return;
    setVisitFlags((current) => (current && !current.self ? { ...current, self: true } : current));
  }, [selfName, visitFlags]);

  useEffect(() => {
    recordGarden(payload.date, people);
    recordScoreHistory({ date: payload.date, people, disclaimer: payload.disclaimer });
  }, [payload, people]);

  useEffect(() => {
    bindViewer(selfName, clock.ymd, festivalOf(clock)?.label ?? null);
    bindWave(selfName, clock.ymd);
  }, [selfName, clock]);

  useEffect(() => {
    bindLoops(selfName);
  }, [selfName]);

  useEffect(() => {
    bindNook(selfName);
  }, [selfName]);

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
  useEffect(() => {
    if (ritualGlowAt == null) return;
    const reduced = motion.reduced;
    const elapsed = Date.now() - ritualGlowAt;
    const nextPhase = afterglowPhase(elapsed, reduced);
    const mark = window.setTimeout(() => setRitualPhase(nextPhase), 0);
    const left = ritualGlowAt + afterglowDuration(reduced) - Date.now();
    const clear = window.setTimeout(() => {
      setRitualGlowAt(null);
      setRitualPhase("off");
    }, Math.max(16, left));
    return () => {
      window.clearTimeout(mark);
      window.clearTimeout(clear);
    };
  }, [ritualGlowAt, motion.reduced]);
  const insights = useMemo(() => (prefs.rev > 0 ? scoreInsights(clock.weekKey) : {}), [prefs.rev, clock.weekKey]);
  const familiarity = useMemo(() => {
    const counts = prefs.rev > 0 ? kindnessDayCounts() : {};
    return Object.fromEntries(
      people.map((person) => [
        person.name,
        familiarityLevel((counts[person.name] ?? 0) + (play.bonds[person.name] ?? 0)),
      ]),
    );
  }, [people, prefs.rev, play.bonds]);
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
  const waveMatches = waveSnap.viewer === selfName;
  const kept = (selfName ? choreBook.get(selfName) : undefined) ?? emptyViewerChores();
  const liveWave = waveMatches ? waveState : null;
  const loopsReady = Boolean(selfName) && loopSnap.viewer === selfName;
  const loopBlob = loopsReady ? loopSnap.loops : emptyLoops();
  const loopPebbles = loopsReady ? loopSnap.pebbles : 0;
  const nookReady = Boolean(selfName) && nookSnap.viewer === selfName;
  const nookBlob = nookReady ? nookSnap.nook : emptyNook();
  const nookSession = nookReady ? nookSnap.session : emptySession();
  const weekFacts = {
    wateredToday: liveWave?.waterDay === clock.ymd,
    cardOpen: kept.card,
    visitedGate: kept.gate,
    porchOn: kept.porch || Boolean(liveWave?.porch),
    diaryToday: Boolean(liveWave && liveWave.diaryDay === clock.ymd && liveWave.diaryIndex !== null),
    steps: liveWave?.footprints.length ?? 0,
    pinned: kept.pin || Boolean(liveWave && liveWave.pins.length > 0),
    resting: kept.sat || Boolean(liveWave?.sit),
    noticedSeason: kept.season,
  };
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    const changed = prevSelected.current !== selectedName;
    prevSelected.current = selectedName;
    if (!changed || !selectedName || !selfName) return;
    setChoreBook((book) => rememberViewerChores(book, selfName, { card: true }));
  }, [selectedName, selfName]);
  useEffect(() => {
    if (!selfName || waveSnap.viewer !== selfName) return;
    setChoreBook((book) =>
      rememberViewerChores(book, selfName, {
        porch: waveState.porch,
        pin: waveState.pins.length > 0,
        sat: Boolean(waveState.sit),
      }),
    );
  }, [selfName, waveSnap.viewer, waveState.porch, waveState.pins.length, waveState.sit]);
  const choreMarks = liveWave?.weekMarks ?? null;
  const chores = weekChores(clock.weekKey, weekFacts, choreMarks);
  const freshKey = weekChores(clock.weekKey, weekFacts)
    .filter((item) => item.done)
    .map((item) => item.label)
    .join("\n");
  const savedKey = choreMarks?.week === clock.weekKey ? choreMarks.labels.join("\n") : "";
  const persistViewer = useRef<string | null>(null);
  useEffect(() => {
    if (!selfName || waveSnap.viewer !== selfName) return;
    if (persistViewer.current !== selfName) {
      persistViewer.current = selfName;
      return;
    }
    const saved = new Set(savedKey ? savedKey.split("\n") : []);
    const fresh = freshKey.split("\n").filter((label) => label && !saved.has(label));
    if (fresh.length === 0) return;
    updateWave((current) => fresh.reduce((blob, label) => noteWeekChore(blob, clock.weekKey, label), current));
  }, [selfName, waveSnap.viewer, clock.weekKey, freshKey, savedKey]);
  const tally = weekTally(chores);
  const decor = buildDecor({
    blob: waveState,
    ymd: clock.ymd,
    hour: clock.hour,
    seasonId: season.id,
    quiet: comfort.quiet,
    reduced: motion.reduced,
    festival: Boolean(festival),
    familiarity,
    selfName,
    fedNames: anon[clock.ymd] ?? [],
    now: nowMs(),
    weekDone: tally.complete,
    facts: weekFacts,
    weekKey: clock.weekKey,
  });
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
    decor,
    craft: {
      steps: weekFacts.steps,
      watered: weekFacts.wateredToday,
      ribbon: tally.complete,
    },
    ritual: ritualMark ? { beat: ritualMark.beat, done: true } : null,
    ritualGlowAt,
    ritualPhase,
    scoreFresh: dateCopy.fresh,
    bondMarks: bondNames(play.bonds),
    sessionNight: sessionIsNight(clock.hour),
    toyLook: YARD_TOY_FOCUS_ENABLED
      ? { lantern: loopBlob.lanternGlow, scare: loopBlob.scareTips, pebbles: loopPebbles }
      : null,
    mapAim: mapAim ? { kind: mapAim.kind, x: mapAim.x, y: mapAim.y, at: mapAim.at } : null,
    sfxMuted: comfort.sfxMuted,
    presenceOn:
      presencePhase({
        weekComplete: tally.complete,
        viewer: selfName,
        week: clock.weekKey,
        savedWeek: glanceMark?.week ?? null,
      }) === "done",
  };
  const glance = presencePhase({
    weekComplete: tally.complete,
    viewer: selfName,
    week: clock.weekKey,
    savedWeek: glanceMark?.week ?? null,
  });

  useEffect(() => {
    if (!GESTURE_SFX_ENABLED) return;
    syncAmbientBed(ambientBedOn({ muted: comfort.sfxMuted, ambient: ambientOn, reduceMotion: motion.reduced }));
    return () => {
      syncAmbientBed(false);
    };
  }, [ambientOn, comfort.sfxMuted, motion.reduced]);

  useEffect(() => {
    if (!mapAim) return;
    const id = window.setTimeout(() => setMapAim(null), 4000);
    return () => window.clearTimeout(id);
  }, [mapAim]);

  useEffect(() => {
    if (!gestureMark) return;
    const id = window.setTimeout(() => setGestureMark(null), 1600);
    return () => window.clearTimeout(id);
  }, [gestureMark]);

  useEffect(() => {
    if (!headerWave) return;
    const id = window.setTimeout(() => setHeaderWave(null), Math.max(0, headerWave.until - Date.now()));
    return () => window.clearTimeout(id);
  }, [headerWave]);

  function markGesture(id: GestureId) {
    if (!GESTURE_SFX_ENABLED) return;
    const audio = playGesture(id, !comfort.sfxMuted && !motion.reduced);
    setGestureMark({ id, audio });
  }

  function aimMap(kind: string, x: number, y: number) {
    const at = Date.now();
    setMapAim({ token: at, kind, x, y, at });
  }

  function passGlance() {
    if (!selfName || glance !== "ready") return;
    setGlanceMark(storeGlance(selfName, clock.weekKey));
  }

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
    const now = nowMs();
    if (name === lastTap.current.name && !acceptTap(lastTap.current.at, now)) return;
    lastTap.current = { name, at: now };
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
    if (!selfName) return;
    undoSeq.current += 1;
    setUndo({ id: undoSeq.current, name, secret, viewer: selfName });
  }

  function confirmKindness(action: KindnessMenuId) {
    if (!selected) return;
    const now = nowMs();
    if (!acceptTap(kindnessAt.current, now, 400)) return;
    kindnessAt.current = now;
    const spent = resolveKindness(selected.name);
    if (!spent.ok) {
      if (selfName) setFx(blockedKindnessFx(selected.name, spent.line));
      return;
    }
    const event = withSocialReply(kindnessFx(action, selected.name), selfName, familiarity[selected.name] ?? 0);
    setFx(spent.sundayBonus ? { ...event, line: `${event.line} 周日的田边多亮了一下。` } : event);
    beginUndo(selected.name, false);
    const today = shanghaiClock().ymd;
    const name = selected.name;
    commitPlay((current) => {
      const noted = noteKindness(current, today);
      if (!selfName || name === selfName) return noted;
      return { ...noted, bonds: bumpBond(noted.bonds, name) };
    });
    updateWave((current) => bumpChronicle(current, today, "kindness"));
    setVisitFlags((current) => (current && !current.social ? { ...current, social: true } : current));
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
    const fed = selected.name;
    updateAnon((current) => markAnonFeed(current, today.ymd, fed));
    commitPlay((current) => {
      const noted = noteKindness(markSecretDay(current, today.ymd), today.ymd);
      if (fed === selfName) return noted;
      return { ...noted, bonds: bumpBond(noted.bonds, fed) };
    });
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
    if (!undo || !selfName || undo.viewer !== selfName) {
      setUndo(null);
      return;
    }
    const today = shanghaiClock();
    revertKindness(undo.name, today, selfName);
    if (undo.secret) updateAnon((current) => forgetAnonFeed(current, today.ymd, undo.name));
    commitPlay((current) => {
      let next = undo.secret ? forgetSecretDay(current, today.ymd) : current;
      if (!kindnessOnDay(today.ymd, selfName)) next = forgetKindnessDay(next, today.ymd);
      return { ...next, bonds: dropBond(next.bonds, undo.name) };
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
    setFx(withSocialReply(emoteFx(selected.name, "wave"), selfName, familiarity[selected.name] ?? 0));
    markGesture("wave");
    const name = selected.name;
    if (selfName && name !== selfName) {
      commitPlay((current) => ({ ...current, bonds: bumpBond(current.bonds, name) }));
    }
    setVisitFlags((current) => (current && !current.social ? { ...current, social: true } : current));
  }

  function emote(kind: "stretch" | "sit" | "clap" | "wave") {
    if (!selfName) return;
    const now = nowMs();
    if (!canEmote(play.emoteAt, now)) {
      setShelfLine("表情刚做过，稍等几秒。");
      return;
    }
    commitPlay((current) => ({ ...current, emoteAt: now }));
    if (kind === "wave" && HEADER_WAVE_RECEIPT_ENABLED) {
      const placed = placeVillagers(people);
      const self = placed.find((person) => person.name === selfName) ?? null;
      const target = headerWaveTarget(
        self ? { name: self.name, x: self.x, y: self.y } : null,
        placed.map((person) => ({ name: person.name, x: person.x, y: person.y })),
      );
      const line = headerWaveLine(Boolean(target));
      const started = nowMs();
      setFx({
        ...emoteFx(selfName, "wave"),
        partner: target?.name,
        line,
        startedAt: started,
        duration: HEADER_WAVE_MS,
      });
      setHeaderWave({ line, until: started + HEADER_WAVE_MS });
      markGesture("wave");
      return;
    }
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
      clearRoster: () => setRosterMode("empty"),
      injectBadRecord: () => setBadNote(1),
    });
  }, []);

  const waveStatusNow = selected ? waveStatus(selected.name) : null;

  function runLoop(id: LoopId) {
    if (!selfName || loopSnap.viewer !== selfName) {
      return;
    }
    const result = applyLoop(
      { blob: loopSnap.loops, pebbles: loopSnap.pebbles },
      id,
      { ymd: clock.ymd, salt: loopSalt(selfName, clock.ymd), cropTier: cropTiers[selfName] ?? 0 },
    );
    if (result.view.blob !== loopSnap.loops) updateLoops(() => result.view.blob);
    if (result.view.pebbles !== loopSnap.pebbles) updatePebbles(result.view.pebbles);
    setLoopLine({ viewer: selfName, text: result.line });
    if (YARD_TOY_FOCUS_ENABLED && isToyId(id)) {
      const spot = toyAnchor(id);
      aimMap(id, spot.x, spot.y);
    }
  }

  function runNook(id: NookId) {
    if (!selfName || nookSnap.viewer !== selfName) return;
    const result = applyNook(
      { blob: nookSnap.nook, session: nookSnap.session },
      id,
      { ymd: clock.ymd, salt: nookSalt(selfName, clock.ymd), hour: clock.hour },
    );
    if (result.view.blob !== nookSnap.nook) updateNook(() => result.view.blob);
    if (result.view.session !== nookSnap.session) updateNookSession(() => result.view.session);
    setNookLine({ viewer: selfName, text: result.line });
  }

  function rememberChore(flag: keyof ViewerChoreFlags) {
    if (!selfName) return;
    setChoreBook((book) => rememberViewerChores(book, selfName, { [flag]: true }));
  }

  function visitOwnGate(line?: string) {
    if (!selfName) return;
    rememberChore("gate");
    setHomePulse((value) => value + 1);
    if (line) setWaveLine(line);
  }

  function runChore(label: string) {
    const action = choreAction(label);
    if (!action || !selfName) {
      if (!selfName) setWaveLine("先选定「我是谁」，小事才记在这台电脑上。");
      return;
    }
    if (chores.find((item) => item.label === label)?.done) return;
    setVisitFlags((current) => (current && !current.yard ? { ...current, yard: true } : current));
    if (action === "water") {
      const result = waterOnce(waveState, clock.ymd);
      setWaveLine(result.line);
      if (result.ok) updateWave(() => result.blob);
      return;
    }
    if (action === "card") {
      const name = people.find((person) => person.name !== selfName)?.name ?? people[0]?.name;
      if (name) selectOnly(name);
      return;
    }
    if (action === "gate") {
      visitOwnGate("在村口站了一会儿。");
      return;
    }
    if (action === "porch") {
      updateWave((current) => (current.porch ? current : togglePorch(current)));
      setWaveLine("门灯点上了。");
      markGesture("lamp");
      return;
    }
    if (action === "diary") {
      const result = setDiary(waveState, clock.ymd, 0);
      setWaveLine(result.line);
      if (result.ok) updateWave(() => result.blob);
      return;
    }
    if (action === "steps") {
      const before = waveState.footprints.length;
      const next = addStrollStep(waveState, nowMs());
      if (next !== waveState) updateWave(() => next);
      setWaveLine(strollStepLine(before, next.footprints.length));
      return;
    }
    if (action === "season") {
      rememberChore("season");
      setWaveLine("看过这一季的颜色了。");
      return;
    }
    if (action === "pin") {
      updateWave((current) => {
        const target = current.pins.includes(selfName)
          ? people.find((person) => !current.pins.includes(person.name))?.name
          : selfName;
        if (!target) return current;
        return { ...current, pins: pinResult(current.pins, target).pins };
      });
      setWaveLine("钉了一枚名牌。");
      return;
    }
    updateWave((current) => (current.sit ? current : sitDown(current, 640, 420)));
    setWaveLine("把锄头放下，在长椅上坐下了。");
  }

  const autumnMark = autumnPaletteMark(season.id);
  const nextBeat = useMemo(() => {
    if (!nextBeatOffer(tally.complete)) return null;
    const self = selfName ? placeVillagers(people).find((person) => person.name === selfName) ?? null : null;
    return pickNextBeat(self ? { x: self.x, y: self.y } : null);
  }, [tally.complete, selfName, people]);
  const dayMark = scoreDayMark(dateCopy.fresh, comfort.quiet);
  const ritualShown = ritualMark ? RITUAL_BEATS[ritualMark.beat] : ritualBeat(clock.hour);
  const openParchment = (id: "ritual" | "week" | "season") => {
    setParchment((current) => (current === id ? null : id));
  };

  return (
    <div
      className="farm-page mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 pb-8 pt-0 sm:px-5"
      data-reduce-motion={motion.reduced ? "1" : "0"}
      data-bad-isolated={badNote ? "1" : "0"}
      data-roster-mode={rosterMode}
      data-sfx={sfxMark(comfort.sfxMuted, motion.reduced)}
      data-ritual-afterglow={ritualPhase}
      data-autumn-palette={autumnMark}
      data-score-day={dayMark}
      data-night-read={nightReadMark(sessionIsNight(clock.hour))}
      data-gesture={gestureMark?.id ?? "off"}
      data-gesture-audio={gestureMark?.audio ?? "silent"}
      data-gesture-bed={ambientBedOn({ muted: comfort.sfxMuted, ambient: ambientOn, reduceMotion: motion.reduced }) ? "live" : "off"}
      data-header-wave={headerWave ? "receipt" : "off"}
    >
      <LightSfxBridge muted={comfort.sfxMuted} reduceMotion={motion.reduced} />
      <div className="village-hero" data-testid="village-hero">
      <div className="parchment-stack" data-testid="parchment-stack">
      <header ref={headerRef} className="hud-panel village-header" data-testid="village-header">
        <div className="village-header-row">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="pixel-label text-[#2a1a10]">像素公司村</p>
              <ReleaseChip />
            </div>
            <p className="glance-line text-xs text-[#2a1a10]" data-testid="village-glance">
              {glanceLine({
                season: season.label,
                weather: weatherFor(clock.ymd).label,
                light: lightLabel(clock.hour),
                selfName,
              })}
            </p>
            {dayMark !== "off" ? (
              <p className={`glance-line text-xs ${scoreDayStyles.line}`} data-testid="score-day-cue" data-score-day={dayMark}>
                {SCORE_DAY_LINE}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="hud-btn" onClick={refresh} disabled={loading} data-testid="refresh-scores" data-loading={loading ? "1" : "0"}>
              {loading ? "正在刷新…" : dateCopy.refresh}
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={logout}>
              出村
            </button>
          </div>
        </div>
        <details className="px-3 pb-2" data-testid="score-meta">
          <summary className="cursor-pointer text-xs text-[#6a3d18]">分数从哪来</summary>
          <p className="mt-1 text-sm text-[#4a3a28]" data-testid="score-date" data-honesty={dateCopy.fresh ? "fresh" : "stale"}>
            {dateCopy.headline}
            {` · 有分 ${scoredCount} 人`}
            {placeholderCount > 0 ? ` · 未评分 ${placeholderCount} 人` : ""}
          </p>
          <p className="text-xs text-[#6a3d18]" data-testid="score-date-detail">
            {dateCopy.detail}
          </p>
          <p className="text-xs text-[#6a3d18]" data-testid="last-score-sync">
            {loading ? "正在刷新…" : playSnap.syncedAt ? `上次成功 ${playSnap.syncedAt}` : "还没有成功读到分数"}
          </p>
        </details>
      </header>
      {visitorCopy(selfName, waveState.toggles.visitor) ? (
        <p className="visitor-line" data-testid="visitor-banner">
          {visitorCopy(selfName, waveState.toggles.visitor)}
        </p>
      ) : null}
      {error ? <p className="px-1 text-xs text-[#8a2020]">{error}</p> : null}
      <div className="parchment-bar" data-testid="parchment-bar">
        <button
          type="button"
          className="parchment-badge"
          data-testid="ritual-badge"
          aria-expanded={parchment === "ritual"}
          aria-controls="header-ritual"
          onClick={() => openParchment("ritual")}
        >
          {ritualShown.title}
        </button>
        {waveState.toggles.weekBoard ? (
          <button
            type="button"
            className="parchment-badge"
            data-testid="week-badge"
            aria-expanded={parchment === "week"}
            aria-controls="today-chores"
            onClick={() => openParchment("week")}
          >
            本周 {tally.done}/{tally.total}
          </button>
        ) : null}
        {nextBeat ? (
          <button
            type="button"
            className="parchment-badge"
            data-testid="next-beat"
            data-next-id={nextBeat.id}
            onClick={() => {
              aimMap(nextBeat.id, nextBeat.x, nextBeat.y);
              setWaveLine(NEXT_BEAT_DONE);
            }}
          >
            {nextBeatLabel(nextBeat)}
          </button>
        ) : null}
        <button
          type="button"
          className={`parchment-badge season-banner season-${season.id}${autumnMark === "warm" ? ` ${autumnPaletteStyles.warm}` : ""}`}
          data-testid="season-banner"
          data-season-banner
          data-season={season.id}
          data-autumn-palette={autumnMark}
          data-festival={festival ? festival.label : ""}
          data-season-fade="400"
          aria-expanded={parchment === "season"}
          onClick={() => {
            openParchment("season");
            rememberChore("season");
          }}
        >
          {season.label}
          {festival ? ` · 今日${festival.label}` : ""}
        </button>
      </div>
      {headerWave ? (
        <p className="px-1 text-xs text-[#6a3d18]" data-testid="header-wave-receipt" data-header-wave="receipt">
          {headerWave.line}
        </p>
      ) : null}
      {ritualPhase !== "off" ? (
        <p className="px-1 text-xs text-[#6a3d18]" data-testid="ritual-afterglow" data-ritual-afterglow={ritualPhase}>
          {AFTERGLOW_LINE}
        </p>
      ) : null}
      <div className="parchment-panel" hidden={parchment !== "ritual"}>
        <HeaderRitual
          viewer={selfName}
          hour={clock.hour}
          near={ritualNear}
          saved={ritualMark}
          onComplete={() => {
            if (!selfName) return;
            setRitualMark(storeRitual(selfName, clock.ymd, clock.hour));
            setRitualGlowAt(Date.now());
            setRitualPhase(afterglowPhase(0, motion.reduced));
          }}
        />
      </div>
      <div className="parchment-panel" hidden={parchment !== "week" || !waveState.toggles.weekBoard}>
        {waveState.toggles.weekBoard ? (
          <section
            className="hud-panel px-3 py-3"
            id="today-chores"
            data-testid="today-chores"
            data-week-done={tally.complete ? "1" : "0"}
            data-week-kept={choreMarks?.week === clock.weekKey ? String(choreMarks.labels.length) : "0"}
          >
            <p className="pixel-label text-[#2a1a10]">本周小事</p>
            <p className="mt-1 text-xs text-[#6a3d18]" data-testid="week-tally">
              本周 {tally.done}/{tally.total}。点一下就做。做完会停住。只记在这台电脑，不公示，也不跟别人比。
            </p>
            <p className="mt-1 text-xs text-[#6a3d18]">可在村里新事里关掉。{WEEK_KEPT_LINE}</p>
            {tally.complete ? (
              <p className="week-ribbon-note" data-testid="week-done">
                {WEEK_DONE_LINE}
              </p>
            ) : null}
            {/* PV-PM-015 checkpoint */}
            {tally.complete && WEEK_DONE_SUMMARY_ENABLED ? (
              <WeekDoneSummary />
            ) : (
              <ul className="today-chores">
                {chores.map((item) => (
                  <li key={item.label} data-chore={item.label} data-done={item.done ? "1" : "0"}>
                    <button
                      type="button"
                      className="hud-btn hud-btn-ghost"
                      disabled={item.done || !selfName}
                      onClick={() => runChore(item.label)}
                    >
                      {choreButtonCopy(item.label, item.done, weekFacts.steps)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {POST_WEEK_PRESENCE_ENABLED && (glance === "ready" || glance === "done") ? (
              <PostWeekPresence phase={glance} onGlance={passGlance} />
            ) : null}
          </section>
        ) : null}
      </div>
      <div className="parchment-panel" hidden={parchment !== "season"}>
        <SeasonBanner
          seasonLabel={season.label}
          seasonId={season.id}
          festival={festival}
          people={people}
          onNotice={() => rememberChore("season")}
        />
      </div>
      </div>

      <div
        className="village-stage"
        data-card-open={selected ? "1" : "0"}
        data-split={split.toFixed(2)}
        style={{ ["--map-fr" as string]: String(split), ["--dock-fr" as string]: String(1 - split) }}
      >
        <div className="village-map-slot" data-testid="village-map-slot">
          {people.length === 0 ? (
            <div className="empty-yard" data-testid="empty-yard">
              <div className="empty-yard-art" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p>名册空着。小路先留在这里。</p>
            </div>
          ) : (
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
            homePulse={homePulse}
            onFindMe={() => {
              markGesture("find");
              visitOwnGate();
            }}
            mapAim={mapAim}
            ambientOn={ambientOn}
            onSfxMute={(muted) => saveComfort({ ...comfort, sfxMuted: muted })}
            onAmbient={setAmbientOn}
            onEmpty={(x, y) => {
              if (!selfName) return;
              updateWave((current) => {
                const sat = sitDown(current, x, y);
                return {
                  ...sat,
                  footprints: current.toggles.footprints
                    ? [...current.footprints, { x: Math.round(x), y: Math.round(y), t: nowMs() }].slice(-8)
                    : current.footprints,
                };
              });
            }}
          />
          )}
        </div>
        <div
          className="split-bar"
          data-testid="split-bar"
          role="separator"
          aria-orientation="horizontal"
          aria-label="调整地图和信号卡，上下方向键微调"
          aria-valuemin={28}
          aria-valuemax={78}
          aria-valuenow={Math.round(split * 100)}
          aria-valuetext={`地图 ${Math.round(split * 100)}%`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSplit((value) => stepSplit(value, -0.04));
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setSplit((value) => stepSplit(value, 0.04));
            } else if (event.key === "Home") {
              event.preventDefault();
              setSplit(SPLIT_CARD);
            } else if (event.key === "End") {
              event.preventDefault();
              setSplit(SPLIT_MAP);
            }
          }}
          onPointerDown={(event) => {
            const stage = event.currentTarget.parentElement;
            if (!stage) return;
            const rect = stage.getBoundingClientRect();
            const move = (ev: PointerEvent) => {
              const ratio = (ev.clientY - rect.top) / Math.max(1, rect.height);
              setSplit(clampSplit(ratio));
            };
            const up = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        >
          <button
            type="button"
            className="split-chip"
            data-testid="split-map"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setSplit(SPLIT_MAP)}
          >
            全地图
          </button>
          <button
            type="button"
            className="split-chip"
            data-testid="split-card"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setSplit(SPLIT_CARD)}
          >
            全卡片
          </button>
        </div>
        <div className="village-dock" data-testid="village-dock" data-open={selected ? "1" : "0"}>
          {selected ? (
            <SignalCard
              key={selected.name}
              person={selected}
              dataDateLabel={dateCopy.headline}
              dataDateDetail={dateCopy.detail}
              disclaimer={payload.disclaimer}
              line={fx && fx.actor === selected.name ? fx.line : null}
              socialReply={fx && fx.actor === selected.name ? socialReplyMark(fx, selfName) : null}
              bondNote={bondLine(familiarity[selected.name] ?? 0)}
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
              undoSessionId={undo && undo.name === selected.name && undo.viewer === selfName ? undo.id : null}
              onUndoExpire={() => setUndo(null)}
              stickerLabels={selected.name === selfName ? stickerLabels : []}
              canSticker={Boolean(selfName) && play.stickerDay !== clock.ymd && play.stickers.length < STICKERS.length}
              anonNote={anonLine(anon, clock.ymd, selected.name)}
              gardenCrop={play.garden2[selected.name] ?? null}
              onClose={() => {
                const name = selected.name;
                setSelectedName(null);
                setUndo(null);
                requestAnimationFrame(() => {
                  document.querySelector<HTMLButtonElement>(`[data-roster-name="${CSS.escape(name)}"]`)?.focus({ preventScroll: true });
                });
              }}
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
            <p className="empty-dock px-3 py-3 text-sm text-[#4a3a28]">点小人，或点名册。</p>
          )}
        </div>
      </div>
      </div>

      {broadcast && dismissedBroadcast !== broadcastKey ? (
        <div className="hud-panel flex items-center justify-between gap-3 px-3 py-2" data-testid="village-broadcast">
          <p className="pixel-label text-[#2a1a10]">{broadcast.line}</p>
          <button type="button" className="hud-btn hud-btn-ghost" onClick={() => setDismissedBroadcast(broadcastKey)}>
            收起
          </button>
        </div>
      ) : null}
      {shelfLine ? <p className="px-1 text-xs text-[#6a3d18]">{shelfLine}</p> : null}
      {visitFlags ? (
        <FirstRunGuide
          flags={visitFlags}
          onShowMotion={() => {
            const panel = document.querySelector<HTMLDetailsElement>("[data-testid='wave-d-panel']");
            if (panel) panel.open = true;
            document.querySelector<HTMLInputElement>("[data-testid='reduce-motion-toggle']")?.focus();
          }}
        />
      ) : null}
      <ComfortSettings
        comfort={comfort}
        selfName={selfName}
        preset={preset}
        names={(rosterMode === "empty" ? payload.people : people).map((person) => person.name)}
        onComfort={(next: Comfort) => saveComfort(next)}
        onSelf={(name, nextPreset) => saveSelf(name, name ? nextPreset : null)}
        motionReduced={motion.reduced}
      />
      <ReleaseNotes />
      <VillageHelp />

      <WaveDPanel
        selfName={selfName}
        wave={waveState}
        weekKey={clock.weekKey}
        ymd={clock.ymd}
        quoteUnlocked={play.quotes.length}
        quoteTotal={quoteCount()}
        names={people.map((person) => person.name)}
        line={waveLine}
        facts={weekFacts}
        marks={choreMarks}
        reduced={motion.reduced}
        onReduceMotion={(on) => saveComfort({ ...comfort, reduceMotion: on, motionOverride: true })}
        onToggle={(id: WaveSystemId, on: boolean) => updateWave((current: WaveDBlob) => setToggle(current, id, on))}
        onDiary={(index) => {
          if (!selfName) return;
          const result = setDiary(waveState, clock.ymd, index);
          setWaveLine(result.line);
          if (result.ok) updateWave(() => result.blob);
        }}
        onPorch={() => {
          updateWave((current) => togglePorch(current));
          markGesture("lamp");
        }}
        onWater={() => {
          if (!selfName) return;
          const result = waterOnce(waveState, clock.ymd);
          setWaveLine(result.line);
          if (result.ok) updateWave(() => result.blob);
        }}
        onBench={() => {
          if (!selfName) return;
          updateWave((current) => sitDown(current, 640, 420));
          setWaveLine(waveState.sit ? "从长椅上站起来了。" : "在空地上坐下了。");
        }}
        pinHint={pinHint}
        onPin={(name) => {
          const result = pinResult(waveState.pins, name);
          setPinHint(result.hint);
          updateWave((current) => ({ ...current, pins: pinResult(current.pins, name).pins }));
        }}
        onHat={(name) => updateWave((current) => ({ ...current, hats: toggleHat(current.hats, name) }))}
        onInstrument={(id) => updateWave((current) => setInstrument(current, id as WaveDBlob["instrument"]))}
        onYard={(id: YardActId) => {
          if (!selfName || waveSnap.viewer !== selfName) {
            setWaveLine("先选定「我是谁」，院里的事才记在这台电脑上。");
            return;
          }
          const result = playYard(waveState.yard, id, clock.ymd, systemOn(waveState, "yard"));
          setWaveLine(result.line);
          if (result.ok) {
            updateWave((current) => ({ ...current, yard: result.yard }));
            setVisitFlags((current) => (current && !current.yard ? { ...current, yard: true } : current));
          }
        }}
        onLane={(id: LaneActId) => {
          if (!selfName || waveSnap.viewer !== selfName) {
            setWaveLine("先选定「我是谁」，路边的事才记在这台电脑上。");
            return;
          }
          const result = playLane(waveState.lane, id, clock.ymd, systemOn(waveState, "lane"));
          setWaveLine(result.line);
          if (result.ok) updateWave((current) => ({ ...current, lane: result.lane }));
        }}
        onHome={() => {
          if (!selfName) {
            setWaveLine("先选定「我是谁」，镜头才回得了自己的小屋。");
            return;
          }
          visitOwnGate();
        }}
        onPostcard={() => {
          const meta = postcardMeta(selfName, clock.ymd);
          const canvas = document.querySelector("canvas[data-testid='village-map']") as HTMLCanvasElement | null;
          if (!canvas) {
            setWaveLine(meta.caption);
            return;
          }
          const link = document.createElement("a");
          link.download = meta.filename;
          link.href = canvas.toDataURL("image/png");
          link.click();
          setWaveLine(`${meta.caption}。已存到这台电脑。`);
        }}
      />

      <VillageLoopsPanel
        selfName={selfName}
        blob={loopBlob}
        pebbles={loopPebbles}
        ymd={clock.ymd}
        reduced={motion.reduced}
        line={loopLine && loopLine.viewer === selfName ? loopLine.text : null}
        onAct={runLoop}
      />

      <YardNookPanel
        selfName={selfName}
        blob={nookBlob}
        session={nookSession}
        ymd={clock.ymd}
        reduced={motion.reduced}
        line={nookLine && nookLine.viewer === selfName ? nookLine.text : null}
        onAct={runNook}
      />

      <div className="thumb-bar" data-testid="thumb-bar">
        <button type="button" className="hud-btn" data-testid="thumb-home" disabled={!selfName} onClick={() => {
          visitOwnGate("镜头回到自己的小屋。");
        }}>
          回家
        </button>
        <button type="button" className="hud-btn hud-btn-ghost" onClick={() => {
          document.querySelector<HTMLElement>("[data-testid='comfort-settings']")?.setAttribute("open", "");
          document.querySelector<HTMLElement>("[data-testid='self-picker']")?.focus();
        }}>
          我是谁
        </button>
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
        {people.length === 0 && error ? (
          <div className="space-y-2 px-3 py-6 text-center text-sm text-[#4a3a28]">
            <p>名册没请来。</p>
            <button type="button" className="hud-btn" onClick={refresh}>
              再试一次
            </button>
          </div>
        ) : people.length === 0 && loading ? (
          <p className="px-3 py-6 text-center text-sm text-[#4a3a28]" data-testid="roster-loading">
            正在请名册…
          </p>
        ) : people.length === 0 ? (
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
                  data-bond={String(familiarity[person.name] ?? 0)}
                  aria-label={`${person.name}，${person.scored ? "有分" : "未评分"}`}
                  aria-expanded={active}
                  aria-controls="signal-card-dialog"
                  aria-current={active ? "true" : undefined}
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
                  <span className="hud-chip">
                    {(familiarity[person.name] ?? 0) > 0 ? (
                      <i className="bond-pips" data-testid="bond-pips" aria-hidden>
                        {"●".repeat(familiarity[person.name] ?? 0)}
                      </i>
                    ) : null}
                    {person.scored ? STATE_LABELS[person.state] : "未评分"}
                  </span>
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

function VillageHelp() {
  return (
    <details className="hud-panel" data-testid="village-help">
      <summary className="hud-title cursor-pointer">村里图例</summary>
      <div className="space-y-2 px-3 py-3 text-sm text-[#2a1a10]">
        <p>琥珀名牌是有分的彩猫，灰名牌是未评分的灰猫。全景默认只留自己、靠近的人和钉住的名牌，最多八张。安静村子更少。点「全显名牌」才把其余的打开。</p>
        <p>安静村子默认开着，花瓣和广播会少很多。关掉之后，蝴蝶和萤火才会出现。</p>
        <p>干活是方块，摸鱼是波浪，在任务上是等号。颜色只是辅助，形状也分得开。</p>
        <p>这里不收录说过的话。善意、挥手和田里的小玩具都记在这台电脑的「我是谁」上。</p>
        <p>村里小玩有十处：信箱、稻草人、水井、菜畦、石子、灯笼、告示、鸡舍、篱门、野餐垫。进度跟着「我是谁」。石子只留在这个标签页，灯笼在减少动作时不闪。</p>
        <p>屋边角落还有水壶、水漂、柴堆、衣绳、石桥、猫、雨水桶、路口牌、花盆和窗板。水漂和花盆只留这个标签页。减少动作时衣绳和窗板不再晃。</p>
      </div>
    </details>
  );
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
  onNotice,
}: {
  seasonLabel: string;
  seasonId: string;
  festival: { label: string; pa: string } | null;
  people: PersonWithState[];
  onNotice: () => void;
}) {
  const upcoming = nextFestival();
  const totals = teamTotals(people);
  return (
    <section className={`season-banner season-${seasonId}`} data-testid="season-detail" onClick={onNotice}>
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
