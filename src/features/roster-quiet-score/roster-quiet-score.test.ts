import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  ROSTER_QUIET_SCORE_ENABLED,
  UNSCORED_ACTION,
  unscoredAction,
  unscoredEchoCount,
  unscoredStatus,
} from "@/features/roster-quiet-score/roster-quiet-score";

test("PV-PM-101 shows 未评分 once and a different button word", () => {
  assert.equal(ROSTER_QUIET_SCORE_ENABLED, true);
  assert.equal(unscoredStatus(), "未评分");
  assert.equal(unscoredAction(), UNSCORED_ACTION);
  assert.notEqual(unscoredAction(), unscoredStatus());
  assert.equal(unscoredAction(false), "未评分");
  assert.equal(unscoredEchoCount(unscoredStatus(), unscoredAction()), 1);
  assert.equal(unscoredEchoCount(unscoredStatus(), unscoredAction(false)), 2);
  assert.equal(copyIsClean([unscoredStatus(), unscoredAction()]), true);
});
