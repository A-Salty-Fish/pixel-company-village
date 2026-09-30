/**
 * Round 8 yard loops. Viewer-local canned copy, counts and indexes only.
 * Path pebbles stay in the tab session. No chat text, no server store.
 */

export const PEBBLE_CAP = 5;
export const SCARE_CAP = 24;
export const NOTICE_CAP = 48;
export const GATE_CAP = 48;
export const PICNIC_CAP = 30;

export const LOOP_IDS = [
  "mailbox",
  "scarecrow",
  "well",
  "crop",
  "pebble",
  "lantern",
  "notice",
  "coop",
  "gate",
  "picnic",
] as const;

export type LoopId = (typeof LOOP_IDS)[number];

export const LOOP_LABELS: Record<LoopId, string> = {
  mailbox: "门廊信箱",
  scarecrow: "稻草人",
  well: "井边许愿",
  crop: "田里看一眼",
  pebble: "小路石子",
  lantern: "黄昏灯笼",
  notice: "告示板",
  coop: "鸡舍",
  gate: "篱笆门",
  picnic: "野餐垫",
};

export const MAIL_NOTES = [
  "信箱里只有一张空白田契。",
  "一封罐头信：风从东边来。",
  "信箱空着，盖子还温。",
  "盖章的是今日天气，没有落款。",
] as const;

export const SCARECROW_TIPS = [
  "稻草人往左歪了一下。",
  "稻草人把帽子扶正了。",
  "稻草人朝田里点了点头。",
] as const;

export const WELL_WISHES = [
  "井里回了一声：慢慢来。",
  "水纹只答应自己。",
  "愿望留在井沿，不外传。",
] as const;

export const CROP_PEEKS = [
  "苗还矮，叶子上有露。",
  "菜畦绿了一圈。",
  "穗尖开始弯了。",
  "田里已经能站住人。",
] as const;

export const NOTICE_PAGES = [
  "告示：小事做不做都不公示。",
  "告示：安静村子仍是默认。",
  "告示：井边的话只留在这台电脑。",
  "告示：这里不记说过的话。",
] as const;

export const COOP_PEEKS = [
  "母鸡在窝里，没数蛋。",
  "公鸡站在横杆上，不报时。",
  "鸡舍门缝里透出一点暖。",
] as const;

export const LOCKED_LINE = "先选定「我是谁」，小玩法才记在这台电脑上。";
export const LOOP_INTRO =
  "十件小事都留在这台浏览器，记在当前的「我是谁」上。小路石子只留在这个标签页。减少动作时灯笼只留静光。不记说过的话。";
export const LOOP_IDLE = "点一处院子里的东西。";

export type GlowMode = "off" | "still" | "pulse";
export type Lean = "none" | "left" | "right";

export type LoopBlob = {
  mailDay: string | null;
  mailIndex: number | null;
  scareTips: number;
  wishDay: string | null;
  wishIndex: number | null;
  cropDay: string | null;
  cropIndex: number | null;
  lanternGlow: boolean;
  noticeIndex: number;
  noticeFlips: number;
  coopDay: string | null;
  coopIndex: number | null;
  gateOpen: boolean;
  gateClicks: number;
  picnicDown: boolean;
  picnicDay: string | null;
  picnicRests: number;
};

export const LOOP_FIELDS = [
  "mailDay",
  "mailIndex",
  "scareTips",
  "wishDay",
  "wishIndex",
  "cropDay",
  "cropIndex",
  "lanternGlow",
  "noticeIndex",
  "noticeFlips",
  "coopDay",
  "coopIndex",
  "gateOpen",
  "gateClicks",
  "picnicDown",
  "picnicDay",
  "picnicRests",
] as const;

