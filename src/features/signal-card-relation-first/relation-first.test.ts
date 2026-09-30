import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import { RELATION_FIRST_ENABLED, RELATION_LEAD, SCORE_LABEL, signalCardOrder } from "@/features/signal-card-relation-first/relation-first";

test("PV-PM-012 puts relation ahead of the score rings", () => {
  assert.equal(RELATION_FIRST_ENABLED, true);
  assert.deepEqual(signalCardOrder(true), ["status", "score"]);
  assert.deepEqual(signalCardOrder(false), ["score", "status"]);
  assert.equal(SCORE_LABEL, "分数");
  assert.equal(copyIsClean([RELATION_LEAD, SCORE_LABEL]), true);
  assert.equal(RELATION_LEAD.includes("排名"), false);
});
