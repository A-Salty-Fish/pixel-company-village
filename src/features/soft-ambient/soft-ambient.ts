/**
 * PV-PM-037 — a very soft wind and water loop once sound is unmuted.
 * It sits under the existing clicks and gesture tones. Mute stays the default.
 * Set SOFT_AMBIENT_ENABLED to false to skip the loop.
 */

export const SOFT_AMBIENT_ENABLED = true;

export const WIND_HZ = 78;
export const WATER_HZ = 196;
export const WIND_GAIN = 0.0016;
export const WATER_GAIN = 0.0011;

export function softAmbientOn(input: { muted: boolean; reduceMotion: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? SOFT_AMBIENT_ENABLED;
  return enabled && !input.muted && !input.reduceMotion;
}

/** Quieter than a click or a gesture, so the loop stays underneath. */
export function softAmbientUnderSfx(clickGain: number, gestureGain: number) {
  return WIND_GAIN < clickGain && WATER_GAIN < clickGain && WIND_GAIN < gestureGain && WATER_GAIN < gestureGain;
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

type Bed = {
  wind: OscillatorNode;
  water: OscillatorNode;
  lfo: OscillatorNode;
};

let shared: AudioContext | null = null;
let bed: Bed | null = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctx) return null;
  if (!shared) shared = new Ctx();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}

export function syncSoftAmbient(on: boolean): "live" | "off" {
  if (!on || !SOFT_AMBIENT_ENABLED) {
    if (bed) {
      try {
        bed.wind.stop();
        bed.water.stop();
        bed.lfo.stop();
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
    const wind = ctx.createOscillator();
    const water = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const windGain = ctx.createGain();
    const waterGain = ctx.createGain();
    wind.type = "sine";
    wind.frequency.value = WIND_HZ;
    water.type = "triangle";
    water.frequency.value = WATER_HZ;
    lfo.type = "sine";
    lfo.frequency.value = 0.16;
    lfoGain.gain.value = WIND_GAIN * 0.4;
    windGain.gain.value = WIND_GAIN;
    waterGain.gain.value = WATER_GAIN;
    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);
    wind.connect(windGain);
    water.connect(waterGain);
    windGain.connect(ctx.destination);
    waterGain.connect(ctx.destination);
    wind.start();
    water.start();
    lfo.start();
    bed = { wind, water, lfo };
    return "live";
  } catch {
    return "off";
  }
}
