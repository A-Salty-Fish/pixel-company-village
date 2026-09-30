/**
 * Round 9 yard-edge loops. Viewer-local canned copy.
 * Pond skips and flower-pot taps stay in the tab session.
 * No chat text, no server store.
 */

export const SKIP_CAP = 4;
export const POT_CAP = 3;
export const WOOD_CAP = 6;
export const SIGN_CAP = 48;
export const BRIDGE_CAP = 30;
export const SHUTTER_CAP = 48;

export const NOOK_IDS = [
  "kettle",
  "pond",
  "wood",
  "laundry",
  "bridge",
  "cat",
  "barrel",
  "sign",
  "pot",
  "shutter",
] as const;

export type NookId = (typeof NOOK_IDS)[number];

export const NOOK_LABELS: Record<NookId, string> = {
  kettle: "灶边水壶",
  pond: "池塘水漂",
  wood: "柴堆",
  laundry: "晾衣绳",
  bridge: "石桥",
  cat: "墙根猫",
  barrel: "雨水桶",
  sign: "路口牌",
  pot: "窗台花盆",
  shutter: "窗板",
};

export const KETTLE_NOTES = [
  "壶嘴吐了一小缕白气。",
  "水还温，盖子扣着。",
  "壶底的火很小，不着急。",
] as const;

export const BARREL_NOTES = [
  "桶里的水只够浇一棵苗。",
  "雨水桶映着一块天。",
  "舀了一下，水面又平了。",
] as const;

export const CAT_NOTES = [
  "猫在墙根晒上午的光。",
  "猫在午后眯着眼。",
  "猫傍晚缩成一团。",
] as const;

export const SIGN_PAGES = [
  "路口牌指向湖边。",
  "路口牌指向田埂。",
  "路口牌指向屋檐。",
  "路口牌又转回原处。",
] as const;

export const NOOK_LOCKED = "先选定「我是谁」，屋边的小事才记在这台电脑上。";
export const NOOK_INTRO =
  "屋边十处记在当前的「我是谁」上。水漂和花盆只留这个标签页。减少动作时衣绳和窗板不再晃。不记说过的话。";
export const NOOK_IDLE = "点一处屋边的东西。";

export type SwayMode = "off" | "still" | "sway";
export type SwingMode = "off" | "still" | "swing";

export type NookBlob = {
  kettleDay: string | null;
  kettleIndex: number | null;
  woodLogs: number;
  laundryPin: boolean;
  bridgeDown: boolean;
  bridgeStops: number;
  catDay: string | null;
  catIndex: number | null;
  barrelDay: string | null;
  barrelIndex: number | null;
  signIndex: number;
  signTurns: number;
  shutterOpen: boolean;
  shutterClicks: number;
};

export type NookSession = {
  skips: number;
  pots: number;
};

export const NOOK_FIELDS = [
  "kettleDay",
  "kettleIndex",
  "woodLogs",
  "laundryPin",
  "bridgeDown",
  "bridgeStops",
  "catDay",
  "catIndex",
  "barrelDay",
  "barrelIndex",
  "signIndex",
  "signTurns",
  "shutterOpen",
  "shutterClicks",
] as const;

export const EMPTY_NOOK: NookBlob = {
  kettleDay: null,
  kettleIndex: null,
  woodLogs: 0,
  laundryPin: false,
  bridgeDown: false,
  bridgeStops: 0,
  catDay: null,
  catIndex: null,
  barrelDay: null,
  barrelIndex: null,
  signIndex: 0,
  signTurns: 0,
  shutterOpen: false,
  shutterClicks: 0,
};

export const EMPTY_SESSION: NookSession = { skips: 0, pots: 0 };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function emptyNook(): NookBlob {
  return { ...EMPTY_NOOK };
}

export function emptySession(): NookSession {
  return { ...EMPTY_SESSION };
}

export function nookStorageKey(viewer: string) {
  return `village:viewer:${viewer}:nook-r9`;
}

