export type VillageTestState = {
  ready: boolean;
  rosterNames: string[];
  selectedName: string | null;
  scored: Record<string, boolean>;
  season: string;
  festival: string | null;
  comfort: {
    quiet: boolean;
    hideScores: boolean;
    reduceMotion: boolean;
  };
  selfName: string | null;
};

export type KindnessActionName = "seed" | "coffee" | "rod" | "water";

export type VillageTestApi = {
  ready: () => boolean;
  freezeAnimations: (on?: boolean) => void;
  setClock: (iso: string | null) => void;
  getState: () => VillageTestState;
  selectVillager: (name: string | null) => void;
  playKindness: (name: string, action: KindnessActionName) => Promise<{ ok: boolean; line: string }>;
  forceLoadTimeout: () => void;
  clearRoster: () => void;
  injectBadRecord: () => void;
};

declare global {
  interface Window {
    __VILLAGE_TEST__?: VillageTestApi;
  }
}

export function testHooksEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_VILLAGE_TEST === "1";
}

export function installVillageTestHook(
  api: Omit<VillageTestApi, "ready"> & { getState: () => VillageTestState },
) {
  if (!testHooksEnabled() || typeof window === "undefined") return () => {};
  const hook: VillageTestApi = {
    ready: () => Boolean(document.querySelector("canvas[data-village-ready='1']")),
    freezeAnimations: api.freezeAnimations,
    setClock: api.setClock,
    getState: api.getState,
    selectVillager: api.selectVillager,
    playKindness: api.playKindness,
    forceLoadTimeout: api.forceLoadTimeout,
    clearRoster: api.clearRoster,
    injectBadRecord: api.injectBadRecord,
  };
  window.__VILLAGE_TEST__ = hook;
  return () => {
    if (window.__VILLAGE_TEST__ === hook) delete window.__VILLAGE_TEST__;
  };
}
