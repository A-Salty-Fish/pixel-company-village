import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "./wave-d";
import { DEFAULT_COMFORT } from "./village-life";
import {
  CROP_PEEKS,
  EMPTY_LOOPS,
  GATE_CAP,
  LOOP_FIELDS,
  LOOP_IDS,
  MAIL_NOTES,
  NOTICE_PAGES,
  PEBBLE_CAP,
  PICNIC_CAP,
  SCARE_CAP,
  applyLoop,
  checkMailbox,
  clickGate,
  collectPebble,
  emptyLoops,
  flipNotice,
  lanternGlow,
  loopSalt,
  loopSpot,
  loopStorageKey,
  loopTally,
  parsePebbles,
  pebbleStorageKey,
  peekCrop,
  publicLoopLines,
  restPicnic,
  sanitizeLoops,
  scareLean,
  tallyLine,
  tipScarecrow,
  toggleLantern,
  wishAtWell,
  type LoopBlob,
} from "./village-loops";

const YMD = "2026-09-30";

function view(blob: LoopBlob = emptyLoops(), pebbles = 0) {
  return { blob, pebbles };
}

function ctx(viewer: string, tier = 0) {
  return { ymd: YMD, salt: loopSalt(viewer, YMD), cropTier: tier };
}

test("ten loops stay on an allowlist of counts and dates", () => {
  assert.equal(LOOP_IDS.length, 10);
  const dirty = sanitizeLoops({
    mailDay: "聊天原文",
    mailIndex: 99,
    scareTips: 500,
    wishDay: "not-a-day",
    wishIndex: 1.5,
    cropIndex: -1,
    lanternGlow: "yes",
    noticeIndex: 80,
    noticeFlips: 90,
    gateClicks: 100,
    picnicRests: 80,
    picnicDown: 1,
    chat: "PRIVACY_PROBE_CHAT_ALPHA",
    letter: "他说了好多话",
  });
  assert.deepEqual(Object.keys(dirty), [...LOOP_FIELDS]);
  assert.equal(dirty.mailDay, null);
  assert.equal(dirty.mailIndex, null);
  assert.equal(dirty.scareTips, SCARE_CAP);
  assert.equal(dirty.wishIndex, null);
  assert.equal(dirty.lanternGlow, false);
  assert.equal(dirty.noticeIndex, 0);
  assert.equal(dirty.noticeFlips, 48);
  assert.equal(dirty.gateClicks, GATE_CAP);
  assert.equal(dirty.picnicRests, PICNIC_CAP);
  assert.equal(dirty.picnicDown, false);
  assert.equal(JSON.stringify(dirty).includes("PRIVACY_PROBE_CHAT_ALPHA"), false);
  assert.equal(JSON.stringify(dirty).includes("他说"), false);
  assert.equal(JSON.stringify(dirty).includes("pebble"), false);
});

test("two viewers do not share loop or pebble keys", () => {
  assert.notEqual(loopStorageKey("林小满"), loopStorageKey("周晚风"));
  assert.notEqual(pebbleStorageKey("林小满"), pebbleStorageKey("周晚风"));
  assert.notEqual(loopStorageKey("林小满"), pebbleStorageKey("林小满"));
  assert.match(loopStorageKey("林小满"), /^village:viewer:林小满:loops-r8$/);
  assert.match(pebbleStorageKey("林小满"), /^village:viewer:林小满:pebbles-r8$/);
  assert.notEqual(loopSalt("林小满", YMD), loopSalt("周晚风", YMD));
});

test("mailbox, well, crop, and coop are once per day and keep an index", () => {
  const salt = loopSalt("林小满", YMD);
  const mail = checkMailbox(emptyLoops(), YMD, salt);
  assert.equal(mail.blob.mailIndex !== null && mail.blob.mailIndex < MAIL_NOTES.length, true);
  const again = checkMailbox(mail.blob, YMD, salt + 9);
  assert.equal(again.blob, mail.blob);
  assert.match(again.line, /今天看过了/);
  const nextDay = checkMailbox(mail.blob, "2026-10-01", salt);
  assert.equal(nextDay.blob.mailDay, "2026-10-01");
  const wish = wishAtWell(emptyLoops(), YMD, salt);
  assert.equal(wishAtWell(wish.blob, YMD, salt).blob, wish.blob);
  const crop = peekCrop(emptyLoops(), YMD, 2);
  assert.equal(crop.blob.cropIndex, 2);
  assert.equal(crop.line, CROP_PEEKS[2]);
  assert.equal(peekCrop(crop.blob, YMD, 0).blob, crop.blob);
  assert.equal(peekCrop(emptyLoops(), YMD, 99).blob.cropIndex, CROP_PEEKS.length - 1);
  assert.equal(peekCrop(emptyLoops(), YMD, Number.NaN).blob.cropIndex, 0);
  const coop = applyLoop(view(), "coop", ctx("林小满"));
  assert.equal(applyLoop(coop.view, "coop", ctx("周晚风")).view.blob, coop.view.blob);
  const badDay = checkMailbox(emptyLoops(), "today", salt);
  assert.equal(badDay.blob.mailDay, null);
  assert.match(badDay.line, /日期/);
});

