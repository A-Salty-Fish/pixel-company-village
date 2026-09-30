import {
  EMPTY_NOOK,
  EMPTY_SESSION,
  nookSessionKey,
  nookStorageKey,
  sanitizeNook,
  sanitizeSession,
  type NookBlob,
  type NookSession,
} from "@/lib/yard-nook";

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

export function loadNook(viewer: string | null): NookBlob {
  if (!viewer || typeof window === "undefined") return sanitizeNook(null);
  const raw = readRaw(window.localStorage, nookStorageKey(viewer));
  if (!raw) return sanitizeNook(null);
  try {
    return sanitizeNook(JSON.parse(raw));
  } catch {
    return sanitizeNook(null);
  }
}

export function saveNook(viewer: string, blob: NookBlob) {
  if (typeof window === "undefined") return;
  writeRaw(window.localStorage, nookStorageKey(viewer), JSON.stringify(sanitizeNook(blob)));
}

export function loadNookSession(viewer: string | null): NookSession {
  if (!viewer || typeof window === "undefined") return sanitizeSession(null);
  const raw = readRaw(window.sessionStorage, nookSessionKey(viewer));
  if (!raw) return sanitizeSession(null);
  try {
    return sanitizeSession(JSON.parse(raw));
  } catch {
    return sanitizeSession(null);
  }
}

export function saveNookSession(viewer: string, session: NookSession) {
  if (typeof window === "undefined") return;
  writeRaw(window.sessionStorage, nookSessionKey(viewer), JSON.stringify(sanitizeSession(session)));
}

export type NookSnap = {
  rev: number;
  nook: NookBlob;
  session: NookSession;
  viewer: string | null;
};

const SERVER_NOOK: NookSnap = { rev: 0, nook: EMPTY_NOOK, session: EMPTY_SESSION, viewer: null };
let snap: NookSnap = SERVER_NOOK;
const listeners = new Set<() => void>();

function emit(patch: Partial<Omit<NookSnap, "rev">>) {
  snap = { ...snap, ...patch, rev: snap.rev + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeNook(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNookSnapshot() {
  return snap;
}

export function getServerNookSnapshot() {
  return SERVER_NOOK;
}

/** Load one viewer's yard edge and drop any stray text fields. */
export function bindNook(viewer: string | null) {
  if (!viewer) {
    emit({ nook: sanitizeNook(null), session: sanitizeSession(null), viewer: null });
    return;
  }
  const nook = loadNook(viewer);
  const session = loadNookSession(viewer);
  saveNook(viewer, nook);
  saveNookSession(viewer, session);
  emit({ nook, session, viewer });
}

export function updateNook(recipe: (current: NookBlob) => NookBlob) {
  const next = sanitizeNook(recipe(snap.nook));
  if (snap.viewer) saveNook(snap.viewer, next);
  emit({ nook: next });
  return next;
}

export function updateNookSession(recipe: (current: NookSession) => NookSession) {
  const next = sanitizeSession(recipe(snap.session));
  if (snap.viewer) saveNookSession(snap.viewer, next);
  emit({ session: next });
  return next;
}
