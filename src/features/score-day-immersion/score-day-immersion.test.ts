import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  SCORE_DAY_IMMERSION_ENABLED,
  SCORE_DAY_LINE,
  scoreDayAlpha,
  scoreDayMark,
  scoreDayTextColor,
} from "@/features/score-day-immersion/score-day-immersion";

test("PV-PM-021 score-day cue is quiet, readable, and absent on a stale day", () => {
  assert.equal(SCORE_DAY_IMMERSION_ENABLED, true);
  assert.equal(scoreDayMark(false, false), "off");
  assert.equal(scoreDayMark(false, true), "off");
  assert.equal(scoreDayMark(true, true), "quiet");
  assert.equal(scoreDayMark(true, false), "soft");
  assert.equal(scoreDayMark(true, false, false), "off");
  assert.equal(scoreDayAlpha("quiet") < scoreDayAlpha("soft"), true);
  assert.equal(scoreDayAlpha("off"), 0);
  assert.equal(scoreDayTextColor("quiet"), scoreDayTextColor("soft"));
  assert.equal(scoreDayTextColor("quiet"), "#4a3a28");
  assert.equal(copyIsClean([SCORE_DAY_LINE]), true);
});
