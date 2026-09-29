import { EMPTY_PLAY, sanitizePlay, touchDaily, type AnonFeed, type PlayBlob } from "@/lib/play-systems";

const ANON_KEY = "village:anon-feed-v1";

export function playStorageKey(viewer: string) {
  return `village:viewer:${viewer}:play`;
}

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

export function loadPlay(viewer: string | null): PlayBlob {
  if (!viewer) return sanitizePlay(null);
  const raw = readRaw(playStorageKey(viewer));
  if (!raw) return sanitizePlay(null);
  try {
    return sanitizePlay(JSON.parse(raw));
  } catch {
    return sanitizePlay(null);
  }
}

export function savePlay(viewer: string, blob: PlayBlob) {
  writeRaw(playStorageKey(viewer), JSON.stringify(blob));
}

export function loadAnon(): AnonFeed {
  const raw = readRaw(ANON_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const feed: AnonFeed = {};
    for (const [day, names] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(names)) continue;
      feed[day] = names.filter((name) => typeof name === "string").slice(0, 100);
    }
    return feed;
  } catch {
    return {};
  }
}

export function saveAnon(feed: AnonFeed) {
  writeRaw(ANON_KEY, JSON.stringify(feed));
}

export type PlaySnap = {
  rev: number;
  play: PlayBlob;
  anon: AnonFeed;
  viewer: string | null;
  bell: boolean;
  syncedAt: string | null;
};

const SERVER_SNAP: PlaySnap = {
  rev: 0,
  play: EMPTY_PLAY,
  anon: {},
  viewer: null,
  bell: false,
  syncedAt: null,
};

let snap: PlaySnap = SERVER_SNAP;
const listeners = new Set<() => void>();
let bellTimer = 0;

function emit(patch: Partial<Omit<PlaySnap, "rev">>) {
  snap = { ...snap, ...patch, rev: snap.rev + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribePlay(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlaySnapshot() {
  return snap;
}

export function getServerPlaySnapshot() {
  return SERVER_SNAP;
}

export function markScoreSync(label: string) {
  emit({ syncedAt: label });
}

export function bindViewer(viewer: string | null, ymd: string, festivalId: string | null) {
  if (!viewer) {
    emit({ play: EMPTY_PLAY, anon: loadAnon(), viewer: null, bell: false });
    return;
  }
  const stored = touchDaily(loadPlay(viewer), ymd, festivalId);
  savePlay(viewer, stored);
  emit({ play: stored, anon: loadAnon(), viewer, bell: snap.viewer === viewer ? snap.bell : false });
}

export function updatePlay(recipe: (current: PlayBlob) => PlayBlob) {
  const next = recipe(snap.play);
  if (next === snap.play) return next;
  if (snap.viewer) savePlay(snap.viewer, next);
  emit({ play: next });
  return next;
}

export function updateAnon(recipe: (current: AnonFeed) => AnonFeed) {
  const next = recipe(snap.anon);
  if (next === snap.anon) return next;
  saveAnon(next);
  emit({ anon: next });
  return next;
}

export function startBell() {
  if (snap.bell) return;
  emit({ bell: true });
  window.clearTimeout(bellTimer);
  bellTimer = window.setTimeout(() => {
    emit({ bell: false });
  }, 4000);
}