export const EMPTY_LOOPS: LoopBlob = {
  mailDay: null,
  mailIndex: null,
  scareTips: 0,
  wishDay: null,
  wishIndex: null,
  cropDay: null,
  cropIndex: null,
  lanternGlow: false,
  noticeIndex: 0,
  noticeFlips: 0,
  coopDay: null,
  coopIndex: null,
  gateOpen: false,
  gateClicks: 0,
  picnicDown: false,
  picnicDay: null,
  picnicRests: 0,
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function emptyLoops(): LoopBlob {
  return { ...EMPTY_LOOPS };
}

export function loopStorageKey(viewer: string) {
  return `village:viewer:${viewer}:loops-r8`;
}

export function pebbleStorageKey(viewer: string) {
  return `village:viewer:${viewer}:pebbles-r8`;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function loopSalt(viewer: string, ymd: string) {
  return hash(`${viewer}:${ymd}`);
}

function clampInt(value: number, cap: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(cap, Math.floor(value));
}

function readDay(value: unknown) {
  return typeof value === "string" && YMD.test(value) ? value : null;
}

function readIndex(value: unknown, length: number) {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value >= length) return null;
  return value;
}

export function sanitizeLoops(value: unknown): LoopBlob {
  if (!value || typeof value !== "object") return emptyLoops();
  const raw = value as Partial<LoopBlob>;
  const noticeIndex = readIndex(raw.noticeIndex, NOTICE_PAGES.length);
  return {
    mailDay: readDay(raw.mailDay),
    mailIndex: readIndex(raw.mailIndex, MAIL_NOTES.length),
    scareTips: clampInt(typeof raw.scareTips === "number" ? raw.scareTips : 0, SCARE_CAP),
    wishDay: readDay(raw.wishDay),
    wishIndex: readIndex(raw.wishIndex, WELL_WISHES.length),
    cropDay: readDay(raw.cropDay),
    cropIndex: readIndex(raw.cropIndex, CROP_PEEKS.length),
    lanternGlow: raw.lanternGlow === true,
    noticeIndex: noticeIndex ?? 0,
    noticeFlips: clampInt(typeof raw.noticeFlips === "number" ? raw.noticeFlips : 0, NOTICE_CAP),
    coopDay: readDay(raw.coopDay),
    coopIndex: readIndex(raw.coopIndex, COOP_PEEKS.length),
    gateOpen: raw.gateOpen === true,
    gateClicks: clampInt(typeof raw.gateClicks === "number" ? raw.gateClicks : 0, GATE_CAP),
    picnicDown: raw.picnicDown === true,
    picnicDay: readDay(raw.picnicDay),
    picnicRests: clampInt(typeof raw.picnicRests === "number" ? raw.picnicRests : 0, PICNIC_CAP),
  };
}

/** Session pebble bag. Digits only, never a sentence. */
export function parsePebbles(value: unknown) {
  if (typeof value === "number") return clampInt(value, PEBBLE_CAP);
  if (typeof value === "string" && /^\d+$/.test(value)) return clampInt(Number(value), PEBBLE_CAP);
  return 0;
}

export type LoopView = { blob: LoopBlob; pebbles: number };

export type LoopContext = { ymd: string; salt: number; cropTier: number };

export function lanternGlow(on: boolean, reduced: boolean): GlowMode {
  if (!on) return "off";
  return reduced ? "still" : "pulse";
}

export function scareLean(tips: number): Lean {
  if (tips <= 0) return "none";
  return tips % 2 === 1 ? "left" : "right";
}

function dayNote(list: readonly string[], index: number | null) {
  if (index === null) return list[0];
  return list[index] ?? list[0];
}

function tierIndex(tier: number) {
  if (!Number.isFinite(tier)) return 0;
  return Math.max(0, Math.min(CROP_PEEKS.length - 1, Math.floor(tier)));
}

export function checkMailbox(blob: LoopBlob, ymd: string, salt: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.mailDay === ymd && blob.mailIndex !== null) {
    return { blob, line: `信箱今天看过了。${dayNote(MAIL_NOTES, blob.mailIndex)}` };
  }
  const mailIndex = Math.abs(salt) % MAIL_NOTES.length;
  return { blob: { ...blob, mailDay: ymd, mailIndex }, line: MAIL_NOTES[mailIndex] };
}

export function tipScarecrow(blob: LoopBlob) {
  if (blob.scareTips >= SCARE_CAP) return { blob, line: "稻草人已经歪够了。" };
  const scareTips = blob.scareTips + 1;
  const line = SCARECROW_TIPS[(scareTips - 1) % SCARECROW_TIPS.length];
  return { blob: { ...blob, scareTips }, line };
}

export function wishAtWell(blob: LoopBlob, ymd: string, salt: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.wishDay === ymd && blob.wishIndex !== null) {
    return { blob, line: `井今天听过了。${dayNote(WELL_WISHES, blob.wishIndex)}` };
  }
  const wishIndex = Math.abs(salt) % WELL_WISHES.length;
  return { blob: { ...blob, wishDay: ymd, wishIndex }, line: WELL_WISHES[wishIndex] };
}

