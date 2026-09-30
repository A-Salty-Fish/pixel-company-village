import assert from "node:assert/strict";
import test from "node:test";
import { interactionLabel, scoreDateCopy, waveHint } from "./copy";
import { comfortFromStorage, DEFAULT_COMFORT } from "./village-life";
import { signalTag } from "./interactions";
import { deriveLoadStage } from "./load-machine";
import {
  broadcastFor,
  canSecretFeed,
  capParticles,
  cropTier,
  dominantAxis,
  familiarityLevel,
  forgetAnonFeed,
  markAnonFeed,
  morningBellDue,
  museumShelves,
  noteKindness,
  sanitizePlay,
  touchDaily,
  unlockQuote,
  unlockSticker,
  spendFreeze,
  visitCalendar,
  EMPTY_PLAY,
} from "./play-systems";
import { commitKindness, undoKindness, type ClockStamp } from "./quota-rules";

const clock: ClockStamp = { ymd: "2026-09-22", weekKey: "2026-W39", sunday: false };

test("a fresh comfort profile keeps quiet village on", () => {
  assert.equal(DEFAULT_COMFORT.quiet, true);
  assert.equal(comfortFromStorage(null).quiet, true);
  assert.equal(comfortFromStorage("").quiet, true);
  assert.equal(comfortFromStorage("{}").quiet, true);
  assert.equal(comfortFromStorage("not-json").quiet, true);
  assert.equal(comfortFromStorage('{"hideScores":true}').quiet, true);
  assert.equal(comfortFromStorage('{"quiet":false}').quiet, false);
});

test("stale score days call the local action by a local name", () => {
  assert.equal(interactionLabel(true), "今日互动");
  assert.equal(interactionLabel(false), "本地互动");
});

test("kindness undo restores the daily and weekly quota", () => {
  const first = commitKindness(undefined, clock);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const undone = undoKindness(first.entry, clock);
  assert.ok(undone);
  assert.equal(undone?.days.includes(clock.ymd), false);
  assert.equal(undone?.weekCounts[clock.weekKey], 0);
  const again = commitKindness(undone ?? undefined, clock);
  assert.equal(again.ok, true);
});

test("visit calendar counts five kind days inside seven", () => {
  let blob = { ...EMPTY_PLAY, visitOpen: [] as string[], visitKind: [] as string[] };
  for (const day of ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"]) {
    blob = touchDaily(blob, day, null);
    blob = noteKindness(blob, day);
  }
  const met = visitCalendar(blob, "2026-09-29");
  assert.equal(met.filled, 5);
  assert.equal(met.met, true);
  const short = visitCalendar(noteKindness(touchDaily(EMPTY_PLAY, "2026-09-29", null), "2026-09-29"), "2026-09-29");
  assert.equal(short.met, false);
});

test("a festival freeze fills a private gap", () => {
  let blob = touchDaily(EMPTY_PLAY, "2026-02-04", "立春");
  assert.equal(blob.freezeTokens, 1);
  blob = noteKindness(blob, "2026-02-04");
  const filled = spendFreeze(blob, "2026-02-04");
  assert.equal(filled.freezeTokens, 0);
  assert.equal(visitCalendar(filled, "2026-02-04").filled > visitCalendar(blob, "2026-02-04").filled, true);
});

test("museum shelves unlock on counts only", () => {
  const small = museumShelves(9);
  assert.equal(small.find((shelf) => shelf.id === "ten")?.unlocked, false);
  const ten = museumShelves(10);
  assert.equal(ten.find((shelf) => shelf.id === "ten")?.unlocked, true);
  assert.equal(JSON.stringify(ten).includes("排名"), false);
});

test("human tags do not imply chat", () => {
  const tags = new Set<string>();
  for (let work = 0; work <= 3; work += 0.3) {
    for (let fish = 0; fish <= 3; fish += 0.3) {
      for (const task of [0, 0.4, 0.68, 0.9]) tags.add(signalTag(work, fish, task));
    }
  }
  for (const tag of tags) {
    assert.equal(tag.includes("聊"), false);
    assert.equal(["高产专注", "湖边放空", "混合节奏", "张弛有度", "田边发呆"].includes(tag), true);
  }
});

