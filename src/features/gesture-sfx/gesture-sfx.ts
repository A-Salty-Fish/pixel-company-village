/**
 * PV-PM-025 — lamp, wave, and find-me each have a short local tone.
 * Mute defaults on, so a fresh visit stays quiet. Ambient bed defaults off.
 * Mute off is fully silent, including the bed.
 * Set GESTURE_SFX_ENABLED to false to remove the tones and the map toggles.
 */

export const GESTURE_SFX_ENABLED = true;

export const GESTURE_IDS = ["lamp", "wave", "find"] as const;
export type GestureId = (typeof GESTURE_IDS)[number];

export const GESTURE_SPEC: Record<GestureId, { hz: number; gain: number; ms: number }> = {
  lamp: { hz: 494, gain: 0.02, ms: 90 },
  wave: { hz: 659, gain: 0.02, ms: 110 },
  find: { hz: 880, gain: 0.016, ms: 70 },
};

export const AMBIENT_HZ = 146;
export const AMBIENT_GAIN = 0.004;

export type GestureAudio = "played" | "silent";

/** Mute or reduced motion closes the gate. Default mute is the caller's job. */
export function gestureAllowed(input: { muted: boolean; reduceMotion: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? GESTURE_SFX_ENABLED;
  return enabled && !input.muted && !input.reduceMotion;
}

export function gestureSpec(id: GestureId, allowed: boolean) {
  if (!allowed) return null;
  return GESTURE_SPEC[id];
}

/** Ambient never plays while muted, even if the bed toggle is on. */
export function ambientBedOn(input: { muted: boolean; ambient: boolean; reduceMotion: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? GESTURE_SFX_ENABLED;
  return enabled && input.ambient && !input.muted && !input.reduceMotion;
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let shared: AudioContext | null = null;
let bed: { osc: OscillatorNode; gain: GainNode } | null = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctx) return null;
  if (!shared) shared = new Ctx();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}

export function playGesture(id: GestureId, allowed: boolean): GestureAudio {
  const spec = gestureSpec(id, allowed);
  if (!spec) return "silent";
  const ctx = audioContext();
  if (!ctx) return "silent";
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const end = now + spec.ms / 1000;
    osc.type = "sine";
    osc.frequency.setValueAtTime(spec.hz, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, spec.hz * 0.55), end);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(end + 0.02);
    return "played";
  } catch {
    return "silent";
  }
}

export function syncAmbientBed(on: boolean): "live" | "off" {
  if (!on) {
    if (bed) {
      try {
        bed.osc.stop();
      } catch {
        /* already stopped */
      }
      bed = null;
    }
    return "off";
  }
  if (bed) return "live";
  const ctx = audioContext();
  if (!ctx) return "off";
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = AMBIENT_HZ;
    gain.gain.value = AMBIENT_GAIN;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    bed = { osc, gain };
    return "live";
  } catch {
    return "off";
  }
}
