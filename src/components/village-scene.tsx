"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { loadVillageArt, resetVillageArt, artReady } from "@/lib/sprites";
import {
  WORLD_H,
  WORLD_W,
  cameraFocus,
  clampCamera,
  viewSpan,
  defaultCamera,
  hitTest,
  paintBootField,
  paintVillage,
  placeVillagers,
  updateVillager,
} from "@/lib/pixel-scene";
import type { VillageFx } from "@/lib/interactions";
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
  onFindMe?: () => void;
  mapAim?: { token: number; x: number; y: number } | null;
  ambientOn?: boolean;
  onSfxMute?: (muted: boolean) => void;
  onAmbient?: (on: boolean) => void;
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
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<LoadStage>("terrain");
  const [hintOpen, setHintOpen] = useState(false);
  const stageRef = useRef<LoadStage>("terrain");
  const onSpotRef = useRef(onSpot);
  const onEmptyRef = useRef(onEmpty);
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
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const kickRef = useRef<(() => void) | null>(null);
  const wheelAt = useRef(0);
  const glowUntilRef = useRef(0);
  const aimHoldRef = useRef(0);

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
    if (!mapAim?.token) return;
    const nextZoom = 3;
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    const focus = clampCamera(mapAim.x - WORLD_W / nextZoom / 2, mapAim.y - WORLD_H / nextZoom / 2, nextZoom);
    camRef.current = focus;
    setCamMark({ x: Math.round(focus.x), y: Math.round(focus.y), zoom: nextZoom });
    aimHoldRef.current = Date.now() + 1800;
    kickRef.current?.();
  }, [mapAim]);

  useEffect(() => {
    if (!homePulse || !life.selfName) return;
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

  useEffect(() => {
    selectedRef.current = selectedName;
    if (!selectedName) return;
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
      canvas.setAttribute(
        "aria-label",
        "像素公司农庄，同事们按当日分数在田里挥锄、浇水或去湖边抛竿。可拖动画布、滚轮缩放。",
      );
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
      if (selected && !drag.current && Date.now() > aimHoldRef.current) {
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
      host.dataset.waveReply =
        activeFx && activeFx.kind === "wave" && nowMs - activeFx.startedAt < activeFx.duration ? "1" : "0";
      if (lifeRef.current) lifeRef.current.selfHighlight = highlight;
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
      );
      host.dataset.plateCount = String(painted.plates);
      host.dataset.plateShort = String(painted.shortPlates);
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
          hintRef.current.textContent = "拖动画布 · 滚轮缩放 · 点小人看今日信号";
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

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, moved: false };
    };
    const onPointerMove = (e: PointerEvent) => {
      const world = toWorld(e.clientX, e.clientY);
      const found = hitTest(villagersRef.current, world.x, world.y, zoomRef.current);
      const nextHover = found?.name ?? null;
      if (nextHover !== hoverRef.current) setHoverHint(nextHover);
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.current.moved = true;
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
      drag.current = null;
      if (moved) return;
      if (found) {
        onSelectRef.current(found.name);
        return;
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
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let frame = 0;
    const start = performance.now();
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
      cancelAnimationFrame(frame);
      window.clearInterval(stageTimer);
      document.removeEventListener("visibilitychange", kick);
      document.removeEventListener("village-font", onFont);
      window.removeEventListener("pageshow", onPageShow);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [people, bootAttempt]);

  const applyZoom = (next: number) => {
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

  return (
    <div
      ref={hostRef}
      className={`pixel-frame relative h-full overflow-hidden bg-[#3c6e32]${
        nightV2 ? ` night-wash-active ${nightWashV2Styles.frame}` : ""
      }${nightV1 ? ` ${nightWashStyles.frame}` : ""}${
        glowPhase === "fade" ? ` ${afterglowStyles.fade}` : ""
      }${glowPhase === "still" ? ` ${afterglowStyles.still}` : ""}${
        scoreMark === "soft" ? ` ${scoreDayStyles.soft}` : ""
      }${scoreMark === "quiet" ? ` ${scoreDayStyles.quiet}` : ""}`}
      data-village-host={ready ? "ready" : "boot"}
      data-load-stage={shownStage}
      data-bell={life.bell ? "1" : "0"}
      data-festival-skin={life.festivalId ?? ""}
      data-show-all={life.showAllPlates ? "1" : "0"}
      data-quiet={life.quiet ? "1" : "0"}
      data-particle-budget={particleAllowance(Boolean(life.quiet), Boolean(life.festivalId))}
      data-camera-x={camMark.x}
      data-camera-y={camMark.y}
      data-camera-zoom={camMark.zoom}
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
    >
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
      {ready && hintOpen && !life.quiet ? (
        <p
          ref={hintRef}
          className="absolute bottom-2 left-3 z-10 flex items-center gap-2 rounded-sm border-[3px] border-[#6a3d18] bg-[#5a3214]/80 px-2 py-1 text-[11px] text-[#fff6d8]"
        >
          <span>拖动画布 · 滚轮缩放 · 点小人看今日信号</span>
          <button type="button" className="hud-icon" onClick={() => setHintOpen(false)} aria-label="收起提示">
            ×
          </button>
        </p>
      ) : (
        <p ref={hintRef} className="sr-only">
          拖动画布 · 滚轮缩放 · 点小人看今日信号
        </p>
      )}
      {life.decor?.showWeather ? (
        <div className="weather-chip" data-testid="weather-chip">
          村口 · {life.decor.weatherLabel}
        </div>
      ) : null}
      <div className="name-legend" data-testid="name-legend">
        <span>
          <i className="swatch swatch-scored" /> 彩猫 · 琥珀名牌 · 有分
        </span>
        <span>
          <i className="swatch swatch-muted" /> 灰猫 · 灰名牌 · 未评分
        </span>
        <span>{plateLegend(life.quiet)}</span>
      </div>
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
          <button type="button" className="hud-btn hud-btn-ghost" data-testid="header-wave" onClick={() => onEmote("wave")}>
            挥手
          </button>
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-[#2a1a10]/20 to-transparent" />
      <div className="absolute bottom-3 left-3 z-10 flex gap-1">
        <button type="button" className="hud-icon" onClick={() => applyZoom(zoom - 1)} aria-label="拉远">
          −
        </button>
        <button type="button" className="hud-icon" onClick={() => applyZoom(1)} aria-label="全景">
          全
        </button>
        <button type="button" className="hud-icon" onClick={() => applyZoom(zoom + 1)} aria-label="拉近">
          +
        </button>
        <button
          type="button"
          className="hud-icon hud-icon-wide"
          data-testid="toggle-plates"
          aria-pressed={life.showAllPlates}
          onClick={onTogglePlates}
        >
          {life.showAllPlates ? "收起名牌" : "全显名牌"}
        </button>
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
            onFindMe?.();
          }}
        >
          {FIND_ME_LABEL}
        </button>
      </div>
    </div>
  );
}
