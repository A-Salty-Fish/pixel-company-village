import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import { FIRST_VISIT_TIPS } from "@/features/first-visit-one-hint/first-visit-one-hint";
import {
  PLAY_FIRST_TIP,
  PLAY_FIRST_TIP_ENABLED,
  firstTipTeachesComfort,
  firstTipTeachesPlay,
  playFirstTipOn,
  softenFirstTip,
} from "@/features/play-first-tip/play-first-tip";

test("PV-PM-103 first tip teaches a map action, not the comfort switches", () => {
  assert.equal(PLAY_FIRST_TIP_ENABLED, true);
  assert.equal(playFirstTipOn(false), false);
  const first = softenFirstTip(FIRST_VISIT_TIPS[0] ?? "", 0);
  assert.equal(first.startsWith(FIRST_VISIT_TIPS[0] ?? ""), true);
  assert.equal(first.endsWith(PLAY_FIRST_TIP), true);
  assert.equal(firstTipTeachesComfort(first), false);
  assert.equal(firstTipTeachesPlay(first), true);
  assert.equal(softenFirstTip(FIRST_VISIT_TIPS[0] ?? "", 0, false), FIRST_VISIT_TIPS[0]);
  const comfort = FIRST_VISIT_TIPS.find((line) => firstTipTeachesComfort(line)) ?? "";
  assert.equal(firstTipTeachesComfort(comfort), true);
  const later = softenFirstTip(comfort, 3);
  assert.equal(firstTipTeachesComfort(later), false);
  assert.equal(firstTipTeachesPlay(later), true);
  assert.equal(copyIsClean([first, later]), true);
});
