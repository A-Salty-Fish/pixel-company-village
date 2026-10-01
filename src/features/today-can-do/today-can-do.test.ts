import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  TODAY_CAN_DO_ENABLED,
  TODAY_FADE_MS,
  TODAY_HINT_MS,
  todayHintCopy,
  todayHintDismisses,
  todayHintPhase,
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
});
