import { EMPTY_LOOPS, parsePebbles, pebbleStorageKey, sanitizeLoops, loopStorageKey, type LoopBlob } from "@/lib/village-loops";

function readRaw(store: Storage, key: string) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function loadLoops(viewer: string | null): LoopBlob {
  if (!viewer || typeof window === "undefined") return sanitizeLoops(null);
  const raw = readRaw(window.localStorage, loopStorageKey(viewer));
  if (!raw) return sanitizeLoops(null);
  try {
    return sanitizeLoops(JSON.parse(raw));
  } catch {
    return sanitizeLoops(null);
  }
}

export function saveLoops(viewer: string, blob: LoopBlob) {
  if (typeof window === "undefined") return;
  writeRaw(window.localStorage, loopStorageKey(viewer), JSON.stringify(sanitizeLoops(blob)));
}

export function loadPebbles(viewer: string | null) {
  if (!viewer || typeof window === "undefined") return 0;
  return parsePebbles(readRaw(window.sessionStorage, pebbleStorageKey(viewer)));
}

export function savePebbles(viewer: string, count: number) {
  if (typeof window === "undefined") return;
  writeRaw(window.sessionStorage, pebbleStorageKey(viewer), String(parsePebbles(count)));
}

export type LoopSnap = {
  rev: number;
  loops: LoopBlob;
  pebbles: number;
  viewer: string | null;
};

const SERVER_LOOPS: LoopSnap = { rev: 0, loops: EMPTY_LOOPS, pebbles: 0, viewer: null };
let snap: LoopSnap = SERVER_LOOPS;
const listeners = new Set<() => void>();

function emit(patch: Partial<Omit<LoopSnap, "rev">>) {
  snap = { ...snap, ...patch, rev: snap.rev + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeLoops(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLoopSnapshot() {
  return snap;
}

export function getServerLoopSnapshot() {
  return SERVER_LOOPS;
}

/** Load one viewer's yard. Rewrites storage so stray text fields cannot linger. */
export function bindLoops(viewer: string | null) {
  if (!viewer) {
    emit({ loops: sanitizeLoops(null), pebbles: 0, viewer: null });
    return;
  }
  const loops = loadLoops(viewer);
  const pebbles = loadPebbles(viewer);
  saveLoops(viewer, loops);
  savePebbles(viewer, pebbles);
  emit({ loops, pebbles, viewer });
}

export function updateLoops(recipe: (current: LoopBlob) => LoopBlob) {
  const next = sanitizeLoops(recipe(snap.loops));
  if (snap.viewer) saveLoops(snap.viewer, next);
  emit({ loops: next });
  return next;
}

export function updatePebbles(count: number) {
  const next = parsePebbles(count);
  if (snap.viewer) savePebbles(snap.viewer, next);
  emit({ pebbles: next });
  return next;
}
