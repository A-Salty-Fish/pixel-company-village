/**
 * PV-PM-022 — one short local click when a button is pressed.
 * No chat audio and no recorded voice. The village bed stays off.
 *
 * LIGHT_SFX_ENABLED defaults on, but sound stays silent until
 * 体贴设置 → 装饰 unchecks 「轻声」 (Comfort.sfxMuted, default true).
 * 减少动作 also skips the click.
 * Set LIGHT_SFX_ENABLED to false to remove the cue.
 * AMBIENT_BED_ENABLED stays false; do not loop a bed from this module.
 */

export const LIGHT_SFX_ENABLED = true;
export const AMBIENT_BED_ENABLED = false;

export const CLICK_HZ = 740;
export const CLICK_GAIN = 0.028;
export const CLICK_MS = 42;

export type SfxMark = "off" | "muted" | "still" | "live";

export function sfxMark(muted: boolean, reduceMotion: boolean, enabled = LIGHT_SFX_ENABLED): SfxMark {
  if (!enabled) return "off";
  if (muted) return "muted";
  if (reduceMotion) return "still";
  return "live";
}

/** Unmute plus motion. The village bed is a separate flag and is not played here. */
export function sfxAllowed(input: { muted: boolean; reduceMotion: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? LIGHT_SFX_ENABLED;
  return enabled && !input.muted && !input.reduceMotion;
}

export function clickSpec(allowed: boolean) {
  if (!allowed) return null;
  return { hz: CLICK_HZ, gain: CLICK_GAIN, ms: CLICK_MS };
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let shared: AudioContext | null = null;

/** Schedules a tiny sine blip. Returns skipped when the gate is closed or audio is missing. */
export function playUiClick(allowed: boolean): "played" | "skipped" {
  const spec = clickSpec(allowed);
  if (!spec || typeof window === "undefined") return "skipped";
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctx) return "skipped";
  try {
    if (!shared) shared = new Ctx();
    const ctx = shared;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const end = now + spec.ms / 1000;
    osc.type = "sine";
    osc.frequency.setValueAtTime(spec.hz, now);
    osc.frequency.exponentialRampToValueAtTime(180, end);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(end + 0.01);
    return "played";
  } catch {
    return "skipped";
  }
}
