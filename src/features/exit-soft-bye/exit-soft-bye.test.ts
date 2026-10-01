import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import { EXIT_SOFT_BYE_ENABLED, EXIT_SOFT_BYE_LINE, EXIT_SOFT_BYE_MS, exitByeCopy, exitByePlan } from "@/features/exit-soft-bye/exit-soft-bye";

test("PV-PM-060 shows one short bye and still leaves", () => {
  assert.equal(EXIT_SOFT_BYE_ENABLED, true);
  assert.equal(EXIT_SOFT_BYE_MS <= 1_500, true);
  assert.equal(EXIT_SOFT_BYE_MS > 0, true);
  const plan = exitByePlan();
  assert.equal(plan.line, EXIT_SOFT_BYE_LINE);
  assert.equal(plan.waitMs, EXIT_SOFT_BYE_MS);
  assert.deepEqual(exitByePlan(false), { line: null, waitMs: 0 });
  assert.equal(copyIsClean(exitByeCopy()), true);
});
