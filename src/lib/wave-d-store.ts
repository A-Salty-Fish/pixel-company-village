import {
  EMPTY_WAVE,
  migrateWaveKey,
  sanitizeWave,
  storageSweepPlan,
  touchWaveDay,
  waveStorageKey,
  type WaveDBlob,
} from "@/lib/wave-d";

function readRaw(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function loadWave(viewer: string | null): WaveDBlob {
  if (!viewer) return sanitizeWave(null);
  const raw = readRaw(waveStorageKey(viewer));
  if (!raw) return sanitizeWave(null);
  try {
    return sanitizeWave(JSON.parse(raw));
  } catch {
    return sanitizeWave(null);
  }
}

export function saveWave(viewer: string, blob: WaveDBlob) {
  writeRaw(waveStorageKey(viewer), JSON.stringify(sanitizeWave(blob)));
}

export function migrateLegacyWave(viewer: string | null) {
  if (!viewer || typeof window === "undefined") return false;
  return migrateWaveKey(
    viewer,
    (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    (key, value) => {
      try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        /* private mode */
      }
    },
  );
}

export function sweepVillageStorage() {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = [];
    try {
      for (let index = 0; index < store.length; index += 1) {
        const key = store.key(index);
        if (key) keys.push(key);
      }
      for (const key of storageSweepPlan(keys)) store.removeItem(key);
    } catch {
      /* storage blocked */
    }
  }
}

export type WaveSnap = {
  rev: number;
  wave: WaveDBlob;
  viewer: string | null;
};

const SERVER_WAVE: WaveSnap = { rev: 0, wave: EMPTY_WAVE, viewer: null };
let snap: WaveSnap = SERVER_WAVE;
const listeners = new Set<() => void>();

function emit(patch: Partial<Omit<WaveSnap, "rev">>) {
  snap = { ...snap, ...patch, rev: snap.rev + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeWave(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWaveSnapshot() {
  return snap;
}

export function getServerWaveSnapshot() {
  return SERVER_WAVE;
}

export function bindWave(viewer: string | null, ymd: string) {
  if (!viewer) {
    emit({ wave: sanitizeWave(null), viewer: null });
    return;
  }
  const stored = touchWaveDay(loadWave(viewer), ymd);
  saveWave(viewer, stored);
  emit({ wave: stored, viewer });
}

export function updateWave(recipe: (current: WaveDBlob) => WaveDBlob) {
  const next = sanitizeWave(recipe(snap.wave));
  if (next === snap.wave) return next;
  if (snap.viewer) saveWave(snap.viewer, next);
  emit({ wave: next });
  return next;
}