export function peekCrop(blob: LoopBlob, ymd: string, tier: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.cropDay === ymd && blob.cropIndex !== null) {
    return { blob, line: `田里还是刚才那样。${dayNote(CROP_PEEKS, blob.cropIndex)}` };
  }
  const cropIndex = tierIndex(tier);
  return { blob: { ...blob, cropDay: ymd, cropIndex }, line: CROP_PEEKS[cropIndex] };
}

export function collectPebble(count: number) {
  const safe = parsePebbles(count);
  if (safe >= PEBBLE_CAP) return { count: safe, line: "口袋里的石子已经满了。这个标签页先留着。" };
  const next = safe + 1;
  return { count: next, line: `捡起一颗小路石子。口袋里 ${next}/${PEBBLE_CAP}。` };
}

export function toggleLantern(blob: LoopBlob) {
  const lanternGlowOn = !blob.lanternGlow;
  return {
    blob: { ...blob, lanternGlow: lanternGlowOn },
    line: lanternGlowOn ? "黄昏灯笼亮了。只亮在这台电脑上。" : "黄昏灯笼灭了。",
  };
}

export function flipNotice(blob: LoopBlob) {
  const noticeIndex = (blob.noticeIndex + 1) % NOTICE_PAGES.length;
  const noticeFlips = Math.min(NOTICE_CAP, blob.noticeFlips + 1);
  return { blob: { ...blob, noticeIndex, noticeFlips }, line: NOTICE_PAGES[noticeIndex] };
}

export function peekCoop(blob: LoopBlob, ymd: string, salt: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.coopDay === ymd && blob.coopIndex !== null) {
    return { blob, line: `鸡舍今天看过了。${dayNote(COOP_PEEKS, blob.coopIndex)}` };
  }
  const coopIndex = Math.abs(salt) % COOP_PEEKS.length;
  return { blob: { ...blob, coopDay: ymd, coopIndex }, line: COOP_PEEKS[coopIndex] };
}

export function clickGate(blob: LoopBlob) {
  const gateOpen = !blob.gateOpen;
  const gateClicks = Math.min(GATE_CAP, blob.gateClicks + 1);
  return {
    blob: { ...blob, gateOpen, gateClicks },
    line: gateOpen ? "篱笆门开了一条缝。" : "篱笆门又扣上了。",
  };
}

export function restPicnic(blob: LoopBlob, ymd: string) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.picnicDown) return { blob: { ...blob, picnicDown: false }, line: "从野餐垫上坐起来了。" };
  return {
    blob: { ...blob, picnicDown: true, picnicDay: ymd, picnicRests: Math.min(PICNIC_CAP, blob.picnicRests + 1) },
    line: "在野餐垫上歇了一会儿。",
  };
}

