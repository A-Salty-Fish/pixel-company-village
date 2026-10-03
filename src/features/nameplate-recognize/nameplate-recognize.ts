/**
 * v1.16.1 — a plate that appears carries at least two glyphs.
 * A one-glyph name stays whole. Near plates sit on the person,
 * leave with the camera, and use the smaller scale already in the frame.
 * 全显名牌 still prints the whole name.
 * Set NAMEPLATE_RECOGNIZE_ENABLED to false to restore one-glyph shorts
 * and the enlarged near plate.
 */

export const NAMEPLATE_RECOGNIZE_ENABLED = true;
export const RECOGNIZE_MIN_GLYPHS = 2;

export function nameplateRecognizeOn(enabled = NAMEPLATE_RECOGNIZE_ENABLED) {
  return enabled;
}

export function nameplateRecognizeMark(enabled = NAMEPLATE_RECOGNIZE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

/** Glyphs on a short or near plate. The whole name when it is already shorter. */
export function recognizePlateText(name: string, enabled = NAMEPLATE_RECOGNIZE_ENABLED) {
  const glyphs = [...name.trim()];
  if (glyphs.length === 0) return "";
  if (!enabled) return glyphs[0] ?? "";
  return glyphs.slice(0, Math.min(RECOGNIZE_MIN_GLYPHS, glyphs.length)).join("");
}

/** True when a longer name was cut down to a single glyph. */
export function plateTextIsLone(name: string, text: string) {
  const nameLen = [...name.trim()].length;
  if (nameLen <= 1) return false;
  return [...text].length === 1;
}

export function frameHasLonePlate(plates: readonly { name: string; text: string }[]) {
  return plates.some((plate) => plateTextIsLone(plate.name, plate.text));
}

/**
 * Near plates share the smaller scale already used in this frame.
 * They do not take a private boost.
 */
export function nearPlatePeerScale(frameScales: readonly number[], enabled = NAMEPLATE_RECOGNIZE_ENABLED) {
  const peers = frameScales.map((scale) => Math.max(1, Math.round(scale))).filter((scale) => Number.isFinite(scale));
  if (peers.length === 0) return 1;
  if (!enabled) return peers[0] ?? 1;
  return Math.min(...peers);
}

export function plateNoticeablyLarger(scale: number, peerScales: readonly number[]) {
  if (peerScales.length === 0) return false;
  const peer = Math.max(...peerScales.map((item) => Math.max(1, Math.round(item))));
  return Math.round(scale) > peer;
}

export type PlateBox = { x: number; y: number; w: number; h: number };

/**
 * Screen box glued to the person. Null once they leave the camera,
 * so the plate cannot stay parked in the middle.
 */
export function nearPlateFollowBox(input: {
  personX: number;
  personY: number;
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
  viewW: number;
  viewH: number;
  spriteW: number;
  spriteH: number;
  scale: number;
  footLift?: number;
}): PlateBox | null {
  const spanW = Math.max(1, input.spanW);
  const spanH = Math.max(1, input.spanH);
  const inFrame =
    input.personX >= input.camX &&
    input.personY >= input.camY &&
    input.personX <= input.camX + spanW &&
    input.personY <= input.camY + spanH;
  if (!inFrame) return null;
  const scale = Math.max(1, Math.round(input.scale));
  const dw = input.spriteW * scale;
  const dh = input.spriteH * scale;
  const sx = ((input.personX - input.camX) / spanW) * input.viewW;
  const sy = ((input.personY - (input.footLift ?? 28) - input.camY) / spanH) * input.viewH;
  const box = { x: sx - dw / 2, y: sy - dh, w: dw, h: dh };
  if (box.x + box.w < 0 || box.y + box.h < 0 || box.x > input.viewW || box.y > input.viewH) return null;
  return box;
}

/** The plate sits in the middle of the screen while the person does not. */
export function plateParkedInCenter(
  box: PlateBox | null,
  personSx: number,
  personSy: number,
  viewW: number,
  viewH: number,
) {
  if (!box || viewW <= 0 || viewH <= 0) return false;
  const nearMiddle = (x: number, y: number) =>
    Math.abs(x - viewW / 2) <= viewW * 0.18 && Math.abs(y - viewH / 2) <= viewH * 0.18;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return nearMiddle(cx, cy) && !nearMiddle(personSx, personSy);
}