test("scarecrow, notice, gate, and picnic keep identity progress", () => {
  let blob = emptyLoops();
  blob = tipScarecrow(blob).blob;
  assert.equal(blob.scareTips, 1);
  assert.equal(scareLean(1), "left");
  blob = tipScarecrow(blob).blob;
  assert.equal(scareLean(blob.scareTips), "right");
  assert.equal(tipScarecrow({ ...emptyLoops(), scareTips: SCARE_CAP }).blob.scareTips, SCARE_CAP);
  blob = flipNotice(blob).blob;
  assert.equal(blob.noticeFlips, 1);
  assert.equal(blob.noticeIndex, 1);
  for (let i = 0; i < NOTICE_PAGES.length + 2; i += 1) blob = flipNotice(blob).blob;
  assert.equal(blob.noticeIndex < NOTICE_PAGES.length, true);
  blob = clickGate(blob).blob;
  assert.equal(blob.gateOpen, true);
  assert.equal(blob.gateClicks, 1);
  blob = clickGate(blob).blob;
  assert.equal(blob.gateOpen, false);
  assert.equal(blob.gateClicks, 2);
  const capped = clickGate({ ...emptyLoops(), gateClicks: GATE_CAP, gateOpen: false });
  assert.equal(capped.blob.gateClicks, GATE_CAP);
  assert.equal(capped.blob.gateOpen, true);
  blob = restPicnic(blob, YMD).blob;
  assert.equal(blob.picnicDown, true);
  assert.equal(blob.picnicRests, 1);
  blob = restPicnic(blob, YMD).blob;
  assert.equal(blob.picnicDown, false);
  assert.equal(blob.picnicRests, 1);
  const full = restPicnic({ ...emptyLoops(), picnicRests: PICNIC_CAP }, YMD);
  assert.equal(full.blob.picnicRests, PICNIC_CAP);
});

test("pebbles stay a session count and never enter the yard blob", () => {
  assert.equal(parsePebbles("PRIVACY_PROBE_CHAT_ALPHA"), 0);
  assert.equal(parsePebbles("2"), 2);
  assert.equal(parsePebbles(9), PEBBLE_CAP);
  const first = collectPebble(0);
  assert.equal(first.count, 1);
  let count = 0;
  for (let i = 0; i < 8; i += 1) count = collectPebble(count).count;
  assert.equal(count, PEBBLE_CAP);
  const played = applyLoop(view(EMPTY_LOOPS, 4), "pebble", ctx("林小满"));
  assert.equal(played.view.blob, EMPTY_LOOPS);
  assert.equal(played.view.pebbles, 5);
  assert.equal(JSON.stringify(played.view.blob).includes("石子"), false);
});

test("lantern glow is a local pref and stays still when motion is reduced", () => {
  const on = toggleLantern(emptyLoops());
  assert.equal(on.blob.lanternGlow, true);
  const off = toggleLantern(on.blob);
  assert.equal(off.blob.lanternGlow, false);
  assert.equal(lanternGlow(false, false), "off");
  assert.equal(lanternGlow(true, false), "pulse");
  assert.equal(lanternGlow(true, true), "still");
  const spot = loopSpot("lantern", on.blob, 0, YMD, true);
  assert.equal(spot.glow, "still");
  assert.equal(spot.status, "静光");
  assert.equal(loopSpot("lantern", on.blob, 0, YMD, false).glow, "pulse");
});

test("applying a loop to one viewer leaves the other blob alone", () => {
  const mine = applyLoop(view(), "mailbox", ctx("林小满"));
  const other = view();
  assert.equal(other.blob.mailDay, null);
  assert.notEqual(mine.view.blob, other.blob);
  const tallyMine = loopTally(mine.view.blob, mine.view.pebbles, YMD);
  const tallyOther = loopTally(other.blob, other.pebbles, YMD);
  assert.equal(tallyMine.done, 1);
  assert.equal(tallyOther.done, 0);
  assert.match(tallyLine(tallyMine.done, tallyMine.total), /1\/10/);
});

test("round 8 copy stays canned and quiet village stays the default", () => {
  assert.equal(copyIsClean(publicLoopLines()), true);
  assert.equal(DEFAULT_COMFORT.quiet, true);
  const spots = LOOP_IDS.map((id) => loopSpot(id, emptyLoops(), 0, YMD, false));
  assert.equal(spots.every((spot) => spot.scope === "viewer" || spot.id === "pebble"), true);
  assert.equal(spots.find((spot) => spot.id === "pebble")?.scope, "session");
});