export function nookSessionKey(viewer: string) {
  return `village:viewer:${viewer}:nook-session-r9`;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function nookSalt(viewer: string, ymd: string) {
  return hash(`${viewer}:${ymd}:nook`);
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

export function sanitizeNook(value: unknown): NookBlob {
  if (!value || typeof value !== "object") return emptyNook();
  const raw = value as Partial<NookBlob>;
  const signIndex = readIndex(raw.signIndex, SIGN_PAGES.length);
  return {
    kettleDay: readDay(raw.kettleDay),
    kettleIndex: readIndex(raw.kettleIndex, KETTLE_NOTES.length),
    woodLogs: clampInt(typeof raw.woodLogs === "number" ? raw.woodLogs : 0, WOOD_CAP),
    laundryPin: raw.laundryPin === true,
    bridgeDown: raw.bridgeDown === true,
    bridgeStops: clampInt(typeof raw.bridgeStops === "number" ? raw.bridgeStops : 0, BRIDGE_CAP),
    catDay: readDay(raw.catDay),
    catIndex: readIndex(raw.catIndex, CAT_NOTES.length),
    barrelDay: readDay(raw.barrelDay),
    barrelIndex: readIndex(raw.barrelIndex, BARREL_NOTES.length),
    signIndex: signIndex ?? 0,
    signTurns: clampInt(typeof raw.signTurns === "number" ? raw.signTurns : 0, SIGN_CAP),
    shutterOpen: raw.shutterOpen === true,
    shutterClicks: clampInt(typeof raw.shutterClicks === "number" ? raw.shutterClicks : 0, SHUTTER_CAP),
  };
}

export function sanitizeSession(value: unknown): NookSession {
  if (!value || typeof value !== "object") return emptySession();
  const raw = value as Partial<NookSession>;
  return {
    skips: clampInt(typeof raw.skips === "number" ? raw.skips : 0, SKIP_CAP),
    pots: clampInt(typeof raw.pots === "number" ? raw.pots : 0, POT_CAP),
  };
}

export function daypartIndex(hour: number) {
  if (!Number.isFinite(hour)) return 0;
  const whole = Math.floor(hour);
  if (whole < 11) return 0;
  if (whole < 17) return 1;
  return 2;
}

export type NookView = { blob: NookBlob; session: NookSession };
export type NookContext = { ymd: string; salt: number; hour: number };

function dayNote(list: readonly string[], index: number | null) {
  if (index === null) return list[0];
  return list[index] ?? list[0];
}

export function checkKettle(blob: NookBlob, ymd: string, salt: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.kettleDay === ymd && blob.kettleIndex !== null) {
    return { blob, line: `壶今天看过了。${dayNote(KETTLE_NOTES, blob.kettleIndex)}` };
  }
  const kettleIndex = Math.abs(salt) % KETTLE_NOTES.length;
  return { blob: { ...blob, kettleDay: ymd, kettleIndex }, line: KETTLE_NOTES[kettleIndex] };
}

export function skipPond(session: NookSession) {
  const safe = sanitizeSession(session);
  if (safe.skips >= SKIP_CAP) return { session: safe, line: "水漂这个标签页已经跳够了。" };
  const skips = safe.skips + 1;
  return { session: { ...safe, skips }, line: `水漂跳了 ${skips} 下。这个标签页先记着。` };
}

export function stackWood(blob: NookBlob) {
  if (blob.woodLogs >= WOOD_CAP) return { blob, line: "柴已经码齐了。" };
  const woodLogs = blob.woodLogs + 1;
  return { blob: { ...blob, woodLogs }, line: `又码了一根柴。现在 ${woodLogs}/${WOOD_CAP}。` };
}

export function toggleLaundry(blob: NookBlob) {
  const laundryPin = !blob.laundryPin;
  return {
    blob: { ...blob, laundryPin },
    line: laundryPin ? "衣绳上别住了一角布。" : "布角从衣绳上取下来了。",
  };
}

export function laundrySway(pinned: boolean, reduced: boolean): SwayMode {
  if (!pinned) return "off";
  return reduced ? "still" : "sway";
}

export function pauseBridge(blob: NookBlob) {
  if (blob.bridgeDown) return { blob: { ...blob, bridgeDown: false }, line: "从石桥上继续走了。" };
  return {
    blob: { ...blob, bridgeDown: true, bridgeStops: Math.min(BRIDGE_CAP, blob.bridgeStops + 1) },
    line: "在石桥上停了一停。",
  };
}

export function peekCat(blob: NookBlob, ymd: string, hour: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.catDay === ymd && blob.catIndex !== null) {
    return { blob, line: `墙根的猫还在。${dayNote(CAT_NOTES, blob.catIndex)}` };
  }
  const catIndex = daypartIndex(hour);
  return { blob: { ...blob, catDay: ymd, catIndex }, line: CAT_NOTES[catIndex] };
}

