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
import { FIND_ME_LABEL, plateLegend } from "@/lib/worldcraft";
import { availabilityFor, shanghaiClock, type SceneLife } from "@/lib/village-life";

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
      canvas.className = "pixelated block h-auto w-full cursor-grab active:cursor-grabbing";
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
      const cssH = Math.max(1, Math.round((cssW * WORLD_H) / WORLD_W));
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
      if (selected && !drag.current) {
        const target = cameraFocus(selected, zoomRef.current);
        camRef.current.x += (target.x - camRef.current.x) * EASING.camera;
        camRef.current.y += (target.y - camRef.current.y) * EASING.camera;
      }
      camRef.current = clampCamera(camRef.current.x, camRef.current.y, zoomRef.current);
      const emphasize = new Set<string>();
      if (selectedRef.current) emphasize.add(selectedRef.current);
      if (hoverRef.current) emphasize.add(hoverRef.current);
      const activeFx = fxRef.current;
      if (activeFx && Date.now() - activeFx.startedAt < activeFx.duration && activeFx.partner) {
        emphasize.add(activeFx.partner);
      }
      paintVillage(
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
      canvas.dataset.villageReady = "1";
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
  };

  return (
    <div
      ref={hostRef}
      className="pixel-frame relative overflow-hidden bg-[#3c6e32]"
      style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }}
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
      data-ritual-done={life.ritual?.done ? "1" : "0"}
      data-ritual-beat={life.ritual?.beat ?? ""}
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
          <button type="button" className="hud-btn hud-btn-ghost" onClick={() => onEmote("wave")}>
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
          {life.showAllPlates ? "收起" : "全显"}
        </button>
        <button
          type="button"
          className="hud-icon hud-icon-find"
          data-testid="find-me"
          disabled={!life.selfName}
          onClick={onFindMe}
        >
          {FIND_ME_LABEL}
        </button>
      </div>
    </div>
  );
}
