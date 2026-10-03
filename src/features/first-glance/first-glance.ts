/**
 * First glance draft. The field, nearby names, and one glowing place
 * stay out. Header, today strip, and the bottom tools wait in a small menu.
 * Set FIRST_GLANCE_ENABLED to false to bring the current first glance back.
 * The opening camera already includes the village gate. The word stays on that point.
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
 * Shift the opening camera just enough that the landmark sits inside the
 * frame. Zoom stays. The marker is still the landmark, never a stand-in.
 */
export function openingGlanceCamera(input: {
  x: number;
  y: number;
  zoom: number;
  landmarkX: number;
  landmarkY: number;
}) {
  const span = viewSpan(input.zoom);
  const margin = Math.min(48, Math.floor(span.w / 6), Math.floor(span.h / 6));
  let x = input.x;
  let y = input.y;
  const minX = input.landmarkX - span.w + margin;
  const maxX = input.landmarkX - margin;
  if (x < minX) x = minX;
  if (x > maxX) x = maxX;
  const minY = input.landmarkY - span.h + margin;
  const maxY = input.landmarkY - margin;
  if (y < minY) y = minY;
  if (y > maxY) y = maxY;
  const cam = clampCamera(x, y, input.zoom);
  return { x: cam.x, y: cam.y, zoom: input.zoom };
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
