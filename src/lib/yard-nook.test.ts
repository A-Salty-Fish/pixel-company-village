import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "./wave-d";
import { DEFAULT_COMFORT } from "./village-life";
import {
  CAT_NOTES,
  EMPTY_NOOK,
  NOOK_FIELDS,
  NOOK_IDS,
  POT_CAP,
  SIGN_PAGES,
  SKIP_CAP,
  WOOD_CAP,
  applyNook,
  checkKettle,
  daypartIndex,
  dipBarrel,
  emptyNook,
  emptySession,
  laundrySway,
  nookSalt,
  nookSessionKey,
  nookSpot,
  nookStorageKey,
  nookTally,
  pauseBridge,
  peekCat,
  publicNookLines,
  sanitizeNook,
  sanitizeSession,
  shutterSwing,
  skipPond,
  stackWood,
  tapPot,
  toggleLaundry,
  toggleShutter,
  turnSign,
} from "./yard-nook";

const YMD = "2026-09-30";

function view() {
  return { blob: emptyNook(), session: emptySession() };
}

test("yard edge storage keeps counts and drops planted text", () => {
  assert.equal(NOOK_IDS.length, 10);
  const dirty = sanitizeNook({
    kettleDay: "聊天原文",
    kettleIndex: 9,
    woodLogs: 40,
    laundryPin: "yes",
    bridgeStops: 90,
    catIndex: 1.2,
    signTurns: 80,
    shutterClicks: 99,
    chat: "PRIVACY_PROBE_CHAT_ALPHA",
    note: "他说了好多话",
  });
  assert.deepEqual(Object.keys(dirty), [...NOOK_FIELDS]);
  assert.equal(dirty.kettleDay, null);
  assert.equal(dirty.woodLogs, WOOD_CAP);
  assert.equal(dirty.laundryPin, false);
  assert.equal(dirty.shutterClicks <= 48, true);
  assert.equal(JSON.stringify(dirty).includes("PRIVACY_PROBE_CHAT_ALPHA"), false);
  assert.equal(JSON.stringify(dirty).includes("他说"), false);
  assert.equal(JSON.stringify(dirty).includes("skips"), false);
  const session = sanitizeSession({ skips: 9, pots: "3", chat: "PRIVACY_PROBE_CHAT_ALPHA" });
  assert.equal(session.skips, SKIP_CAP);
  assert.equal(session.pots, 0);
  assert.equal(sanitizeSession("PRIVACY_PROBE_CHAT_ALPHA").skips, 0);
});

test("two viewers do not share nook keys", () => {
  assert.notEqual(nookStorageKey("林小满"), nookStorageKey("周晚风"));
  assert.notEqual(nookSessionKey("林小满"), nookSessionKey("周晚风"));
  assert.notEqual(nookStorageKey("林小满"), nookSessionKey("林小满"));
  assert.notEqual(nookSalt("林小满", YMD), nookSalt("周晚风", YMD));
});

test("kettle, barrel, and cat are once per day", () => {
  const salt = nookSalt("林小满", YMD);
  const kettle = checkKettle(emptyNook(), YMD, salt);
  assert.equal(checkKettle(kettle.blob, YMD, salt + 3).blob, kettle.blob);
  const barrel = dipBarrel(emptyNook(), YMD, salt);
  assert.match(dipBarrel(barrel.blob, YMD, salt).line, /舀过了/);
  const morning = peekCat(emptyNook(), YMD, 8);
  assert.equal(morning.blob.catIndex, 0);
  assert.equal(morning.line, CAT_NOTES[0]);
  const later = peekCat(morning.blob, YMD, 20);
  assert.equal(later.blob, morning.blob);
  assert.equal(daypartIndex(12), 1);
  assert.equal(daypartIndex(18), 2);
  assert.equal(daypartIndex(Number.NaN), 0);
  assert.equal(peekCat(emptyNook(), "nope", 8).blob.catDay, null);
});

test("wood, sign, bridge, laundry, and shutter keep viewer progress", () => {
  let blob = emptyNook();
  blob = stackWood(blob).blob;
  assert.equal(blob.woodLogs, 1);
  assert.equal(stackWood({ ...emptyNook(), woodLogs: WOOD_CAP }).blob.woodLogs, WOOD_CAP);
  blob = turnSign(blob).blob;
  assert.equal(blob.signTurns, 1);
  assert.equal(blob.signIndex, 1);
  for (let i = 0; i < SIGN_PAGES.length + 1; i += 1) blob = turnSign(blob).blob;
  assert.equal(blob.signIndex < SIGN_PAGES.length, true);
  blob = pauseBridge(blob).blob;
  assert.equal(blob.bridgeDown, true);
  assert.equal(blob.bridgeStops, 1);
  blob = pauseBridge(blob).blob;
  assert.equal(blob.bridgeDown, false);
  assert.equal(blob.bridgeStops, 1);
  blob = toggleLaundry(blob).blob;
  assert.equal(blob.laundryPin, true);
  assert.equal(laundrySway(true, false), "sway");
  assert.equal(laundrySway(true, true), "still");
  assert.equal(laundrySway(false, false), "off");
  blob = toggleShutter(blob).blob;
  assert.equal(blob.shutterOpen, true);
  assert.equal(blob.shutterClicks, 1);
  assert.equal(shutterSwing(true, false), "swing");
  assert.equal(shutterSwing(true, true), "still");
  assert.equal(shutterSwing(false, false), "off");
  const still = nookSpot("laundry", blob, emptySession(), YMD, true);
  assert.equal(still.sway, "still");
  assert.equal(still.status, "别住");
  assert.equal(nookSpot("shutter", blob, emptySession(), YMD, true).swing, "still");
});

test("pond skips and flower pots stay in the session bag", () => {
  let session = emptySession();
  session = skipPond(session).session;
  session = tapPot(session).session;
  assert.deepEqual(session, { skips: 1, pots: 1 });
  let skips = 0;
  let pots = 0;
  for (let i = 0; i < 8; i += 1) {
    skips = skipPond({ skips, pots }).session.skips;
    pots = tapPot({ skips, pots }).session.pots;
  }
  assert.equal(skips, SKIP_CAP);
  assert.equal(pots, POT_CAP);
  const played = applyNook({ blob: EMPTY_NOOK, session: { skips: 1, pots: 0 } }, "pond", {
    ymd: YMD,
    salt: 1,
    hour: 9,
  });
  assert.equal(played.view.blob, EMPTY_NOOK);
  assert.equal(played.view.session.skips, 2);
  assert.equal(JSON.stringify(played.view.blob).includes("skips"), false);
});

test("one viewer's nook does not leak into another blob", () => {
  const mine = applyNook(view(), "kettle", { ymd: YMD, salt: nookSalt("林小满", YMD), hour: 9 });
  const other = view();
  assert.equal(other.blob.kettleDay, null);
  assert.equal(nookTally(mine.view.blob, mine.view.session, YMD).done, 1);
  assert.equal(nookTally(other.blob, other.session, YMD).done, 0);
});

test("round 9 copy stays canned and quiet village stays the default", () => {
  assert.equal(copyIsClean(publicNookLines()), true);
  assert.equal(DEFAULT_COMFORT.quiet, true);
  const spots = NOOK_IDS.map((id) => nookSpot(id, emptyNook(), emptySession(), YMD, false));
  assert.equal(spots.filter((spot) => spot.scope === "session").map((spot) => spot.id).join(","), "pond,pot");
});
