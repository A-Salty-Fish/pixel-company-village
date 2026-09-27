import { mergeVillagePeople } from "@/lib/roster";
import { publicScoreView, seedPayload } from "@/lib/scores";
import type { ScorePayload } from "@/lib/types";

export type StorageBackend = "memory";

type MemoryBag = {
  payload: ScorePayload | null;
};

const memory: MemoryBag = ((
  globalThis as typeof globalThis & { __villageMemory?: MemoryBag }
).__villageMemory ??= { payload: null });

export function storageBackend(): StorageBackend {
  return "memory";
}

function present(payload: ScorePayload) {
  return mergeVillagePeople(publicScoreView(payload));
}

export async function getScores(): Promise<ScorePayload> {
  if (memory.payload) return present(memory.payload);
  const seeded = present(seedPayload());
  memory.payload = seeded;
  return seeded;
}

export async function saveScores(payload: ScorePayload): Promise<void> {
  memory.payload = publicScoreView(payload);
}
