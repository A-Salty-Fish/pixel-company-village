import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  HINT_DISMISS_KEY,
  HINT_START_KEY,
  TODAY_CAN_DO_ENABLED,
  TODAY_FADE_MS,
  TODAY_HINT_MS,
  TODAY_LINES,
  clearHintClock,
  loadHintClock,
  todayHintCopy,
  todayHintDismisses,
  todayHintPhase,
  type HintStorage,
} from "@/features/today-can-do/today-can-do";

test("PV-PM-034 hint stays a corner note and leaves after a relevant action or half a minute", () => {
  assert.equal(TODAY_CAN_DO_ENABLED, true);
  assert.equal(todayHintPhase({ elapsedMs: 0, dismissed: false }), "show");
  assert.equal(todayHintPhase({ elapsedMs: TODAY_FADE_MS - 1, dismissed: false }), "show");
  assert.equal(todayHintPhase({ elapsedMs: TODAY_FADE_MS, dismissed: false }), "fade");
  assert.equal(todayHintPhase({ elapsedMs: TODAY_HINT_MS - 1, dismissed: false }), "fade");
  assert.equal(todayHintPhase({ elapsedMs: TODAY_HINT_MS, dismissed: false }), "off");
  assert.equal(todayHintPhase({ elapsedMs: 1000, dismissed: true }), "off");
  assert.equal(todayHintPhase({ elapsedMs: 1000, dismissed: false, enabled: false }), "off");
  assert.equal(todayHintPhase({ elapsedMs: Number.NaN, dismissed: false }), "off");
  assert.equal(todayHintDismisses("lamp"), true);
  assert.equal(todayHintDismisses("chore"), true);
  assert.equal(todayHintDismisses("person"), true);
  assert.equal(todayHintDismisses("other"), false);
  assert.equal(copyIsClean(todayHintCopy()), true);
  assert.equal(todayHintCopy().join("").includes("他说"), false);
  assert.deepEqual([...TODAY_LINES], ["点一盏门灯", "做一件本周小事", "找一个人"]);
});

test("hint clock starts when storage is empty and a fresh gate clears a leftover stamp", () => {
  const bag = new Map<string, string>();
  const storage: HintStorage = {
    getItem: (key) => bag.get(key) ?? null,
    setItem: (key, value) => {
      bag.set(key, value);
    },
    removeItem: (key) => {
      bag.delete(key);
    },
  };
  const now = 1_800_000_000_000;
  const fresh = loadHintClock(now, storage);
  assert.equal(fresh.startedAt, now);
  assert.equal(fresh.dismissed, false);
  assert.equal(bag.get(HINT_START_KEY), String(now));

  const kept = loadHintClock(now + 1_000, storage);
  assert.equal(kept.startedAt, now);
  assert.equal(todayHintPhase({ elapsedMs: 1_000, dismissed: kept.dismissed }), "show");

  bag.set(HINT_DISMISS_KEY, "1");
  assert.equal(loadHintClock(now + 1_000, storage).dismissed, true);

  bag.set(HINT_START_KEY, "12");
  assert.equal(loadHintClock(now + 2_000, storage).startedAt, now + 2_000);

  bag.set(HINT_START_KEY, String(now + 90_000));
  assert.equal(loadHintClock(now + 3_000, storage).startedAt, now + 3_000);

  bag.set(HINT_START_KEY, String(now));
  bag.delete(HINT_DISMISS_KEY);
  const expired = loadHintClock(now + TODAY_HINT_MS + 5_000, storage);
  assert.equal(expired.startedAt, now);
  assert.equal(todayHintPhase({ elapsedMs: now + TODAY_HINT_MS + 5_000 - expired.startedAt, dismissed: false }), "off");

  clearHintClock(storage);
  assert.equal(bag.has(HINT_START_KEY), false);
  assert.equal(bag.has(HINT_DISMISS_KEY), false);
  assert.equal(loadHintClock(now + 8_000, storage).startedAt, now + 8_000);
});
