/** Staged boot for the farm canvas. Terrain first, then the roster, then villagers. */

export const ART_TIMEOUT_MS = 8_000;

export type LoadStage = "terrain" | "roster" | "villagers" | "ready" | "timeout" | "failed";

export function deriveLoadStage(input: {
  elapsedMs: number;
  artReady: boolean;
  rosterCount: number;
  failed: boolean;
  forcedTimeout?: boolean;
}): LoadStage {
  if (input.artReady && !input.forcedTimeout) return "ready";
  if (input.forcedTimeout) return "timeout";
  if (input.failed) return "failed";
  if (input.elapsedMs >= ART_TIMEOUT_MS) return "timeout";
  if (input.rosterCount > 0 && input.elapsedMs >= 450) return "roster";
  return "terrain";
}

export function loadStageLabel(stage: LoadStage) {
  if (stage === "terrain") return "正在铺地形…";
  if (stage === "roster") return "名册已经到了，接着请小人…";
  if (stage === "villagers") return "小人正在入场…";
  if (stage === "timeout" || stage === "failed") return "田垄铺得太久了。";
  return "村子铺好了。";
}
