"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadVillageArt, resetVillageArt, artReady } from "@/lib/sprites";
import {
  WORLD_H,
  WORLD_W,
  cameraFocus,
  clampCamera,
  viewSpan,
  setViewDevice,
  defaultCamera,
  hitTest,
  paintBootField,
  paintVillage,
  placeVillagers,
  updateVillager,
} from "@/lib/pixel-scene";
import { isKindnessKind, type VillageFx } from "@/lib/interactions";
import { testHooksEnabled } from "@/lib/test-hooks";
import {
  COMBO_SPELL,
  COMBO_TAPS,
  COMBO_WINDOW_MS,
  KIND_SPELLS,
  MAGIC_DAILY_ENABLED,
  MAGIC_SPELLS_ENABLED,
  MAGIC_UI_FEEDBACK_ENABLED,
  PERSON_SPELLS,
  SELF_SPELLS,
  STATUS_AFTER,
  dailyMagic,
  groundSpell,
  hitLandmark,
  magicBudget,
  pickSpell,
  type MagicLevel,
} from "@/features/magic-town/magic-town";
import { MagicLayer, type MagicPerson } from "@/features/magic-town/magic-layer";
import { DOUBLE_TAP_MS, LONG_PRESS_MS, MAGIC_PLAY_ENABLED } from "@/features/magic-play/magic-play";
import { PlayController, type PlaySpot } from "@/features/magic-play/play-controller";
import { playMagicSfx } from "@/features/gesture-sfx/gesture-sfx";
import { deriveLoadStage, loadStageLabel, type LoadStage } from "@/lib/load-machine";
import { hitSpot } from "@/lib/play-systems";
import type { PersonWithState } from "@/lib/types";
import { EASING, particleAllowance } from "@/lib/wave-d";
import { FIND_ME_HOLD_MS, FIND_ME_LABEL, plateLegend } from "@/lib/worldcraft";
import { availabilityFor, shanghaiClock, type SceneLife } from "@/lib/village-life";
import { NIGHT_WASH_ENABLED, nightWashMark } from "@/features/night-wash/night-wash";
import nightWashStyles from "@/features/night-wash/night-wash.module.css";
import { ambientLifeMark, ambientSpeckCount } from "@/features/ambient-life/ambient-life";
import { kindnessGlowMark } from "@/features/kindness-footprint-glow/kindness-footprint-glow";
import { groundClusterCount, groundPropMark } from "@/features/season-ground-props/season-ground-props";
import { selfYardMark } from "@/features/self-yard-marker/self-yard-marker";
import { NIGHT_WASH_V2_ENABLED, nightWashV2Mark } from "@/features/night-wash-v2/night-wash-v2";
import nightWashV2Styles from "@/features/night-wash-v2/night-wash-v2.module.css";
import { MID_ZOOM, NAMEPLATE_MID_ENABLED, QUIET_SHORT_CAP, SHORT_CAP } from "@/features/nameplate-mid/nameplate-mid";
import { afterglowPhase } from "@/features/ritual-afterglow/ritual-afterglow";
import afterglowStyles from "@/features/ritual-afterglow/ritual-afterglow.module.css";
import { autumnPaletteMark } from "@/features/autumn-palette/autumn-palette";
import { scoreDayMark } from "@/features/score-day-immersion/score-day-immersion";
import scoreDayStyles from "@/features/score-day-immersion/score-day-immersion.module.css";
import { autumnDotsOn, nightReadMark } from "@/features/night-readability/night-readability";
import { viewportMode } from "@/features/nameplate-viewport/nameplate-viewport";
import { NAMEPLATE_CLEAR_ENABLED, NEAR_PLATE_CAP } from "@/features/nameplate-clear/nameplate-clear";
import { toyPulseMark } from "@/features/yard-toy-focus/yard-toy-focus";
import { GestureChrome } from "@/features/gesture-sfx/gesture-chrome";
import { autumnLeafCount, leafDriftMark } from "@/features/autumn-leaf-drift/autumn-leaf-drift";
import { mapDepthMark } from "@/features/map-depth/map-depth";
import { meadowBreathCount, meadowBreathMark } from "@/features/meadow-breath/meadow-breath";
import { villagerReadMark } from "@/features/villager-read/villager-read";
import { pathMeadowMark } from "@/features/path-meadow/path-meadow";
import { cornerMeadowMark } from "@/features/corner-meadow/corner-meadow";
import { buildingVolumeMark } from "@/features/building-volume/building-volume";
import { villagerGroundMark } from "@/features/villager-ground/villager-ground";
import { nightHearthMark } from "@/features/night-hearth/night-hearth";
import { nightWindowPulseMark } from "@/features/night-window-pulse/night-window-pulse";
import { pathFocusMark } from "@/features/path-focus/path-focus";
import { tapFeedbackMark } from "@/features/villager-tap-feedback/villager-tap-feedback";
import { skyWashMark } from "@/features/sky-wash/sky-wash";
import { pathGlowMark } from "@/features/path-micro-glow/path-micro-glow";
import { isNextBeatAim, nextBeatGlowMark } from "@/features/next-beat-path-glow/next-beat-path-glow";
import { NARROW_TEACH_PX, teachAria, teachHint, teachIsNarrow, teachLine, teachMode } from "@/features/narrow-teach-copy/narrow-teach-copy";
import { nameplateAirMark } from "@/features/nameplate-air/nameplate-air";
import { narrowFillCamera, narrowMapFillMark } from "@/features/narrow-map-fill/narrow-map-fill";
import { autumnHintMark } from "@/features/autumn-hint/autumn-hint";
import { findPrintCount, findPrintMark } from "@/features/find-footprints/find-footprints";
import { eaveFlashOn, eaveGlowMark } from "@/features/home-eave-glow/home-eave-glow";
import { PLAZA, plazaInView, plazaSitMark } from "@/features/plaza-sit/plaza-sit";
import { waitingCueMark } from "@/features/waiting-cue/waiting-cue";
import { MAP_HUD_FOLD_ENABLED, hitToy } from "@/features/map-hud-fold/map-hud-fold";
import type { ToyId } from "@/features/yard-toy-focus/yard-toy-focus";
import { IDENTITY_LAND_ENABLED, IDENTITY_LAND_MS } from "@/features/identity-land/identity-land";
import { HOME_SETTLE_ENABLED, HOME_SETTLE_MS, homeSettleFrame, roofFocus } from "@/features/home-settle/home-settle";
import { landmarkSettleFrame, landmarkSettleMode, landmarkSettleNarrow } from "@/features/landmark-settle/landmark-settle";
import { WaveButton } from "@/features/wave-gift/wave-button";
import { thumbShowsHome } from "@/features/thumb-identity/thumb-identity";
import { MAP_FIELD_HOLD_LINE, mapPendingAttr } from "@/features/map-field-hold/map-field-hold";
import { visitorLegend } from "@/features/header-lean/header-lean";
import { MORE_LEAN_ENABLED } from "@/features/more-lean/more-lean";
import { mapHomeAria, mapHomeFace } from "@/features/one-home-word/one-home-word";
import { MoreDiscoverDot } from "@/features/more-discover/more-cue";
import { selfRecognizeMark } from "@/features/self-recognize/self-recognize";
import { selfGhostSuppressed } from "@/features/self-plate-ghost/self-plate-ghost";
import { plateClearBottom } from "@/features/zoom-plate-lift/zoom-plate-lift";
import { findMePathMark } from "@/features/find-me-path/find-me-path";
import { selfInFrame } from "@/features/find-me-one-line/find-me-one-line";
import { nightPlateMark } from "@/features/night-plate-contrast/night-plate-contrast";
import { gateArriveFor, gateArriveHolds } from "@/features/gate-arrive/gate-arrive";