export function dipBarrel(blob: NookBlob, ymd: string, salt: number) {
  if (!YMD.test(ymd)) return { blob, line: "今天的日期还没对准。" };
  if (blob.barrelDay === ymd && blob.barrelIndex !== null) {
    return { blob, line: `桶今天舀过了。${dayNote(BARREL_NOTES, blob.barrelIndex)}` };
  }
  const barrelIndex = Math.abs(salt) % BARREL_NOTES.length;
  return { blob: { ...blob, barrelDay: ymd, barrelIndex }, line: BARREL_NOTES[barrelIndex] };
}

export function turnSign(blob: NookBlob) {
  const signIndex = (blob.signIndex + 1) % SIGN_PAGES.length;
  const signTurns = Math.min(SIGN_CAP, blob.signTurns + 1);
  return { blob: { ...blob, signIndex, signTurns }, line: SIGN_PAGES[signIndex] };
}

export function tapPot(session: NookSession) {
  const safe = sanitizeSession(session);
  if (safe.pots >= POT_CAP) return { session: safe, line: "花盆这个标签页已经拍够了。" };
  const pots = safe.pots + 1;
  return { session: { ...safe, pots }, line: `拍了拍花盆。这个标签页 ${pots}/${POT_CAP}。` };
}

export function toggleShutter(blob: NookBlob) {
  const shutterOpen = !blob.shutterOpen;
  const shutterClicks = Math.min(SHUTTER_CAP, blob.shutterClicks + 1);
  return {
    blob: { ...blob, shutterOpen, shutterClicks },
    line: shutterOpen ? "窗板打开一条缝。" : "窗板又合上了。",
  };
}

export function shutterSwing(open: boolean, reduced: boolean): SwingMode {
  if (!open) return "off";
  return reduced ? "still" : "swing";
}

