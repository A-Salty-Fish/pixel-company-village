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

/* PV-MAGIC-PLAY-001 — tiny arpeggios for wizard play. Same gate as the gestures: mute or reduced motion is silence. */
export const MAGIC_SFX_ENABLED = true;
export const MAGIC_SFX_IDS = ["chain", "ultimate", "wish", "rune", "summon", "portal", "badge", "chorus", "charge"] as const;
export type MagicSfxId = (typeof MAGIC_SFX_IDS)[number];
/** Notes in Hz, one every `step` ms; gain stays at or under 0.03. */
export const MAGIC_SFX_SPEC: Record<MagicSfxId, { notes: readonly number[]; step: number; gain: number; type: OscillatorType }> = {
  chain: { notes: [784, 1175], step: 60, gain: 0.018, type: "square" },
  ultimate: { notes: [392, 523, 659, 784], step: 70, gain: 0.022, type: "triangle" },
  wish: { notes: [1047, 1319], step: 80, gain: 0.016, type: "sine" },
  rune: { notes: [659, 880], step: 70, gain: 0.016, type: "triangle" },
  summon: { notes: [523, 784, 659], step: 60, gain: 0.016, type: "square" },
  portal: { notes: [880, 659, 440], step: 70, gain: 0.018, type: "sine" },
  badge: { notes: [659, 784, 1047, 1319], step: 80, gain: 0.02, type: "triangle" },
  chorus: { notes: [523, 659, 784, 1047], step: 90, gain: 0.018, type: "sine" },
  charge: { notes: [262, 330], step: 90, gain: 0.012, type: "triangle" },
};

export function magicSfxSpec(id: MagicSfxId, allowed: boolean, enabled = MAGIC_SFX_ENABLED) {
  return enabled && allowed ? MAGIC_SFX_SPEC[id] : null;
}

export function playMagicSfx(id: MagicSfxId, allowed: boolean): GestureAudio {
  const spec = magicSfxSpec(id, allowed);
  if (!spec) return "silent";
  const ctx = audioContext();
  if (!ctx) return "silent";
  try {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    spec.notes.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const at = now + (i * spec.step) / 1000;
      const end = at + Math.max(0.06, spec.step / 1000) * 1.4;
      osc.type = spec.type;
      osc.frequency.setValueAtTime(hz, at);
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(spec.gain, at + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(env);
      env.connect(gain);
      osc.start(at);
      osc.stop(end + 0.02);
    });
    return "played";
  } catch {
    return "silent";
  }
}
