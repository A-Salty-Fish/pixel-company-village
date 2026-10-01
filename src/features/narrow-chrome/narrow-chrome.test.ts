import assert from "node:assert/strict";
import test from "node:test";
import {
  NARROW_CHROME_ENABLED,
  NARROW_CHROME_MAX_PX,
  ritualTrioFolded,
  todayEntryLabel,
  todayRowFits,
} from "@/features/narrow-chrome/narrow-chrome";

test("narrow chrome folds the ritual trio into one today row", () => {
  assert.equal(NARROW_CHROME_ENABLED, true);
  assert.equal(NARROW_CHROME_MAX_PX, 900);
  assert.equal(todayEntryLabel(0, 3, true), "今日 · 周事 0/3");
  assert.equal(todayEntryLabel(2, 3, true), "今日 · 周事 2/3");
  assert.equal(todayEntryLabel(0, 3, false), "今日");
  assert.equal(ritualTrioFolded(375), true);
  assert.equal(ritualTrioFolded(390), true);
  assert.equal(ritualTrioFolded(430), true);
  assert.equal(ritualTrioFolded(480), true);
  assert.equal(ritualTrioFolded(481), true);
  assert.equal(ritualTrioFolded(768), true);
  assert.equal(ritualTrioFolded(900), true);
  assert.equal(ritualTrioFolded(901), false);
  assert.equal(ritualTrioFolded(1280), false);
  assert.equal(ritualTrioFolded(390, false), false);
  assert.equal(todayRowFits(48), true);
  assert.equal(todayRowFits(44), true);
  assert.equal(todayRowFits(49), false);
});