export function applyNook(view: NookView, id: NookId, ctx: NookContext): { view: NookView; line: string } {
  switch (id) {
    case "kettle": {
      const result = checkKettle(view.blob, ctx.ymd, ctx.salt);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "pond": {
      const result = skipPond(view.session);
      return { view: { blob: view.blob, session: result.session }, line: result.line };
    }
    case "wood": {
      const result = stackWood(view.blob);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "laundry": {
      const result = toggleLaundry(view.blob);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "bridge": {
      const result = pauseBridge(view.blob);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "cat": {
      const result = peekCat(view.blob, ctx.ymd, ctx.hour);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "barrel": {
      const result = dipBarrel(view.blob, ctx.ymd, ctx.salt);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "sign": {
      const result = turnSign(view.blob);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    case "pot": {
      const result = tapPot(view.session);
      return { view: { blob: view.blob, session: result.session }, line: result.line };
    }
    case "shutter": {
      const result = toggleShutter(view.blob);
      return { view: { blob: result.blob, session: view.session }, line: result.line };
    }
    default: {
      const unreachable: never = id;
      void unreachable;
      return { view, line: "这处屋边还没铺好。" };
    }
  }
}

export function nookTally(blob: NookBlob, session: NookSession, ymd: string) {
  const flags = [
    blob.kettleDay === ymd && blob.kettleIndex !== null,
    session.skips > 0,
    blob.woodLogs > 0,
    blob.laundryPin,
    blob.bridgeStops > 0,
    blob.catDay === ymd && blob.catIndex !== null,
    blob.barrelDay === ymd && blob.barrelIndex !== null,
    blob.signTurns > 0,
    session.pots > 0,
    blob.shutterClicks > 0,
  ];
  return { done: flags.filter(Boolean).length, total: NOOK_IDS.length };
}

export function nookTallyLine(done: number, total: number) {
  return `屋边已碰过 ${done}/${total}。换一个人就换一套。`;
}

export type NookSpot = {
  id: NookId;
  label: string;
  status: string;
  pressed: boolean;
  sway: SwayMode;
  swing: SwingMode;
  count: number;
  scope: "viewer" | "session";
};

export function nookSpot(id: NookId, blob: NookBlob, session: NookSession, ymd: string, reduced: boolean): NookSpot {
  const spot: NookSpot = {
    id,
    label: NOOK_LABELS[id],
    status: "未碰",
    pressed: false,
    sway: "off",
    swing: "off",
    count: 0,
    scope: id === "pond" || id === "pot" ? "session" : "viewer",
  };
  switch (id) {
    case "kettle": {
      const seen = blob.kettleDay === ymd && blob.kettleIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? 1 : 0;
      spot.status = seen ? "看过" : "未看";
      break;
    }
    case "pond": {
      spot.count = session.skips;
      spot.pressed = session.skips > 0;
      spot.status = `${session.skips}/${SKIP_CAP}`;
      break;
    }
    case "wood": {
      spot.count = blob.woodLogs;
      spot.pressed = blob.woodLogs > 0;
      spot.status = `${blob.woodLogs}/${WOOD_CAP}`;
      break;
    }
    case "laundry": {
      spot.sway = laundrySway(blob.laundryPin, reduced);
      spot.pressed = blob.laundryPin;
      spot.count = blob.laundryPin ? 1 : 0;
      spot.status = spot.sway === "off" ? "空着" : spot.sway === "still" ? "别住" : "飘着";
      break;
    }
    case "bridge": {
      spot.pressed = blob.bridgeDown;
      spot.count = blob.bridgeStops;
      spot.status = blob.bridgeDown ? "停着" : blob.bridgeStops > 0 ? `停过 ${blob.bridgeStops}` : "空着";
      break;
    }
    case "cat": {
      const seen = blob.catDay === ymd && blob.catIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? (blob.catIndex ?? 0) + 1 : 0;
      spot.status = seen ? "看过" : "未看";
      break;
    }
    case "barrel": {
      const seen = blob.barrelDay === ymd && blob.barrelIndex !== null;
      spot.pressed = seen;
      spot.count = seen ? 1 : 0;
      spot.status = seen ? "舀过" : "未舀";
      break;
    }
    case "sign": {
      spot.count = blob.signTurns;
      spot.pressed = blob.signTurns > 0;
      spot.status = blob.signTurns > 0 ? `第 ${blob.signIndex + 1} 向` : "原向";
      break;
    }
    case "pot": {
      spot.count = session.pots;
      spot.pressed = session.pots > 0;
      spot.status = `${session.pots}/${POT_CAP}`;
      break;
    }
    case "shutter": {
      spot.swing = shutterSwing(blob.shutterOpen, reduced);
      spot.pressed = blob.shutterOpen;
      spot.count = blob.shutterClicks;
      spot.status = spot.swing === "off" ? "合上" : spot.swing === "still" ? "开着" : "晃着";
      break;
    }
    default:
      break;
  }
  return spot;
}

export function publicNookLines() {
  const ymd = "2026-09-30";
  const salt = nookSalt("林小满", ymd);
  let blob = emptyNook();
  let session = emptySession();
  const lines: string[] = [
    ...KETTLE_NOTES,
    ...BARREL_NOTES,
    ...CAT_NOTES,
    ...SIGN_PAGES,
    ...Object.values(NOOK_LABELS),
    NOOK_LOCKED,
    NOOK_INTRO,
    NOOK_IDLE,
    nookTallyLine(0, NOOK_IDS.length),
    nookTallyLine(10, NOOK_IDS.length),
  ];
  const steps: NookId[] = [...NOOK_IDS, "kettle", "cat", "barrel", "pond", "pot", "laundry", "shutter", "bridge", "wood"];
  for (const id of steps) {
    const result = applyNook({ blob, session }, id, { ymd, salt, hour: 15 });
    blob = result.view.blob;
    session = result.view.session;
    lines.push(result.line);
  }
  for (const id of NOOK_IDS) {
    lines.push(nookSpot(id, blob, session, ymd, false).status);
    lines.push(nookSpot(id, blob, session, ymd, true).status);
  }
  lines.push(stackWood({ ...emptyNook(), woodLogs: WOOD_CAP }).line);
  lines.push(skipPond({ skips: SKIP_CAP, pots: 0 }).line);
  lines.push(tapPot({ skips: 0, pots: POT_CAP }).line);
  return lines;
}
