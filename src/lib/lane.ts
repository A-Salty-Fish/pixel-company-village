/**
 * Lane errands. Canned lines and counts only.
 * The caller stores the result on one viewer. No free text.
 */

export const LANE_ACTS = [
  { id: "well", label: "打一桶井水", line: "井水打上来了。" },
  { id: "fence", label: "扶一下篱笆", line: "篱笆扶正了。" },
  { id: "lantern", label: "点一盏路灯", line: "路灯点上了，没有声音。" },
  { id: "stone", label: "拾一块石", line: "石头放在路牙上。" },
  { id: "wind", label: "看看风向", line: "看过今天的风。" },
  { id: "hat", label: "把斗笠挂上", line: "斗笠挂在桩上了。" },
  { id: "ducks", label: "数一只鸭", line: "数到一只鸭。" },
  { id: "gate", label: "关上栅门", line: "栅门关上了。" },
  { id: "bridge", label: "在桥上站一下", line: "在桥上站了一下。" },
] as const;

export type LaneActId = (typeof LANE_ACTS)[number]["id"];

export type LaneState = {
  wellDay: string | null;
  fence: boolean;
  lantern: boolean;
  stone: number;
  windDay: string | null;
  windIndex: number | null;
  hat: boolean;
  ducks: number;
  gate: boolean;
  bridgeDay: string | null;
};

export type LaneLook = {
  on: boolean;
  well: boolean;
  fence: boolean;
  lantern: boolean;
  stone: number;
  hat: boolean;
  ducks: number;
  gate: boolean;
  bridge: boolean;
  bob: boolean;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CAP = 3;

export const WIND_LINES = ["今天的风朝东。", "今天的风朝南。", "今天的风朝西。", "今天的风朝北。"] as const;

const REPEAT: Record<LaneActId, string> = {
  well: "今天已经打过井水。",
  fence: "篱笆已经扶正。",
  lantern: "路灯已经点着。",
  stone: "路牙上已经有三块石。",
  wind: "今天的风已经看过。",
  hat: "斗笠已经挂上。",
  ducks: "鸭子已经数到三只。",
  gate: "栅门已经关上。",
  bridge: "今天已经在桥上站过。",
};

export function emptyLane(): LaneState {
  return {
    wellDay: null,
    fence: false,
    lantern: false,
    stone: 0,
    windDay: null,
    windIndex: null,
    hat: false,
    ducks: 0,
    gate: false,
    bridgeDay: null,
  };
}

export function emptyLaneLook(): LaneLook {
  return {
    on: false,
    well: false,
    fence: false,
    lantern: false,
    stone: 0,
    hat: false,
    ducks: 0,
    gate: false,
    bridge: false,
    bob: false,
  };
}

export function isLaneAct(value: string): value is LaneActId {
  return LANE_ACTS.some((act) => act.id === value);
}

function dayOrNull(value: unknown): string | null {
  return typeof value === "string" && DAY.test(value) ? value : null;
}

function flag(value: unknown) {
  return value === true;
}

function count(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(CAP, Math.floor(value)));
}

function windIndexOf(ymd: string) {
  let h = 2166136261;
  for (let i = 0; i < ymd.length; i += 1) {
    h ^= ymd.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % WIND_LINES.length;
}

/** Keep dates, flags, and counts. Drop sentences and unknown fields. */
export function readLane(value: unknown): LaneState {
  if (!value || typeof value !== "object") return emptyLane();
  const raw = value as Record<string, unknown>;
  const windIndex = count(raw.windIndex);
  const stored = typeof raw.windIndex === "number" && raw.windIndex >= 0 && raw.windIndex < WIND_LINES.length;
  return {
    wellDay: dayOrNull(raw.wellDay),
    fence: flag(raw.fence),
    lantern: flag(raw.lantern),
    stone: count(raw.stone),
    windDay: dayOrNull(raw.windDay),
    windIndex: stored ? windIndex : null,
    hat: flag(raw.hat),
    ducks: count(raw.ducks),
    gate: flag(raw.gate),
    bridgeDay: dayOrNull(raw.bridgeDay),
  };
}

export function laneLook(lane: LaneState, ymd: string, enabled: boolean, reduced: boolean): LaneLook {
  if (!enabled) return emptyLaneLook();
  return {
    on: true,
    well: lane.wellDay === ymd,
    fence: lane.fence,
    lantern: lane.lantern,
    stone: lane.stone,
    hat: lane.hat,
    ducks: lane.ducks,
    gate: lane.gate,
    bridge: lane.bridgeDay === ymd,
    bob: !reduced,
  };
}

export function duckLine(n: number) {
  return `数到一只鸭。已数 ${n}/3。`;
}

export function windLine(index: number) {
  return WIND_LINES[index] ?? WIND_LINES[0];
}

function actLine(id: LaneActId) {
  return LANE_ACTS.find((act) => act.id === id)?.line ?? "";
}

export function playLane(lane: LaneState, id: string, ymd: string, enabled: boolean) {
  if (!enabled) return { ok: false as const, line: "路边小事关着。", lane };
  if (!isLaneAct(id) || !DAY.test(ymd)) return { ok: false as const, line: "没有这件事。", lane };
  if (id === "well") {
    if (lane.wellDay === ymd) return { ok: false as const, line: REPEAT.well, lane };
    return { ok: true as const, line: actLine(id), lane: { ...lane, wellDay: ymd } };
  }
  if (id === "bridge") {
    if (lane.bridgeDay === ymd) return { ok: false as const, line: REPEAT.bridge, lane };
    return { ok: true as const, line: actLine(id), lane: { ...lane, bridgeDay: ymd } };
  }
  if (id === "wind") {
    if (lane.windDay === ymd && lane.windIndex !== null) return { ok: false as const, line: REPEAT.wind, lane };
    const windIndex = windIndexOf(ymd);
    return { ok: true as const, line: windLine(windIndex), lane: { ...lane, windDay: ymd, windIndex } };
  }
  if (id === "stone") {
    if (lane.stone >= CAP) return { ok: false as const, line: REPEAT.stone, lane };
    return { ok: true as const, line: actLine(id), lane: { ...lane, stone: lane.stone + 1 } };
  }
  if (id === "ducks") {
    if (lane.ducks >= CAP) return { ok: false as const, line: REPEAT.ducks, lane };
    const ducks = lane.ducks + 1;
    return { ok: true as const, line: duckLine(ducks), lane: { ...lane, ducks } };
  }
  if (id === "fence" && lane.fence) return { ok: false as const, line: REPEAT.fence, lane };
  if (id === "lantern" && lane.lantern) return { ok: false as const, line: REPEAT.lantern, lane };
  if (id === "hat" && lane.hat) return { ok: false as const, line: REPEAT.hat, lane };
  if (id === "gate" && lane.gate) return { ok: false as const, line: REPEAT.gate, lane };
  return {
    ok: true as const,
    line: actLine(id),
    lane: {
      ...lane,
      fence: id === "fence" ? true : lane.fence,
      lantern: id === "lantern" ? true : lane.lantern,
      hat: id === "hat" ? true : lane.hat,
      gate: id === "gate" ? true : lane.gate,
    },
  };
}

export function laneCopyLines() {
  return [
    ...LANE_ACTS.flatMap((act) => [act.label, act.line]),
    ...WIND_LINES,
    ...Object.values(REPEAT),
    duckLine(1),
    duckLine(2),
    duckLine(3),
    "路边小事关着。",
    "没有这件事。",
    "先选定「我是谁」，路边的事才记在这台电脑上。",
    "只做罐头动作。石头和鸭子最多三次。",
  ];
}