export function applyLoop(view: LoopView, id: LoopId, ctx: LoopContext): { view: LoopView; line: string } {
  switch (id) {
    case "mailbox": {
      const result = checkMailbox(view.blob, ctx.ymd, ctx.salt);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "scarecrow": {
      const result = tipScarecrow(view.blob);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "well": {
      const result = wishAtWell(view.blob, ctx.ymd, ctx.salt);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "crop": {
      const result = peekCrop(view.blob, ctx.ymd, ctx.cropTier);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "pebble": {
      const result = collectPebble(view.pebbles);
      return { view: { blob: view.blob, pebbles: result.count }, line: result.line };
    }
    case "lantern": {
      const result = toggleLantern(view.blob);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "notice": {
      const result = flipNotice(view.blob);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "coop": {
      const result = peekCoop(view.blob, ctx.ymd, ctx.salt);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "gate": {
      const result = clickGate(view.blob);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    case "picnic": {
      const result = restPicnic(view.blob, ctx.ymd);
      return { view: { blob: result.blob, pebbles: view.pebbles }, line: result.line };
    }
    default: {
      const unreachable: never = id;
      void unreachable;
      return { view, line: "这处小玩还没铺好。" };
    }
  }
}

export function loopTally(blob: LoopBlob, pebbles: number, ymd: string) {
  const flags = [
    blob.mailDay === ymd && blob.mailIndex !== null,
    blob.scareTips > 0,
    blob.wishDay === ymd && blob.wishIndex !== null,
    blob.cropDay === ymd && blob.cropIndex !== null,
    pebbles > 0,
    blob.lanternGlow,
    blob.noticeFlips > 0,
    blob.coopDay === ymd && blob.coopIndex !== null,
    blob.gateClicks > 0,
    blob.picnicRests > 0,
  ];
  return { done: flags.filter(Boolean).length, total: LOOP_IDS.length };
}

export function tallyLine(done: number, total: number) {
  return `已碰过 ${done}/${total}。换一个人就换一套。`;
}

export type LoopSpot = {
  id: LoopId;
  label: string;
  status: string;
  pressed: boolean;
  glow: GlowMode;
  lean: Lean;
  open: boolean;
  count: number;
  scope: "viewer" | "session";
};

export function loopSpot(id: LoopId, blob: LoopBlob, pebbles: number, ymd: string, reduced: boolean): LoopSpot {
  const spot: LoopSpot = {
    id,
    label: LOOP_LABELS[id],
    status: "未碰",
    pressed: false,
    glow: "off",
    lean: "none",
    open: false,
    count: 0,
    scope: id === "pebble" ? "session" : "viewer",
  };
  switch (id) {
    case "mailbox": {
      const seen = blob.mailDay === ymd && blob.mailIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? 1 : 0;
      spot.status = seen ? "看过" : "未看";
      break;
    }
    case "scarecrow": {
      spot.count = blob.scareTips;
      spot.pressed = blob.scareTips > 0;
      spot.lean = scareLean(blob.scareTips);
      spot.status = blob.scareTips > 0 ? `歪过 ${blob.scareTips}` : "正着";
      break;
    }
    case "well": {
      const seen = blob.wishDay === ymd && blob.wishIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? 1 : 0;
      spot.status = seen ? "许过" : "未许";
      break;
    }
    case "crop": {
      const seen = blob.cropDay === ymd && blob.cropIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? (blob.cropIndex ?? 0) + 1 : 0;
      spot.status = seen ? "看过" : "未看";
      break;
    }
    case "pebble": {
      spot.count = pebbles;
      spot.pressed = pebbles > 0;
      spot.status = `${pebbles}/${PEBBLE_CAP}`;
      break;
    }
    case "lantern": {
      spot.glow = lanternGlow(blob.lanternGlow, reduced);
      spot.pressed = blob.lanternGlow;
      spot.count = blob.lanternGlow ? 1 : 0;
      spot.status = spot.glow === "off" ? "灭" : spot.glow === "still" ? "静光" : "亮着";
      break;
    }
    case "notice": {
      spot.count = blob.noticeFlips;
      spot.pressed = blob.noticeFlips > 0;
      spot.status = blob.noticeFlips > 0 ? `第 ${blob.noticeIndex + 1} 页` : "封面";
      break;
    }
    case "coop": {
      const seen = blob.coopDay === ymd && blob.coopIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? 1 : 0;
      spot.status = seen ? "看过" : "未看";
      break;
    }
    case "gate": {
      spot.open = blob.gateOpen;
      spot.pressed = blob.gateOpen;
      spot.count = blob.gateClicks;
      spot.status = blob.gateOpen ? "开着" : "关着";
      break;
    }
    case "picnic": {
      spot.pressed = blob.picnicDown;
      spot.count = blob.picnicRests;
      spot.open = blob.picnicDown;
      spot.status = blob.picnicDown ? "歇着" : blob.picnicRests > 0 ? `歇过 ${blob.picnicRests}` : "空着";
      break;
    }
    default:
      break;
  }
  return spot;
}

export function publicLoopLines() {
  const ymd = "2026-09-30";
  const salt = loopSalt("林小满", ymd);
  let blob = emptyLoops();
  const lines: string[] = [
    ...MAIL_NOTES,
    ...SCARECROW_TIPS,
    ...WELL_WISHES,
    ...CROP_PEEKS,
    ...NOTICE_PAGES,
    ...COOP_PEEKS,
    ...Object.values(LOOP_LABELS),
    LOCKED_LINE,
    LOOP_INTRO,
    LOOP_IDLE,
    tallyLine(0, LOOP_IDS.length),
    tallyLine(10, LOOP_IDS.length),
  ];
  const steps: LoopId[] = [...LOOP_IDS, "mailbox", "well", "crop", "coop", "pebble", "lantern", "picnic", "gate"];
  let pebbles = 0;
  for (const id of steps) {
    const result = applyLoop({ blob, pebbles }, id, { ymd, salt, cropTier: 2 });
    blob = result.view.blob;
    pebbles = result.view.pebbles;
    lines.push(result.line);
  }
  for (const id of LOOP_IDS) {
    lines.push(loopSpot(id, blob, pebbles, ymd, false).status);
    lines.push(loopSpot(id, blob, pebbles, ymd, true).status);
  }
  lines.push(tipScarecrow({ ...emptyLoops(), scareTips: SCARE_CAP }).line);
  lines.push(collectPebble(PEBBLE_CAP).line);
  return lines;
}
