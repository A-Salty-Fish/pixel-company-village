import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  FIRST_VISIT_ONE_HINT_ENABLED,
  FIRST_VISIT_TIPS,
  firstVisitAdvance,
  firstVisitBlocksMap,
  firstVisitCopy,
  firstVisitDone,
  firstVisitHoldsSlot,
  firstVisitIdentityDropped,
  firstVisitOn,
  firstVisitShownStep,
  firstVisitTip,
  readFirstVisitStep,
} from "@/features/first-visit-one-hint/first-visit-one-hint";
import { emptyVisit, visitForIdentity } from "@/lib/first-run";

test("PV-PM-094 one first-visit tip at a time, then the next", () => {
  assert.equal(FIRST_VISIT_ONE_HINT_ENABLED, true);
  assert.equal(firstVisitOn(), true);
  assert.equal(firstVisitOn(false), false);
  assert.equal(firstVisitBlocksMap(), false);
  assert.equal(firstVisitTip(0), FIRST_VISIT_TIPS[0]);
  assert.equal(firstVisitTip(1), FIRST_VISIT_TIPS[1]);
  assert.notEqual(firstVisitTip(0), firstVisitTip(1));
  assert.equal(firstVisitTip(FIRST_VISIT_TIPS.length), null);
  assert.equal(firstVisitTip(0, false), null);
  const next = firstVisitAdvance(0);
  assert.equal(next, 1);
  assert.equal(firstVisitDone(next), false);
  assert.equal(firstVisitDone(FIRST_VISIT_TIPS.length), true);
  assert.equal(readFirstVisitStep(null), 0);
  assert.equal(readFirstVisitStep("2"), 2);
  assert.equal(readFirstVisitStep("nope"), 0);
  assert.equal(firstVisitHoldsSlot({ guideSeen: false, step: 0 }), true);
  assert.equal(firstVisitHoldsSlot({ guideSeen: true, step: 0 }), false);
  assert.equal(firstVisitHoldsSlot({ guideSeen: false, step: FIRST_VISIT_TIPS.length }), true);
  assert.equal(firstVisitShownStep(false, null), 0);
  assert.equal(firstVisitShownStep(false, String(FIRST_VISIT_TIPS.length)), 0);
  assert.equal(firstVisitShownStep(true, null), FIRST_VISIT_TIPS.length);
  assert.equal(firstVisitTip(firstVisitShownStep(false, String(FIRST_VISIT_TIPS.length))), FIRST_VISIT_TIPS[0]);
  assert.equal(firstVisitIdentityDropped(true, false), true);
  assert.equal(firstVisitIdentityDropped(false, false), false);
  assert.equal(firstVisitIdentityDropped(true, true), false);
  const stuck = visitForIdentity({ self: true, yard: true, social: true }, false);
  assert.equal(stuck.self, false);
  assert.equal(stuck.yard && stuck.social, true);
  const fresh = emptyVisit();
  assert.equal(visitForIdentity(fresh, false), fresh);
  assert.equal(copyIsClean(firstVisitCopy()), true);
  assert.equal(firstVisitCopy().some((line) => line.includes("知道了")), false);
});
