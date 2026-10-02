/**
 * PV-PM-084 — one to three building windows breathe at night.
 * Reduced motion holds the warm-lit frame. Path and crossing lamps stay still.
 * Set NIGHT_WINDOW_PULSE_ENABLED to false to leave these lamps dead.
 */

import type { Pixel } from "@/lib/worldcraft";

export const NIGHT_WINDOW_PULSE_ENABLED = true;

/** Panes on the three houses. Not the path lantern at (610, 236). */
export const NIGHT_WINDOWS = [
  { x: 419, y: 180, w: 5, h: 4, cycleS: 2.8 },
  { x: 728, y: 174, w: 4, h: 4, cycleS: 3.2 },
  { x: 1004, y: 960, w: 5, h: 4, cycleS: 3.6 },
] as const;

/** Scenic path lantern. This module must not paint or flicker it. */
export const PATH_LANTERN = { x: 610, y: 236 };

const WARM = [255, 246, 216] as const;
const DIM = [196, 132, 42] as const;

export function nightWindowPulseOn(enabled = NIGHT_WINDOW_PULSE_ENABLED) {
  return enabled;
}

/** Off, or daytime, leaves the lamps dead. Night with the flag on lights them. */
export function nightWindowLamp(night: boolean, enabled = NIGHT_WINDOW_PULSE_ENABLED): "lit" | "dead" {
  return enabled && night ? "lit" : "dead";
}

export function nightWindowPulseMark(
  night: boolean,
  reduced: boolean,
  enabled = NIGHT_WINDOW_PULSE_ENABLED,
): "breathe" | "warm" | "dead" {
  if (nightWindowLamp(night, enabled) !== "lit") return "dead";
  return reduced ? "warm" : "breathe";
}

/** 1 is the warm-lit freeze. Motion eases between dim and warm. */
export function nightWindowLevel(tSeconds: number, cycleS: number, reduced: boolean) {
  if (reduced) return 1;
  const cycle = Math.min(4, Math.max(2.5, cycleS));
  const wrapped = ((tSeconds % cycle) + cycle) % cycle;
  const wave = 0.5 + 0.5 * Math.sin((wrapped / cycle) * Math.PI * 2);
  return 0.4 + 0.6 * wave;
}

function hex(level: number) {
  const channel = (index: number) => {
    const value = Math.round(DIM[index] + (WARM[index] - DIM[index]) * level);
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function nightWindowPixels(
  night: boolean,
  reduced: boolean,
  tSeconds: number,
  enabled = NIGHT_WINDOW_PULSE_ENABLED,
): Pixel[] {
  if (nightWindowPulseMark(night, reduced, enabled) === "dead") return [];
  const frozen = nightWindowPulseMark(night, reduced, enabled) === "warm";
  return NIGHT_WINDOWS.map((pane) => ({
    x: pane.x,
    y: pane.y,
    w: pane.w,
    h: pane.h,
    color: hex(nightWindowLevel(tSeconds, pane.cycleS, frozen)),
  }));
}

type Cam = { viewW: number; viewH: number; camX: number; camY: number; worldW: number; worldH: number };

/** Screen-space breath after the night veil. Dead when the flag or the night is off. */
export function paintNightWindowPulse(
  ctx: CanvasRenderingContext2D,
  input: Cam & { night: boolean; reduced: boolean; t: number },
) {
  const mode = nightWindowPulseMark(input.night, input.reduced);
  const pixels = nightWindowPixels(input.night, input.reduced, input.t);
  if (pixels.length === 0) return { mode: "dead" as const, lamps: 0 };
  ctx.save();
  ctx.globalAlpha = mode === "warm" ? 0.96 : 0.92;
  let lamps = 0;
  for (const pixel of pixels) {
    const sx = ((pixel.x - input.camX) / input.worldW) * input.viewW;
    const sy = ((pixel.y - input.camY) / input.worldH) * input.viewH;
    const sw = (pixel.w / input.worldW) * input.viewW;
    const sh = (pixel.h / input.worldH) * input.viewH;
    if (sx + sw < 0 || sy + sh < 0 || sx > input.viewW || sy > input.viewH) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(sx, sy, Math.max(2, sw), Math.max(2, sh));
    lamps += 1;
  }
  ctx.restore();
  return { mode, lamps };
}