type SpotHit = { id: string; kind: "gather" | "view"; title: string };

type Props = {
  people: PersonWithState[];
  selectedName: string | null;
  fx: VillageFx | null;
  life: SceneLife;
  forceTimeout?: boolean;
  bootAttempt?: number;
  onSelect: (name: string | null) => void;
  onRetry?: () => void;
  onSpot?: (spot: SpotHit) => void;
  onTogglePlates?: () => void;
  onEmote?: (kind: "stretch" | "sit" | "clap" | "wave") => void;
  homePulse?: number;
  onEmpty?: (x: number, y: number) => void;
  onFindMe?: (framed: boolean) => void;
  mapAim?: { token: number; kind?: string; x: number; y: number } | null;
  ambientOn?: boolean;
  onSfxMute?: (muted: boolean) => void;
  onAmbient?: (on: boolean) => void;
  onMapReady?: () => void;
  mapMore?: boolean;
  onMapMore?: (open: boolean) => void;
  onToyTap?: (id: ToyId) => void;
  identityPulse?: number;
  homeSettle?: number;
  onHome?: () => void;
  legendShut?: number;
  sheetExtra?: ReactNode;
  children?: ReactNode;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export function VillageScene({
  people,
  selectedName,
  fx,
  life,
  forceTimeout = false,
  bootAttempt = 0,
  onSelect,
  onRetry,
  onSpot,
  onTogglePlates,
  onEmote,
  homePulse = 0,
  onEmpty,
  onFindMe,
  mapAim = null,
  ambientOn = false,
  onSfxMute,
  onAmbient,
  onMapReady,
  mapMore = false,
  onMapMore,
  onToyTap,
  identityPulse = 0,
  homeSettle = 0,
  onHome,
  legendShut = 0,
  sheetExtra = null,
  children,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const villagers = useMemo(() => placeVillagers(people), [people]);
  const villagersRef = useRef(villagers);
  const selectedRef = useRef<string | null>(selectedName);
  const hoverRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const fxRef = useRef(fx);
  const lifeRef = useRef(life);
  const tapRef = useRef<{ name: string; at: number } | null>(null);
  const magicRef = useRef<MagicLayer | null>(null);
  const groundTimer = useRef(0);
  const selectTimer = useRef(0);
  const magicRoll = useRef({ n: 0, last: "" as string, fxId: -1, opened: "" });
  const legendRef = useRef<HTMLDetailsElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<LoadStage>("terrain");
  const [hintOpen, setHintOpen] = useState(false);
  const [teachNarrow, setTeachNarrow] = useState<boolean | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [seenShut, setSeenShut] = useState(legendShut);
  if (legendShut !== seenShut) {
    setSeenShut(legendShut);
    if (legendShut) setLegendOpen(false);
  }
  const teachNarrowRef = useRef<boolean | null>(null);
  const stageRef = useRef<LoadStage>("terrain");
  const onSpotRef = useRef(onSpot);
  const onEmptyRef = useRef(onEmpty);
  const onToyTapRef = useRef(onToyTap);
  const forceRef = useRef(forceTimeout);
  const startCam = defaultCamera();
  const [zoom, setZoom] = useState(startCam.zoom);
  const [camMark, setCamMark] = useState({
    x: Math.round(startCam.x),
    y: Math.round(startCam.y),
    zoom: startCam.zoom,
  });
  const zoomRef = useRef(startCam.zoom);
  const camRef = useRef({ x: startCam.x, y: startCam.y });
  const userCam = useRef(false);
  const fitted = useRef(false);
  const [mapFill, setMapFill] = useState<"village" | "world">("world");
  const drag = useRef<{ x: number; y: number; moved: boolean; charging?: boolean } | null>(null);
  /** PV-MAGIC-PLAY-001 wizard play: gestures, counts and the little toast. */
  const playRef = useRef<PlayController | null>(null);
  const [playToast, setPlayToast] = useState<{ text: string; n: number } | null>(null);
  const playToastTimer = useRef(0);
  const kickRef = useRef<(() => void) | null>(null);
  const wheelAt = useRef(0);
  const glowUntilRef = useRef(0);
  const idleAtRef = useRef(Date.now());
  const aimHoldRef = useRef(0);
  const gateHeldRef = useRef(false);
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    if (!ready) return;
    onMapReadyRef.current?.();
  }, [ready]);

  useEffect(() => {
    villagersRef.current = villagers;
  }, [villagers]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onSpotRef.current = onSpot;
  }, [onSpot]);

  useEffect(() => {
    onEmptyRef.current = onEmpty;
  }, [onEmpty]);

  useEffect(() => {
    onToyTapRef.current = onToyTap;
  }, [onToyTap]);

  useEffect(() => {
    if (!mapAim?.token) return;
    userCam.current = true;
    const arrived = gateArriveFor(mapAim.kind);
    gateHeldRef.current = gateArriveHolds(mapAim.kind);
    const nextZoom = arrived?.zoom ?? 3;
    const focus = arrived
      ? { x: arrived.x, y: arrived.y }
      : clampCamera(mapAim.x - WORLD_W / nextZoom / 2, mapAim.y - WORLD_H / nextZoom / 2, nextZoom);
    const mode = landmarkSettleMode({ quiet: Boolean(life.quiet), reduced: Boolean(life.reduceMotion) });
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    if (mode !== "ease") {
      camRef.current = focus;
      setCamMark({ x: focus.x, y: focus.y, zoom: nextZoom });
      aimHoldRef.current = Date.now() + 1800;
      kickRef.current?.();
      return;
    }
    const narrow = landmarkSettleNarrow(hostRef.current?.clientWidth || window.innerWidth);
    const from = clampCamera(camRef.current.x, camRef.current.y, nextZoom);
    camRef.current = from;
    const started = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const frame = landmarkSettleFrame({ elapsedMs: now - started, narrow, from, to: focus });
      camRef.current = clampCamera(frame.x, frame.y, zoomRef.current);
      aimHoldRef.current = Date.now() + 400;
      kickRef.current?.();
      if (!frame.done) {
        raf = requestAnimationFrame(step);
        return;
      }
      camRef.current = focus;
      setCamMark({ x: focus.x, y: focus.y, zoom: nextZoom });
      aimHoldRef.current = Date.now() + 1800;
      kickRef.current?.();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mapAim, life.quiet, life.reduceMotion]);

  useEffect(() => {
    if (!homePulse || !life.selfName) return;
    userCam.current = true;
    const person = villagersRef.current.find((v) => v.name === life.selfName);
    if (!person) return;
    const nextZoom = 2;
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    const focus = cameraFocus(person, nextZoom);
    camRef.current = focus;
    setCamMark({ x: Math.round(focus.x), y: Math.round(focus.y), zoom: nextZoom });
    kickRef.current?.();
  }, [homePulse, life.selfName]);

  useLayoutEffect(() => {
    if (!HOME_SETTLE_ENABLED || !homeSettle || !life.selfName) return;
    const person = villagers.find((v) => v.name === life.selfName);
    if (!person) return;
    userCam.current = true;
    const toZoom = 2;
    const roof = roofFocus(person);
    const focus = clampCamera(roof.x - WORLD_W / toZoom / 2, roof.y - WORLD_H / toZoom / 2, toZoom);
    const from = { x: camRef.current.x, y: camRef.current.y, zoom: zoomRef.current };
    const to = { x: focus.x, y: focus.y, zoom: toZoom };
    const started = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const frame = homeSettleFrame({ elapsedMs: now - started, durationMs: HOME_SETTLE_MS, from, to });
      zoomRef.current = frame.done ? to.zoom : frame.zoom;
      camRef.current = clampCamera(frame.done ? to.x : frame.x, frame.done ? to.y : frame.y, zoomRef.current);
      aimHoldRef.current = Date.now() + 400;
      kickRef.current?.();
      if (!frame.done) {
        raf = requestAnimationFrame(step);
        return;
      }
      setZoom(to.zoom);
      setCamMark({ x: camRef.current.x, y: camRef.current.y, zoom: to.zoom });
      aimHoldRef.current = Date.now() + HOME_SETTLE_MS;
      kickRef.current?.();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [homeSettle, life.selfName, villagers]);

  useLayoutEffect(() => {
    if (!IDENTITY_LAND_ENABLED || !identityPulse || !life.selfName) return;
    const person = villagersRef.current.find((v) => v.name === life.selfName);
    if (!person) return;
    userCam.current = true;
    const nextZoom = zoomRef.current;
    const focus = cameraFocus(person, nextZoom);
    camRef.current = focus;
    setCamMark({ x: Math.round(focus.x), y: Math.round(focus.y), zoom: nextZoom });
    glowUntilRef.current = Date.now() + FIND_ME_HOLD_MS;
    aimHoldRef.current = Date.now() + IDENTITY_LAND_MS;
    // landing on yourself: a star iris sweep and a level-up sparkle on your cat
    if (magicRef.current && lifeRef.current?.magic && lifeRef.current.magic !== "off" && !lifeRef.current.reduceMotion) {
      magicRef.current.transition("transitions/star-iris");
      if (MAGIC_UI_FEEDBACK_ENABLED) magicRef.current.cast("ui/level-up", person.x, person.y);
    }
    kickRef.current?.();
  }, [identityPulse, life.selfName]);

  useEffect(() => {
    forceRef.current = forceTimeout;
  }, [forceTimeout]);

  const shownStage: LoadStage = forceTimeout ? "timeout" : failed ? "failed" : ready ? "ready" : stage;
  useEffect(() => {
    stageRef.current = shownStage;
  });

  useEffect(() => {
    fxRef.current = fx;
  }, [fx]);

  useEffect(() => {
    lifeRef.current = life;
    kickRef.current?.();
  }, [life]);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const narrow = window.matchMedia(`(max-width: ${NARROW_TEACH_PX}px)`);
    const sync = () => {
      const next = teachIsNarrow(window.innerWidth);
      teachNarrowRef.current = next;
      setTeachNarrow(next);
      const host = hostRef.current;
      if (host) host.dataset.teach = teachMode(next);
      canvasRef.current?.setAttribute("aria-label", teachAria(next));
      if (hintRef.current && !hoverRef.current) hintRef.current.textContent = teachHint(next);
    };
    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const wide = window.matchMedia("(min-width: 481px)");
    const sync = () => setLegendOpen(wide.matches);
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mark = () => {
      idleAtRef.current = Date.now();
    };
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);
    window.addEventListener("wheel", mark, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("wheel", mark);
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selectedName;
    if (!selectedName) return;
    userCam.current = true;
    const person = villagersRef.current.find((v) => v.name === selectedName);
    if (!person) return;
    const nextZoom = Math.max(Math.round(zoomRef.current), 2);
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    camRef.current = cameraFocus(person, nextZoom);
  }, [selectedName]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let canvas = canvasRef.current;
    if (!canvas || canvas.parentElement !== host) {
      canvas = document.createElement("canvas");
      canvas.className = "pixelated block h-full w-full cursor-grab active:cursor-grabbing";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", teachNarrowRef.current == null ? "" : teachAria(teachNarrowRef.current));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.touchAction = "none";
      canvas.style.display = "block";
      canvas.dataset.testid = "village-map";
      canvas.style.imageRendering = "pixelated";
      canvas.style.setProperty("-webkit-font-smoothing", "none");
      canvas.style.setProperty("font-smooth", "never");
      host.insertBefore(canvas, host.firstChild);
      canvasRef.current = canvas;
    }

    // desynchronized canvases can present a blank frame for the whole tab
    // until the next DOM change (for example opening 「村里的事」).
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setFailed(true);
      return;
    }

    const resize = () => {
      const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
      const cssW = Math.max(1, Math.floor(host.clientWidth));
      const cssH = Math.max(1, Math.floor(host.clientHeight) || Math.round((cssW * WORLD_H) / WORLD_W));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const nextW = cssW * dpr;
      const nextH = cssH * dpr;
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      setViewDevice(nextW, nextH);
      const rawW = Math.floor(host.clientWidth);
      const rawH = Math.floor(host.clientHeight);
      if (!fitted.current && !userCam.current && rawW > 0 && rawH > 0) {
        const next = narrowFillCamera({ people: villagersRef.current, cssW: rawW, cssH: rawH });
        if (next) {
          fitted.current = true;
          zoomRef.current = next.zoom;
          camRef.current = { x: next.x, y: next.y };
          setZoom(next.zoom);
          setCamMark({ x: next.x, y: next.y, zoom: next.zoom });
          setMapFill(narrowMapFillMark(next.zoom));
        }
      }
      return dpr;
    };

    let art = artReady();
    const bootStarted = performance.now();
    if (!art) resetVillageArt();
    const stageTimer = window.setInterval(() => {
      if (art || artReady()) return;
      const elapsed = performance.now() - bootStarted;
      setStage(
        deriveLoadStage({
          elapsedMs: elapsed,
          artReady: false,
          rosterCount: villagersRef.current.length,
          failed: false,
          forcedTimeout: forceRef.current,
        }),
      );
    }, 200);
    loadVillageArt()
      .then(() => {
        art = true;
        setReady(true);
        setFailed(false);
        setStage("ready");
        kickRef.current?.();
      })
      .catch((error) => {
        console.error(error);
        setFailed(true);
        setStage("timeout");
      });

    const paint = (now: number, start: number) => {
      const dpr = resize();
      if (!art) {
        paintBootField(ctx, canvas.width, canvas.height, loadStageLabel(stageRef.current === "ready" ? "terrain" : stageRef.current));
        return;
      }
      const t = lifeRef.current.reduceMotion ? 0 : (now - start) / 1000;
      const list = villagersRef.current;
      for (const v of list) updateVillager(v, t);
      const selected = list.find((v) => v.name === selectedRef.current);
      if (selected && !drag.current && !gateHeldRef.current && Date.now() > aimHoldRef.current) {
        const target = cameraFocus(selected, zoomRef.current);
        camRef.current.x += (target.x - camRef.current.x) * EASING.camera;
        camRef.current.y += (target.y - camRef.current.y) * EASING.camera;
      }
      camRef.current = clampCamera(camRef.current.x, camRef.current.y, zoomRef.current);
      const emphasize = new Set<string>();
      if (selectedRef.current) emphasize.add(selectedRef.current);
      if (hoverRef.current) emphasize.add(hoverRef.current);
      const activeFx = fxRef.current;
      const nowMs = Date.now();
      if (activeFx && nowMs - activeFx.startedAt < activeFx.duration && activeFx.partner) {
        emphasize.add(activeFx.partner);
      }
      const highlight = nowMs < glowUntilRef.current;
      host.dataset.selfHighlight = highlight ? "1" : "0";
      const lifeNowEarly = lifeRef.current;
      if (lifeNowEarly) {
        const span = viewSpan(zoomRef.current);
        const nearPlaza = plazaInView({ x: camRef.current.x, y: camRef.current.y, w: span.w, h: span.h }, PLAZA);
        const plaza = plazaSitMark({
          idleMs: nowMs - idleAtRef.current,
          near: nearPlaza,
          reduced: Boolean(lifeNowEarly.reduceMotion),
        });
        lifeNowEarly.plazaSit = plaza;
        host.dataset.plazaSit = plaza;
        const printMark = findPrintMark(lifeNowEarly.findPrintAt ?? null, nowMs, Boolean(lifeNowEarly.reduceMotion));
        host.dataset.findPrints = printMark;
        host.dataset.findPrintCount = String(
          printMark === "off" ? 0 : findPrintCount(lifeNowEarly.selfName ?? "", printMark === "still"),
        );
        const eave = eaveGlowMark({
          hasSelf: Boolean(lifeNowEarly.selfName),
          flashing: eaveFlashOn(lifeNowEarly.eaveFlashAt ?? null, nowMs),
          reduced: Boolean(lifeNowEarly.reduceMotion),
        });
        host.dataset.eaveGlow = eave;
        host.dataset.autumnHint = autumnHintMark({
          month: lifeNowEarly.calendarMonth ?? 0,
          quiet: Boolean(lifeNowEarly.quiet),
          reduced: Boolean(lifeNowEarly.reduceMotion),
        });
        if (!focusStarted) {
          focusStarted = now;
          focusTimer = window.setTimeout(() => kick(), 30_000);
        }
        const focus = pathFocusMark({
          elapsedMs: now - focusStarted,
          reduced: Boolean(lifeNowEarly.reduceMotion),
        });
        lifeNowEarly.pathFocus = focus;
        host.dataset.pathFocus = focus;
        const tap = tapRef.current;
        lifeNowEarly.tapName = tap?.name ?? null;
        lifeNowEarly.tapAt = tap?.at ?? null;
        const tapMark = tap
          ? tapFeedbackMark({ elapsedMs: nowMs - tap.at, reduced: Boolean(lifeNowEarly.reduceMotion) })
          : "off";
        host.dataset.tapFeedback = tapMark;
        if (tap && tapMark === "off") tapRef.current = null;
        host.dataset.skyWash = skyWashMark(shanghaiClock().hour);
        const aim = lifeNowEarly.mapAim;
        host.dataset.pathGlow = aim
          ? pathGlowMark({
              elapsedMs: nowMs - aim.at,
              reduced: Boolean(lifeNowEarly.reduceMotion),
              quiet: Boolean(lifeNowEarly.quiet),
            })
          : "off";
        host.dataset.nextBeatGlow =
          aim && isNextBeatAim(aim.kind)
            ? nextBeatGlowMark({
                elapsedMs: nowMs - aim.at,
                reduced: Boolean(lifeNowEarly.reduceMotion),
                quiet: Boolean(lifeNowEarly.quiet),
              })
            : "off";
        host.dataset.findPath = lifeNowEarly.findPathAt
          ? findMePathMark({
              elapsedMs: nowMs - lifeNowEarly.findPathAt,
              quiet: Boolean(lifeNowEarly.quiet),
              reduced: Boolean(lifeNowEarly.reduceMotion),
            })
          : "off";
        host.dataset.nightWindow = nightWindowPulseMark(
          Boolean(NIGHT_WASH_V2_ENABLED && lifeNowEarly.sessionNight),
          Boolean(lifeNowEarly.reduceMotion),
        );
        host.dataset.cornerMeadow = cornerMeadowMark(Boolean(lifeNowEarly.reduceMotion));
      }
      host.dataset.waveReply =
        activeFx && activeFx.kind === "wave" && nowMs - activeFx.startedAt < activeFx.duration ? "1" : "0";
      if (lifeRef.current) {
        lifeRef.current.selfHighlight = highlight;
        const guide = document.querySelector("[data-testid='first-run-guide']");
        const canvasRect = canvas.getBoundingClientRect();
        const guideRect = guide instanceof HTMLElement ? guide.getBoundingClientRect() : null;
        const guideStyle = guide instanceof HTMLElement ? getComputedStyle(guide) : null;
        const guideHidden =
          !guideRect ||
          !guideStyle ||
          guideStyle.display === "none" ||
          guideStyle.visibility === "hidden" ||
          Number(guideStyle.opacity) === 0 ||
          guideRect.height <= 0;
        lifeRef.current.plateClearBottom = guideHidden
          ? null
          : plateClearBottom({
              canvasTop: canvasRect.top,
              canvasHeight: canvasRect.height,
              canvasBitmapH: canvas.height,
              guideTop: guideRect.top,
              guideHeight: guideRect.height,
            });
      }
      const painted = paintVillage(
        ctx,
        canvas.width,
        canvas.height,
        camRef.current.x,
        camRef.current.y,
        zoomRef.current,
        list,
        t,
        selectedRef.current,
        emphasize,
        dpr,
        activeFx && Date.now() - activeFx.startedAt < activeFx.duration ? activeFx : null,
        lifeRef.current,
        (overlayCtx) => {
          // PV-MAGIC-001: fx over the world, under the plates
          const lifeMagic = lifeRef.current;
          const level: MagicLevel = lifeMagic?.magic ?? "off";
          const narrow = canvas.clientWidth > 0 && canvas.clientWidth < 600;
          const budget = magicBudget(level, { reduceMotion: Boolean(lifeMagic?.reduceMotion), narrow });
          if (!magicRef.current) {
            if (!budget.on) return;
            magicRef.current = new MagicLayer();
          }
          const layer = magicRef.current;
          const clock = shanghaiClock();
          const daily = MAGIC_DAILY_ENABLED ? dailyMagic(clock.ymd) : null;
          const roll = magicRoll.current;
          if (budget.on && budget.spells > 0 && activeFx && activeFx.id !== roll.fxId && nowMs - activeFx.startedAt < activeFx.duration) {
            roll.fxId = activeFx.id;
            if (activeFx.kind === "wave" || isKindnessKind(activeFx.kind)) {
              const target = list.find((v) => v.name === (activeFx.partner ?? activeFx.actor));
              const actor = activeFx.kind === "wave" && activeFx.partner ? list.find((v) => v.name === activeFx.actor) : null;
              const on = actor && target && budget.animate ? playOn() : null;
              if (on && actor && target && on.play.chorus(on.layer, actor, target)) playFlush();
              else if (target) {
                roll.n += 1;
                const spell = pickSpell(KIND_SPELLS, roll.n);
                layer.cast(spell, target.x, target.y);
                const after = STATUS_AFTER[spell];
                if (after) layer.castOn(after.id, target.name, after.seconds);
              }
            }
          }
          if (daily && budget.animate && budget.spells > 0 && roll.opened !== clock.ymd && layer.stats.ready) {
            roll.opened = clock.ymd;
            const key = `village-magic-opened:${clock.ymd}`;
            let seen = false;
            try {
              seen = window.sessionStorage.getItem(key) === "1";
              window.sessionStorage.setItem(key, "1");
            } catch {
              seen = false;
            }
            if (!seen) {
              layer.cast(daily.opener, PLAZA.x, PLAZA.y);
              // first visit of the day: a small achievement banner pops over the plaza
              if (MAGIC_UI_FEEDBACK_ENABLED) layer.cast("ui/achievement", PLAZA.x, PLAZA.y - 70);
            }
          }
          const span = viewSpan(zoomRef.current);
          layer.render(
            overlayCtx,
            {
              camX: Math.round(camRef.current.x),
              camY: Math.round(camRef.current.y),
              spanW: span.w,
              spanH: span.h,
              viewW: canvas.width,
              viewH: canvas.height,
              dpr,
              zoom: zoomRef.current,
            },
            {
              budget,
              night: Boolean(lifeMagic?.sessionNight),
              hour: clock.hour,
              seasonId: lifeMagic?.decor?.seasonId ?? "",
              daily,
              people: list as unknown as MagicPerson[],
              now: budget.animate ? (now - start) / 1000 : 0,
            },
          );
          host.dataset.magic = budget.on ? level : "off";
          host.dataset.magicSpells = String(layer.stats.spells);
        },
      );
      host.dataset.plateCount = String(painted.plates);
      host.dataset.plateShort = String(painted.shortPlates);
      host.dataset.plateRead = JSON.stringify(painted.reads);
      const span = viewSpan(zoomRef.current);
      host.dataset.viewSpanW = String(span.w);
      host.dataset.viewSpanH = String(span.h);
      host.dataset.peopleXy = JSON.stringify(
        list.map((person) => ({ name: person.name, x: Math.round(person.x), y: Math.round(person.y) })),
      );
      canvas.dataset.villageReady = "1";
      const sessionNight = Boolean(lifeRef.current?.sessionNight);
      const decorNight = Boolean(lifeRef.current?.decor?.night);
      const nightMark = NIGHT_WASH_V2_ENABLED
        ? nightWashV2Mark(sessionNight)
        : decorNight
          ? NIGHT_WASH_ENABLED
            ? "cool"
            : "flat"
          : "off";
      canvas.dataset.nightPaint = nightMark;
      canvas.dataset.nightWash = nightMark;
      canvas.classList.toggle("night-wash-active", nightMark === "active");
      const lifeNow = lifeRef.current;
      const glowAt = lifeNow?.ritualGlowAt;
      const glowPhase = afterglowPhase(glowAt == null ? -1 : Date.now() - glowAt, Boolean(lifeNow?.reduceMotion));
      canvas.dataset.ritualAfterglow = glowPhase;
      canvas.dataset.autumnPalette = autumnPaletteMark(lifeNow?.decor?.seasonId ?? "");
      canvas.dataset.scoreDay = scoreDayMark(Boolean(lifeNow?.scoreFresh), Boolean(lifeNow?.quiet));
      const readMark = nightReadMark(Boolean(NIGHT_WASH_V2_ENABLED && lifeNow?.sessionNight));
      canvas.dataset.nightRead = readMark;
      canvas.dataset.nightAutumn = autumnDotsOn(lifeNow?.decor?.seasonId ?? "", Boolean(lifeNow?.sessionNight)) ? "1" : "0";
    };

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const span = viewSpan(zoomRef.current);
      return {
        x: camRef.current.x + ((clientX - rect.left) * span.w) / Math.max(1, rect.width),
        y: camRef.current.y + ((clientY - rect.top) * span.h) / Math.max(1, rect.height),
      };
    };

    const setHoverHint = (name: string | null) => {
      hoverRef.current = name;
      if (hintRef.current) {
        if (!name) {
          hintRef.current.textContent = teachLine(teachNarrowRef.current);
          return;
        }
        const found = villagersRef.current.find((v) => v.name === name);
        const clock = shanghaiClock();
        const lifeNow = lifeRef.current;
        const avail = found
          ? availabilityFor(found, clock, found.name === lifeNow.selfName ? lifeNow.selfPreset : null)
          : null;
        hintRef.current.textContent = avail ? `看见 ${name} · ${avail.label}` : `看见 ${name}`;
      }
    };

    // PV-MAGIC-PLAY-001: wizard play rides on the same taps; null when magic is off, still or reduced
    let pressTimer = 0;
    /** PV-MAGIC-STYLE-001: how long a phone waits before a tapped wizard's card covers half the map. */
    const CARD_DELAY_MS = 520;
    const rect0Narrow = () => canvas.getBoundingClientRect().width < 600;
    const playOn = () => {
      const lifeNow = lifeRef.current;
      if (!MAGIC_PLAY_ENABLED || !MAGIC_SPELLS_ENABLED || !magicRef.current || !lifeNow?.magic || lifeNow.magic === "off" || lifeNow.reduceMotion) return null;
      const ymd = shanghaiClock().ymd;
      if (!playRef.current) {
        let store: Storage | null = null;
        try {
          store = window.localStorage;
        } catch {
          store = null;
        }
        playRef.current = new PlayController(store, ymd);
      }
      playRef.current.setDay(ymd);
      return { play: playRef.current, layer: magicRef.current };
    };
    const playFlush = () => {
      const events = playRef.current?.drain() ?? [];
      if (!events.length) return;
      const lifeNow = lifeRef.current;
      const sound = [...events].reverse().find((event) => event.sfx)?.sfx;
      if (sound) playMagicSfx(sound, lifeNow?.sfxMuted === false && !lifeNow.reduceMotion);
      const toast = [...events].reverse().find((event) => event.toast)?.toast;
      if (toast) {
        setPlayToast((prev) => ({ text: toast, n: (prev?.n ?? 0) + 1 }));
        window.clearTimeout(playToastTimer.current);
        playToastTimer.current = window.setTimeout(() => setPlayToast(null), 2200);
      }
      kickRef.current?.();
    };
    const travelTo = (spot: PlaySpot) => {
      window.setTimeout(() => {
        const on = playOn();
        const span = viewSpan(zoomRef.current);
        userCam.current = true;
        aimHoldRef.current = Date.now() + 8000;
        camRef.current = clampCamera(spot.x - span.w / 2, spot.y - span.h / 2, zoomRef.current);
        setCamMark({ x: camRef.current.x, y: camRef.current.y, zoom: zoomRef.current });
        if (on) on.play.arrive(on.layer, spot);
        kickRef.current?.();
      }, 360);
    };
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, moved: false };
      window.clearTimeout(pressTimer);
      if (!playOn()) return;
      const pressAt = { x: e.clientX, y: e.clientY };
      pressTimer = window.setTimeout(() => {
        const on = playOn();
        if (!on || !drag.current || drag.current.moved) return;
        if (on.play.chargeStart(on.layer, toWorld(pressAt.x, pressAt.y), Date.now())) {
          drag.current.charging = true;
          playFlush();
        }
      }, LONG_PRESS_MS);
    };
    const onPointerMove = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const found = hitTest(villagersRef.current, world.x, world.y, zoomRef.current);
      const nextHover = found?.name ?? null;
      if (nextHover !== hoverRef.current) setHoverHint(nextHover);
      if (!drag.current) return;
      if (drag.current.charging) {
        // charging: the staff draws a trail instead of panning
        const on = playOn();
        if (on) on.play.chargeMove(on.layer, world);
        return;
      }
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) {
        drag.current.moved = true;
        userCam.current = true;
        window.clearTimeout(pressTimer);
      }
      const rect = canvas.getBoundingClientRect();
      const span = viewSpan(zoomRef.current);
      camRef.current.x -= (dx * span.w) / Math.max(1, rect.width);
      camRef.current.y -= (dy * span.h) / Math.max(1, rect.height);
      camRef.current = clampCamera(camRef.current.x, camRef.current.y, zoomRef.current);
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const found = hitTest(villagersRef.current, world.x, world.y, zoomRef.current);
      const moved = drag.current?.moved ?? false;
      const charging = drag.current?.charging ?? false;
      drag.current = null;
      window.clearTimeout(pressTimer);
      if (charging) {
        const on = playOn();
        if (on) on.play.chargeRelease(on.layer, world, Date.now());
        else if (magicRef.current) playRef.current?.cancelCharge(magicRef.current);
        playFlush();
        return;
      }
      if (moved) return;
      if (MAGIC_SPELLS_ENABLED && magicRef.current && lifeRef.current?.magic && lifeRef.current.magic !== "off" && !lifeRef.current.reduceMotion) {
        // PV-MAGIC-001: every tap casts something; the tap still does its usual job below
        const roll = magicRoll.current;
        roll.n += 1;
        const seed = roll.n * 7 + Math.floor(Math.random() * 1000);
        const mark = found ? null : hitLandmark(world.x, world.y);
        const layer = magicRef.current;
        const on = playOn();
        const tapAt = Date.now();
        on?.play.streakTap(tapAt);
        if (found) {
          if (!on?.play.tapPerson(layer, found, tapAt)) {
            const self = found.name === lifeRef.current.selfName;
            const spell = pickSpell(self && MAGIC_UI_FEEDBACK_ENABLED ? SELF_SPELLS : PERSON_SPELLS, seed, roll.last);
            roll.last = spell;
            layer.cast(spell, found.x, found.y);
            const after = STATUS_AFTER[spell];
            if (after) layer.castOn(after.id, found.name, after.seconds);
          }
        } else if (mark) {
          const game = on ? on.play.tapLandmark(layer, mark.id, tapAt) : { handled: false };
          if (!game.handled) layer.cast(mark.cast, mark.x, mark.y + (mark.castDy ?? 0));
          if (game.travel) travelTo(game.travel);
        } else {
          // PV-MAGIC-STYLE-001: ground magic waits out the double-tap window, so the first tap of a double stays quiet
          window.clearTimeout(groundTimer.current);
          layer.wake(world.x, world.y);
          if (!on?.play.groundDouble(layer, world, tapAt)) {
            const night = Boolean(lifeRef.current.sessionNight);
            groundTimer.current = window.setTimeout(() => {
              const live = playOn();
              if (!live?.play.groundSingle(live.layer, world, seed)) layer.cast(groundSpell(world.x, world.y, seed, night), world.x, world.y);
              playFlush();
            }, on ? DOUBLE_TAP_MS : 0);
          }
        }
        playFlush();
        // five quick taps: a combo counter pops where the last one landed
        if (MAGIC_UI_FEEDBACK_ENABLED && layer.noteTap(COMBO_WINDOW_MS, COMBO_TAPS, Date.now())) layer.cast(COMBO_SPELL, world.x, world.y - 24);
      }
      if (found) {
        tapRef.current = { name: found.name, at: Date.now() };
        if (lifeRef.current) {
          lifeRef.current.tapName = found.name;
          lifeRef.current.tapAt = tapRef.current.at;
        }
        kickRef.current?.();
        // PV-MAGIC-STYLE-001: on a phone the card halves the map; with magic play on it waits a beat,
        // so a quick second tap on another wizard (a chain) lands before the card opens
        window.clearTimeout(selectTimer.current);
        const name = found.name;
        if (playOn() && rect0Narrow()) selectTimer.current = window.setTimeout(() => onSelectRef.current(name), CARD_DELAY_MS);
        else onSelectRef.current(name);
        return;
      }
      tapRef.current = null;
      window.clearTimeout(selectTimer.current);
      if (lifeRef.current) {
        lifeRef.current.tapName = null;
        lifeRef.current.tapAt = null;
      }
      kickRef.current?.();
      if (MAP_HUD_FOLD_ENABLED) {
        const toy = hitToy(world.x, world.y);
        if (toy) {
          onToyTapRef.current?.(toy);
          return;
        }
      }
      const spot = hitSpot(world.x, world.y);
      if (spot) onSpotRef.current?.(spot);
      else {
        onEmptyRef.current?.(world.x, world.y);
        onSelectRef.current(null);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelAt.current < 220) return;
      wheelAt.current = now;
      userCam.current = true;
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoomRef.current) + (e.deltaY > 0 ? -1 : 1)));
      zoomRef.current = z;
      setZoom(z);
      camRef.current = clampCamera(camRef.current.x, camRef.current.y, z);
      setCamMark({ x: camRef.current.x, y: camRef.current.y, zoom: z });
      kickRef.current?.();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    const onPointerCancel = () => {
      window.clearTimeout(pressTimer);
      if (drag.current?.charging && magicRef.current) playRef.current?.cancelCharge(magicRef.current);
      drag.current = null;
    };
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let frame = 0;
    const start = performance.now();
    let focusStarted = 0;
    let focusTimer = 0;
    const decorative = () => lifeRef.current.reduceMotion || document.hidden;
    const paintSafe = (now: number) => {
      try {
        paint(now, decorative() ? now : start);
        return true;
      } catch (error) {
        console.error(error);
        setFailed(true);
        return false;
      }
    };
    const tick = (now: number) => {
      if (!paintSafe(now)) return;
      if (decorative()) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (frame) return;
      if (decorative()) {
        paintSafe(performance.now());
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    kick();
    const onFont = () => kick();
    const onPageShow = () => kick();
    document.addEventListener("visibilitychange", kick);
    document.addEventListener("village-font", onFont);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(groundTimer.current);
      window.clearTimeout(selectTimer.current);
      cancelAnimationFrame(frame);
      window.clearInterval(stageTimer);
      document.removeEventListener("visibilitychange", kick);
      document.removeEventListener("village-font", onFont);
      window.removeEventListener("pageshow", onPageShow);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      window.clearTimeout(pressTimer);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [people, bootAttempt]);

  useEffect(() => {
    // PV-MAGIC-001 test hook: cast and read the magic layer from e2e and screenshot scripts
    if (!testHooksEnabled() || typeof window === "undefined") return;
    const hook = {
      cast: (id: string, x: number, y: number) => {
        if (!magicRef.current) magicRef.current = new MagicLayer();
        magicRef.current.cast(id, x, y);
        kickRef.current?.();
        return true;
      },
      /** Play a screen transition sweep (a random one when no id is given). */
      transition: (id?: string) => {
        if (!magicRef.current) magicRef.current = new MagicLayer();
        magicRef.current.transition(id);
        kickRef.current?.();
        return true;
      },
      /** Hang a short status on the n-th villager, by position in the list, so no name is needed. */
      statusOn: (id: string, index: number, seconds = 3) => {
        const person = villagersRef.current[index];
        if (!person || !magicRef.current) return false;
        magicRef.current.castOn(id, person.name, seconds);
        kickRef.current?.();
        return true;
      },
      state: () => ({ ...(magicRef.current?.stats ?? { ready: false }), level: lifeRef.current?.magic ?? "off" }),
      /** Wizard play counts (quest progress, badge ids, game counters); no names. */
      play: () => playRef.current?.snapshot ?? null,
      /** Two villagers by list position sing a chorus, as if one had waved at the other. */
      chorus: (a: number, b: number) => {
        const one = villagersRef.current[a];
        const two = villagersRef.current[b];
        if (!one || !two || !magicRef.current) return false;
        if (!playRef.current) playRef.current = new PlayController(null, shanghaiClock().ymd);
        const ok = playRef.current.chorus(magicRef.current, one, two);
        kickRef.current?.();
        return ok;
      },
      /** Client coordinates of a world point, for real taps in e2e. */
      screen: (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const span = viewSpan(zoomRef.current);
        return {
          x: rect.left + ((x - camRef.current.x) * rect.width) / span.w,
          y: rect.top + ((y - camRef.current.y) * rect.height) / span.h,
        };
      },
      /** World positions only; names stay out so the hook never needs more than the map shows. */
      spots: (n: number) => villagersRef.current.slice(0, Math.max(0, n)).map((v) => ({ x: v.x, y: v.y })),
      look: (x: number, y: number, zoom: number) => {
        userCam.current = true;
        gateHeldRef.current = true;
        const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
        zoomRef.current = z;
        setZoom(z);
        const span = viewSpan(z);
        camRef.current = clampCamera(x - span.w / 2, y - span.h / 2, z);
        kickRef.current?.();
        return { ...camRef.current, zoom: z };
      },
    };
    (window as unknown as { __VILLAGE_MAGIC__?: typeof hook }).__VILLAGE_MAGIC__ = hook;
    return () => {
      delete (window as unknown as { __VILLAGE_MAGIC__?: typeof hook }).__VILLAGE_MAGIC__;
    };
  }, []);

  const applyZoom = (next: number) => {
    userCam.current = true;
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next)));
    zoomRef.current = z;
    setZoom(z);
    camRef.current = clampCamera(camRef.current.x, camRef.current.y, z);
    setCamMark({ x: camRef.current.x, y: camRef.current.y, zoom: z });
    kickRef.current?.();
  };

  const sessionNight = Boolean(life.sessionNight);
  const nightV2 = nightWashV2Mark(sessionNight) === "active";
  const nightV1 = !NIGHT_WASH_V2_ENABLED && NIGHT_WASH_ENABLED && Boolean(life.decor?.night);
  const nightWashAttr = NIGHT_WASH_V2_ENABLED
    ? nightWashV2Mark(sessionNight)
    : nightWashMark(Boolean(life.decor?.night), life.reduceMotion);
  const plateMid = NAMEPLATE_MID_ENABLED && zoom === MID_ZOOM && !life.showAllPlates;
  const glowPhase = life.ritualPhase ?? "off";
  const autumnMark = autumnPaletteMark(life.decor?.seasonId ?? "");
  const scoreMark = scoreDayMark(Boolean(life.scoreFresh), life.quiet);
  const readMark = nightReadMark(Boolean(NIGHT_WASH_V2_ENABLED && life.sessionNight));
  const plateView = viewportMode(life.showAllPlates, zoom);
  const toyPulse = toyPulseMark(life.mapAim && (life.mapAim.kind === "lantern" || life.mapAim.kind === "scarecrow" || life.mapAim.kind === "pebble") ? life.mapAim.kind : null);
  const landmarkMode = life.mapAim
    ? landmarkSettleMode({ quiet: Boolean(life.quiet), reduced: Boolean(life.reduceMotion) })
    : "off";

  return (
    <div
      ref={hostRef}
      className={`pixel-frame relative h-full overflow-hidden bg-[#3c6e32]${
        nightV2 ? ` night-wash-active ${nightWashV2Styles.frame}` : ""
      }${nightV1 ? ` ${nightWashStyles.frame}` : ""}${
        glowPhase === "fade" ? ` ${afterglowStyles.fade}` : ""
      }${glowPhase === "still" ? ` ${afterglowStyles.still}` : ""}${
        scoreMark === "soft" ? ` ${scoreDayStyles.soft}` : ""
      }${scoreMark === "quiet" ? ` ${scoreDayStyles.quiet}` : ""}${
        life.ritualRim ? " ritual-rim-warm" : ""
      }`}
      data-village-host={ready ? "ready" : "boot"}
      data-companion-ring={life.waveTarget || ""}
      data-load-stage={shownStage}
      data-bell={life.bell ? "1" : "0"}
      data-festival-skin={life.festivalId ?? ""}
      data-show-all={life.showAllPlates ? "1" : "0"}
      data-quiet={life.quiet ? "1" : "0"}
      data-landmark-settle={landmarkMode}
      data-particle-budget={particleAllowance(Boolean(life.quiet), Boolean(life.festivalId))}
      data-camera-x={camMark.x}
      data-camera-y={camMark.y}
      data-camera-zoom={camMark.zoom}
      data-map-fill={mapFill}
      data-critters={life.decor?.critters ?? "none"}
      data-dusk={life.decor?.dusk ? "1" : "0"}
      data-night={life.decor?.night ? "1" : "0"}
      data-session-night={sessionNight ? "1" : "0"}
      data-night-wash={nightWashAttr}
      data-night-static={(nightV2 || Boolean(life.decor?.night)) && life.reduceMotion ? "1" : "0"}
      data-yard-resonance={life.presenceOn ? "1" : "0"}
      data-passing-glance={life.presenceOn ? "1" : "0"}
      data-map-feedback={life.presenceOn ? "glance" : "none"}
      data-path-wear={life.decor?.yard.wear ? "1" : "0"}
      data-yard-hen={life.decor?.yard.hen ? "1" : "0"}
      data-yard-laundry={life.decor?.yard.laundry ? "1" : "0"}
      data-yard-stove={life.decor?.yard.stove ? "1" : "0"}
      data-yard-bell={String(life.decor?.yard.bell ?? 0)}
      data-yard-grain={String(life.decor?.yard.grain ?? 0)}
      data-lane-well={life.decor?.lane.well ? "1" : "0"}
      data-lane-lantern={life.decor?.lane.lantern ? "1" : "0"}
      data-lane-ducks={String(life.decor?.lane.ducks ?? 0)}
      data-lane-gate={life.decor?.lane.gate ? "1" : "0"}
      data-lane-stone={String(life.decor?.lane.stone ?? 0)}
      data-lane-bob={life.decor?.lane.bob ? "1" : "0"}
      data-sitting={life.decor?.sit ? "1" : "0"}
      data-season={life.decor?.seasonId ?? ""}
      data-week-ribbon={life.decor?.weekRibbon ? "1" : "0"}
      data-bond-posts={String(life.bondMarks?.length ?? 0)}
      data-ambient-life={ambientLifeMark(life.quiet, life.reduceMotion)}
      data-ambient-count={String(ambientSpeckCount(life.quiet, life.reduceMotion))}
      data-ground-props={groundPropMark(life.decor?.seasonId ?? "", life.quiet)}
      data-ground-prop-count={String(groundClusterCount(life.decor?.seasonId ?? "", life.quiet))}
      data-self-yard={selfYardMark(Boolean(life.selfName))}
      data-kindness-glow={kindnessGlowMark(life.bondMarks?.length ?? 0)}
      data-world-water={life.decor?.world.water ? "1" : "0"}
      data-world-card={life.decor?.world.card ? "1" : "0"}
      data-world-gate={life.decor?.world.gate ? "1" : "0"}
      data-world-porch={life.decor?.world.porch ? "1" : "0"}
      data-world-diary={life.decor?.world.diary ? "1" : "0"}
      data-world-steps={life.decor?.world.steps ? "1" : "0"}
      data-world-season={life.decor?.world.season ? "1" : "0"}
      data-world-pin={life.decor?.world.pin ? "1" : "0"}
      data-world-rest={life.decor?.world.rest ? "1" : "0"}
      data-plate-lod={life.quiet && !life.showAllPlates ? "quiet" : "open"}
      data-plate-cap={life.showAllPlates ? "all" : life.quiet ? "4" : "8"}
      data-plate-mid={plateMid ? "1" : "0"}
      data-plate-short="0"
      data-plate-short-cap={life.quiet ? String(QUIET_SHORT_CAP) : String(SHORT_CAP)}
      data-plate-count="0"
      data-self-highlight="0"
      data-plaza-sit="off"
      data-find-prints="off"
      data-find-print-count="0"
      data-eave-glow="off"
      data-autumn-hint="off"
      data-wave-reply="0"
      data-ritual-done={life.ritual?.done ? "1" : "0"}
      data-ritual-beat={life.ritual?.beat ?? ""}
      data-ritual-afterglow={glowPhase}
      data-autumn-palette={autumnMark}
      data-score-day={scoreMark}
      data-night-read={readMark}
      data-night-autumn={autumnDotsOn(life.decor?.seasonId ?? "", Boolean(life.sessionNight)) ? "1" : "0"}
      data-plate-viewport={plateView}
      data-plate-clear={NAMEPLATE_CLEAR_ENABLED ? "1" : "0"}
      data-plate-near-cap={String(NEAR_PLATE_CAP)}
      data-next-beat={life.mapAim && (life.mapAim.kind === "gate" || life.mapAim.kind === "pond" || life.mapAim.kind === "bench") ? "aimed" : "off"}
      data-next-id={life.mapAim?.kind ?? ""}
      data-toy-lantern={life.toyLook?.lantern ? "1" : "0"}
      data-toy-scare={String(life.toyLook?.scare ?? 0)}
      data-toy-pebbles={String(life.toyLook?.pebbles ?? 0)}
      data-toy-pulse={toyPulse}
      data-leaf-drift={leafDriftMark(life.decor?.seasonId ?? "", life.reduceMotion)}
      data-leaf-count={String(autumnLeafCount(life.decor?.seasonId ?? ""))}
      data-meadow-breath={meadowBreathMark(life.reduceMotion)}
      data-meadow-count={String(meadowBreathCount(life.reduceMotion))}
      data-map-depth={mapDepthMark()}
      data-path-meadow={pathMeadowMark()}
      data-building-volume={buildingVolumeMark()}
      data-villager-ground={villagerGroundMark()}
      data-night-hearth={nightHearthMark(Boolean(NIGHT_WASH_V2_ENABLED && life.sessionNight))}
      data-night-window={nightWindowPulseMark(Boolean(NIGHT_WASH_V2_ENABLED && life.sessionNight), Boolean(life.reduceMotion))}
      data-corner-meadow={cornerMeadowMark(Boolean(life.reduceMotion))}
      data-path-focus="off"
      data-tap-feedback="off"
      data-sky-wash="off"
      data-path-glow="off"
      data-next-beat-glow="off"
      data-teach={teachMode(teachNarrow)}
      data-self-recognize={selfRecognizeMark({
        hasSelf: Boolean(life.selfName),
        quiet: life.quiet,
        reduced: life.reduceMotion,
      })}
      data-self-ghost={selfGhostSuppressed() ? "clear" : "bracket"}
      data-night-plate={nightPlateMark(shanghaiClock().hour, life.quiet)}
      data-map-pending={mapPendingAttr(ready)}
      data-villager-read={villagerReadMark()}
      data-nameplate-air={nameplateAirMark()}
      data-waiting-cue={waitingCueMark(life.waitingCue ?? null)}
      data-ritual-rim={life.ritualRim ? "warm" : "off"}
    >
      {mapPendingAttr(ready) === "1" ? (
        <div className="map-field-hold" data-testid="map-field-hold" data-map-pending="1" aria-hidden>
          <p>{MAP_FIELD_HOLD_LINE}</p>
        </div>
      ) : null}
      {shownStage === "timeout" || shownStage === "failed" ? (
        <div className="load-recovery" data-testid="load-recovery">
          <p>田垄铺得太久了。可以再试一次，右上角也能刷新评分日。</p>
          <button
            type="button"
            className="hud-btn"
            onClick={() => {
              setFailed(false);
              setStage("terrain");
              onRetry?.();
            }}
          >
            再试一次
          </button>
        </div>
      ) : !ready ? (
        <p className="load-progress" data-testid="load-progress">
          {loadStageLabel(shownStage)}
        </p>
      ) : null}
      <p
        className="magic-play-toast"
        data-testid="magic-toast"
        data-shown={playToast ? "1" : "0"}
        role="status"
        aria-live="polite"
        data-n={playToast?.n ?? 0}
      >
        {playToast?.text ?? ""}
      </p>
      {ready && hintOpen && !life.quiet ? (
        <p
          ref={hintRef}
          data-testid="map-hint"
          className="absolute bottom-2 left-3 z-10 flex items-center gap-2 rounded-sm border-[3px] border-[#6a3d18] bg-[#5a3214]/80 px-2 py-1 text-[11px] text-[#fff6d8]"
        >
          <span>{teachLine(teachNarrow)}</span>
          <button type="button" className="hud-icon" onClick={() => setHintOpen(false)} aria-label="收起提示">
            ×
          </button>
        </p>
      ) : (
        <p ref={hintRef} className="sr-only" data-testid="map-hint">
          {teachLine(teachNarrow)}
        </p>
      )}
      <div className="map-more-sheet" data-testid="map-more-sheet">
        {children}
        {life.decor?.showWeather ? (
          <div className="weather-chip" data-testid="weather-chip">
            村口 · {life.decor.weatherLabel}
          </div>
        ) : null}
        <details
          className="name-legend"
          data-testid="name-legend"
          ref={legendRef}
          open={legendOpen}
          onToggle={(event) => {
            if (event.currentTarget.open !== legendOpen) setLegendOpen(event.currentTarget.open);
          }}
        >
          <summary>图例</summary>
          <span>
            <i className="swatch swatch-scored" /> 彩猫 · 琥珀名牌 · 有分
          </span>
          <span>
            <i className="swatch swatch-muted" /> 灰猫 · 灰名牌 · 未评分
          </span>
          <span>{plateLegend(life.quiet)}</span>
          {visitorLegend(Boolean(life.selfName)) ? (
            <span data-testid="visitor-legend">{visitorLegend(Boolean(life.selfName))}</span>
          ) : null}
        </details>
        {MORE_LEAN_ENABLED ? (
          <div className="more-lean-inline">
            <button
              type="button"
              className="hud-btn hud-btn-ghost"
              data-testid="toggle-plates"
              aria-pressed={life.showAllPlates}
              onClick={onTogglePlates}
            >
              {life.showAllPlates ? "收起名牌" : "全显名牌"}
            </button>
            {sheetExtra}
          </div>
        ) : null}
        {life.selfName && onEmote ? (
          <div className="emote-bar" data-testid="emote-bar">
            <button type="button" className="hud-btn hud-btn-ghost" onClick={() => onEmote("stretch")}>
              伸懒腰
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={() => onEmote("sit")}>
              坐下
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={() => onEmote("clap")}>
              鼓掌
            </button>
            <WaveButton className="hud-btn hud-btn-ghost" testId="header-wave" label="挥手" onWave={() => onEmote("wave")} />
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-[#2a1a10]/20 to-transparent" />
      <div className="map-tools absolute bottom-3 left-3 z-10 flex gap-1" data-testid="map-tools">
        <button type="button" className="hud-icon" onClick={() => applyZoom(zoom - 1)} aria-label="拉远">
          −
        </button>
        <button type="button" className="hud-icon" onClick={() => applyZoom(1)} aria-label="全景">
          全
        </button>
        <button type="button" className="hud-icon" onClick={() => applyZoom(zoom + 1)} aria-label="拉近">
          +
        </button>
        {MORE_LEAN_ENABLED ? null : (
          <button
            type="button"
            className="hud-icon hud-icon-wide map-more-item"
            data-testid="toggle-plates"
            aria-pressed={life.showAllPlates}
            onClick={onTogglePlates}
          >
            {life.showAllPlates ? "收起名牌" : "全显名牌"}
          </button>
        )}
        {onSfxMute && onAmbient ? (
          <GestureChrome
            muted={life.sfxMuted !== false}
            ambient={ambientOn}
            onMute={onSfxMute}
            onAmbient={onAmbient}
          />
        ) : null}
        <button
          type="button"
          className="hud-icon hud-icon-find"
          data-testid="find-me"
          disabled={!life.selfName}
          onClick={() => {
            glowUntilRef.current = Date.now() + FIND_ME_HOLD_MS;
            const person = life.selfName ? villagersRef.current.find((v) => v.name === life.selfName) : undefined;
            const span = viewSpan(zoomRef.current);
            onFindMe?.(
              selfInFrame({
                self: person ? { x: person.x, y: person.y } : null,
                camX: camRef.current.x,
                camY: camRef.current.y,
                spanW: span.w,
                spanH: span.h,
              }),
            );
          }}
        >
          {FIND_ME_LABEL}
        </button>
        {thumbShowsHome(Boolean(life.selfName)) ? (
          <button
            type="button"
            className="hud-icon hud-icon-find map-home"
            data-testid="map-home"
            aria-label={mapHomeAria()}
            disabled={!life.selfName}
            onClick={() => onHome?.()}
          >
            {mapHomeFace()}
          </button>
        ) : null}
        {MAP_HUD_FOLD_ENABLED ? (
          <button
            type="button"
            className="hud-icon map-more-toggle"
            data-testid="map-more"
            aria-expanded={mapMore}
            aria-label="更多"
            onClick={() => onMapMore?.(!mapMore)}
          >
            ⋯
            <MoreDiscoverDot ready={ready} opened={mapMore} reduceMotion={life.reduceMotion} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