test("data date copy refuses to call a stale day today", () => {
  const stale = scoreDateCopy("2026-09-24", "2026-09-29");
  assert.equal(stale.fresh, false);
  assert.equal(stale.headline, "分数来自2026-09-24 · 村里仍是此刻");
  assert.match(stale.detail, /2026-09-29/);
  const fresh = scoreDateCopy("2026-09-29", "2026-09-29");
  assert.equal(fresh.fresh, true);
  assert.match(fresh.detail, /同一天/);
  assert.equal(fresh.refresh, "刷新今日分数");
  assert.equal(stale.refresh, "刷新评分日");
  assert.equal(stale.refresh.includes("今日"), false);
  assert.equal(stale.detail.includes("今日"), false);
  assert.match(stale.detail, /分数仍停在评分日/);
});

test("familiarity stays a private step function", () => {
  assert.deepEqual([0, 1, 2, 3].map((days) => familiarityLevel(days === 0 ? 0 : days === 1 ? 1 : days === 2 ? 3 : 6)), [0, 1, 2, 3]);
});

test("load stages time out before a blank map can sit forever", () => {
  assert.equal(deriveLoadStage({ elapsedMs: 10, artReady: false, rosterCount: 0, failed: false }), "terrain");
  assert.equal(deriveLoadStage({ elapsedMs: 700, artReady: false, rosterCount: 12, failed: false }), "roster");
  assert.equal(deriveLoadStage({ elapsedMs: 1600, artReady: false, rosterCount: 12, failed: false }), "villagers");
  assert.equal(deriveLoadStage({ elapsedMs: 9000, artReady: false, rosterCount: 12, failed: false }), "timeout");
  assert.equal(deriveLoadStage({ elapsedMs: 9000, artReady: true, rosterCount: 12, failed: false }), "ready");
});

test("particles stay inside the budget", () => {
  assert.equal(capParticles(40), 8);
  assert.equal(capParticles(3), 3);
});

test("anonymous feed stores the target and not an actor", () => {
  assert.equal(canSecretFeed([], "2026-09-29"), true);
  const feed = markAnonFeed({}, "2026-09-29", "林小满");
  assert.deepEqual(feed["2026-09-29"], ["林小满"]);
  assert.equal(JSON.stringify(feed).includes("actor"), false);
  assert.deepEqual(forgetAnonFeed(feed, "2026-09-29", "林小满")["2026-09-29"], []);
});

test("quotes, stickers, crops, and club flags stay canned", () => {
  const quoted = unlockQuote(EMPTY_PLAY, 1, 10);
  assert.deepEqual(quoted.quotes, [1]);
  const sticker = unlockSticker(EMPTY_PLAY, "2026-09-29", 2);
  assert.equal(sticker.ok, true);
  const again = unlockSticker(sticker.blob, "2026-09-29", 2);
  assert.equal(again.ok, false);
  assert.equal(cropTier(1), 0);
  assert.equal(cropTier(2), 1);
  assert.equal(cropTier(6), 2);
  assert.equal(cropTier(12), 3);
  assert.equal(dominantAxis([{ work: 3, fish: 0, on_task: 0.1 }]), "work");
  assert.equal(dominantAxis([]), null);
});

test("quiet mode suppresses the hourly broadcast and the morning bell", () => {
  assert.equal(broadcastFor(9, true, true), null);
  assert.match(broadcastFor(12, false, true)?.line ?? "", /午间/);
  assert.equal(morningBellDue({ ymd: "2026-09-28", hour: 9, workday: true }, null, true), true);
  assert.equal(morningBellDue({ ymd: "2026-09-27", hour: 9, workday: false }, null, true), false);
  assert.equal(morningBellDue({ ymd: "2026-09-28", hour: 9, workday: true }, "2026-09-28", true), false);
});

test("wave hint names identity before it names the cooldown", () => {
  assert.match(waveHint({ hasIdentity: false, allowed: false, retryAfterMin: 0 }), /我是谁/);
  assert.match(waveHint({ hasIdentity: true, allowed: true, retryAfterMin: 0 }), /还可挥 1 次/);
});

test("sanitized play blobs drop unexpected shapes", () => {
  const clean = sanitizePlay({ prop: "nope", garden2: { 林小满: "flower", bad: "chat" }, visitOpen: ["2026-09-29", 3] });
  assert.equal(clean.prop, null);
  assert.deepEqual(clean.garden2, { 林小满: "flower" });
  assert.deepEqual(clean.visitOpen, ["2026-09-29"]);
});
