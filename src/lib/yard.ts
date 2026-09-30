/**
 * Yard errands. Canned lines and counts only, scoped by the caller to one viewer.
 * No free text, no chat, no shared board.
 */

export const YARD_ACTS = [
  { id: "hen", label: "喂一次鸡", line: "给鸡撒了一把谷。" },
  { id: "laundry", label: "晾一件衣", line: "衣裳晾在绳上了。" },
  { id: "stove", label: "点上灶火", line: "灶火点上了，屋里暖一点。" },
  { id: "bell", label: "摇一下无声铃", line: "铃没有声音，只记了一次。" },
  { id: "grain", label: "拾一穗", line: "拾起一穗，放在田边。" },
  { id: "shutters", label: "合上窗板", line: "窗板合上了。" },
  { id: "bowl", label: "摆一只碗", line: "碗摆在桌上了。" },
  { id: "sweep", label: "扫一扫门前", line: "门前扫过了。" },
  { id: "pepper", label: "挂一串椒", line: "椒串挂在檐下了。" },
] as const;

export type YardActId = (typeof YARD_ACTS)[number]["id"];

export type YardState = {
  henDay: string | null;
  laundry: boolean;
  stove: boolean;
  bell: number;
  grain: number;
  shutters: boolean;
  bowl: boolean;
  sweepDay: string | null;
  pepper: boolean;
};

export type YardLook = {
  on: boolean;
  hen: boolean;
  laundry: boolean;
  stove: boolean;
  bell: number;
  grain: number;
  shutters: boolean;
  bowl: boolean;
  pepper: boolean;
  wear: boolean;
  sway: boolean;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CAP = 3;

const REPEAT: Record<YardActId, string> = {
  hen: "今天已经喂过鸡。",
  laundry: "衣裳已经在绳上。",
  stove: "灶火已经点着。",
  bell: "铃只记三次，没有声音。",
  grain: "田边已经有三穗。",
  shutters: "窗板已经合上。",
  bowl: "碗已经在桌上。",
  sweep: "门前今天扫过了。",
  pepper: "椒串已经挂上。",
};

export function emptyYard(): YardState {
  return {
    henDay: null,
    laundry: false,
    stove: false,
    bell: 0,
    grain: 0,
    shutters: false,
    bowl: false,
    sweepDay: null,
    pepper: false,
  };
}

export function emptyYardLook(): YardLook {
  return {
    on: false,
    hen: false,
    laundry: false,
    stove: false,
    bell: 0,
    grain: 0,
    shutters: false,
    bowl: false,
    pepper: false,
    wear: false,
    sway: false,
  };
}

export function isYardAct(value: string): value is YardActId {
  return YARD_ACTS.some((act) => act.id === value);
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

/** Keep known flags. Drop free text, chat-shaped fields, and unknown ids. */
export function readYard(value: unknown): YardState {
  if (!value || typeof value !== "object") return emptyYard();
  const raw = value as Record<string, unknown>;
  return {
    henDay: dayOrNull(raw.henDay),
    laundry: flag(raw.laundry),
    stove: flag(raw.stove),
    bell: count(raw.bell),
    grain: count(raw.grain),
    shutters: flag(raw.shutters),
    bowl: flag(raw.bowl),
    sweepDay: dayOrNull(raw.sweepDay),
    pepper: flag(raw.pepper),
  };
}

export function yardLook(yard: YardState, ymd: string, enabled: boolean, reduced: boolean): YardLook {
  if (!enabled) return emptyYardLook();
  return {
    on: true,
    hen: yard.henDay === ymd,
    laundry: yard.laundry,
    stove: yard.stove,
    bell: yard.bell,
    grain: yard.grain,
    shutters: yard.shutters,
    bowl: yard.bowl,
    pepper: yard.pepper,
    wear: yard.sweepDay !== ymd,
    sway: !reduced,
  };
}

function actLine(id: YardActId) {
  return YARD_ACTS.find((act) => act.id === id)?.line ?? "";
}

export function playYard(yard: YardState, id: string, ymd: string, enabled: boolean) {
  if (!enabled) return { ok: false as const, line: "院里小事关着。", yard };
  if (!isYardAct(id) || !DAY.test(ymd)) return { ok: false as const, line: "没有这件事。", yard };
  if (id === "hen") {
    if (yard.henDay === ymd) return { ok: false as const, line: REPEAT.hen, yard };
    return { ok: true as const, line: actLine(id), yard: { ...yard, henDay: ymd } };
  }
  if (id === "sweep") {
    if (yard.sweepDay === ymd) return { ok: false as const, line: REPEAT.sweep, yard };
    return { ok: true as const, line: actLine(id), yard: { ...yard, sweepDay: ymd } };
  }
  if (id === "bell") {
    if (yard.bell >= CAP) return { ok: false as const, line: REPEAT.bell, yard };
    return { ok: true as const, line: actLine(id), yard: { ...yard, bell: yard.bell + 1 } };
  }
  if (id === "grain") {
    if (yard.grain >= CAP) return { ok: false as const, line: REPEAT.grain, yard };
    return { ok: true as const, line: actLine(id), yard: { ...yard, grain: yard.grain + 1 } };
  }
  if (id === "laundry" && yard.laundry) return { ok: false as const, line: REPEAT.laundry, yard };
  if (id === "stove" && yard.stove) return { ok: false as const, line: REPEAT.stove, yard };
  if (id === "shutters" && yard.shutters) return { ok: false as const, line: REPEAT.shutters, yard };
  if (id === "bowl" && yard.bowl) return { ok: false as const, line: REPEAT.bowl, yard };
  if (id === "pepper" && yard.pepper) return { ok: false as const, line: REPEAT.pepper, yard };
  return {
    ok: true as const,
    line: actLine(id),
    yard: {
      ...yard,
      laundry: id === "laundry" ? true : yard.laundry,
      stove: id === "stove" ? true : yard.stove,
      shutters: id === "shutters" ? true : yard.shutters,
      bowl: id === "bowl" ? true : yard.bowl,
      pepper: id === "pepper" ? true : yard.pepper,
    },
  };
}

export function yardCopyLines() {
  return [
    ...YARD_ACTS.flatMap((act) => [act.label, act.line]),
    ...Object.values(REPEAT),
    "院里小事关着。",
    "没有这件事。",
    "先选定「我是谁」，院里的事才记在这台电脑上。",
    "只做罐头动作，记在这个人身上。铃和穗最多三次。",
  ];
}
