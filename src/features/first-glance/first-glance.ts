/**
 * First glance draft. The field, nearby names, and one glowing place
 * stay out. Header, today strip, and the bottom tools wait in a small menu.
 * Set FIRST_GLANCE_ENABLED to false to bring the current first glance back.
 * The opening camera stands in front of the village gate. The word stays on that point.
 */

import { PLAY_FIRST_TIP } from "@/features/play-first-tip/play-first-tip";
import { NEXT_BEATS } from "@/features/week-next-beat/next-beat";
import { clampCamera, viewSpan } from "@/lib/pixel-scene";

export const FIRST_GLANCE_ENABLED = true;

/** Existing first-visit phrase. Not a new sentence, and not a button. */
export const GLANCE_FIND_LINE = "先在地图上找我";

export const GLANCE_FORBIDDEN_CLICKS = ["去看村口", "知道了", "拉近"] as const;

export const GLANCE_CHROME = [
  "header",
  "version-plaque",
  "today-bar",
  "map-tools",
  "split",
  "thumb",
  "greet-float",
] as const;

export type GlancePlace = {
  id: string;
  x: number;
  y: number;
  /** Written on the place. A landmark name, never 「去看…」. */
  label: string;
  kind: "beat" | "lantern";
};

export function firstGlanceOn(enabled = FIRST_GLANCE_ENABLED) {
  return enabled;
}

export function firstGlanceMark(enabled = FIRST_GLANCE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Closed menu keeps the old chrome off the first glance. */
export function glanceChromeHidden(menuOpen: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return enabled && !menuOpen;
}

export function todayBarHidden(menuOpen: boolean, peeked: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return glanceChromeHidden(menuOpen, enabled) && !peeked;
}

/** The find-me line shows once, until a person is clicked. No 「知道了」. */
export function findLineShows(metPerson: boolean, menuOpen: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return enabled && !menuOpen && !metPerson && PLAY_FIRST_TIP.includes(GLANCE_FIND_LINE);
}

export function greetFloatHidden(menuOpen: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return glanceChromeHidden(menuOpen, enabled);
}

/** After a person is clicked, 招呼 sits on that person, not on the right. */
export function greetOnPerson(selected: boolean, menuOpen: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return enabled && !menuOpen && selected;
}

export function clickIsForbidden(label: string) {
  return GLANCE_FORBIDDEN_CLICKS.some((word) => label.includes(word));
}

/**
 * One glowing place in the field. Lantern only when that invite is the one
 * speaking and the gate invite is not. Otherwise the nearest beat, labeled
 * with the place name. Menu open returns the floating buttons instead.
 */
export function pickGlancePlace(input: {
  menuOpen: boolean;
  beat: { id: string; x: number; y: number; label: string } | null;
  beatSpeaks: boolean;
  lantern: { x: number; y: number } | null;
  lanternSpeaks: boolean;
  enabled?: boolean;
}): GlancePlace | null {
  const enabled = input.enabled ?? FIRST_GLANCE_ENABLED;
  if (!enabled || input.menuOpen) return null;
  if (input.lanternSpeaks && !input.beatSpeaks && input.lantern) {
    return {
      id: "lantern",
      x: input.lantern.x,
      y: input.lantern.y,
      label: "灯笼",
      kind: "lantern",
    };
  }
  if (input.beat) {
    return {
      id: input.beat.id,
      x: input.beat.x,
      y: input.beat.y,
      label: input.beat.label,
      kind: "beat",
    };
  }
  if (input.lantern) {
    return {
      id: "lantern",
      x: input.lantern.x,
      y: input.lantern.y,
      label: "灯笼",
      kind: "lantern",
    };
  }
  return null;
}

/** The click on a place uses the same aim as the old floating invite. */
export function placeAim(place: GlancePlace) {
  return { kind: place.id, x: place.x, y: place.y };
}

/** Village gate. The opening word is this place, not a point in the current field. */
export function openingGate() {
  return NEXT_BEATS.find((beat) => beat.id === "gate") ?? NEXT_BEATS[0];
}

/**
 * First glance opens on the gate. The old menu (tests that force it) keeps
 * the field camera. A missing flag is the real first glance, menu closed.
 */
export function openingCoversGate(menuForcedOpen: boolean, enabled = FIRST_GLANCE_ENABLED) {
  return enabled && !menuForcedOpen;
}

/**
 * Cold start stands in front of the gate. Zoom 2 keeps that point in the
 * corner and the rest of the picture is the far field, so the opening zoom
 * is closer than 2. The projection stays at least a quarter of the short
 * side in from the left and the top. The marker is still the landmark.
 */
export function openingGlanceCamera(input: {
  x: number;
  y: number;
  zoom: number;
  landmarkX: number;
  landmarkY: number;
  cssW?: number;
  cssH?: number;
}) {
  const cssW = input.cssW && input.cssW > 0 ? input.cssW : 390;
  const cssH = input.cssH && input.cssH > 0 ? input.cssH : 844;
  const short = Math.min(cssW, cssH);
  const minEdge = short / 4;
  const stand = (zoom: number) => {
    const span = viewSpan(zoom);
    const maxX = input.landmarkX - (minEdge * span.w) / cssW;
    const maxY = input.landmarkY - (minEdge * span.h) / cssH;
    // In front of the gate: centered when the map edge allows it, and a
    // little above the middle so the ground before the gate stays in frame.
    const idealX = input.landmarkX - span.w * 0.5;
    const idealY = input.landmarkY - span.h * 0.42;
    const cam = clampCamera(Math.min(idealX, maxX), Math.min(idealY, maxY), zoom);
    const left = ((input.landmarkX - cam.x) / span.w) * cssW;
    const top = ((input.landmarkY - cam.y) / span.h) * cssH;
    const inside =
      input.landmarkX >= cam.x &&
      input.landmarkY >= cam.y &&
      input.landmarkX <= cam.x + span.w &&
      input.landmarkY <= cam.y + span.h;
    return {
      x: cam.x,
      y: cam.y,
      zoom,
      ok: inside && left >= minEdge - 1e-6 && top >= minEdge - 1e-6,
    };
  };
  for (const zoom of [5, 6, 7, 8, 4, 3]) {
    const frame = stand(zoom);
    if (frame.ok) return { x: frame.x, y: frame.y, zoom: frame.zoom };
  }
  const fallback = clampCamera(0, 0, 5);
  return { x: fallback.x, y: fallback.y, zoom: 5 };
}

/**
 * The word sits on the landmark. If the opening camera crops that point,
 * draw nothing — never a stand-in on the field in front of the camera.
 */
export function landmarkInOpeningFrame(input: {
  x: number;
  y: number;
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
}) {
  return (
    input.x >= input.camX &&
    input.y >= input.camY &&
    input.x <= input.camX + input.spanW &&
    input.y <= input.camY + input.spanH
  );
}

export function drawnLandmark(input: {
  x: number;
  y: number;
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
}): { x: number; y: number } | null {
  if (!landmarkInOpeningFrame(input)) return null;
  return { x: input.x, y: input.y };
}
