import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTUMN_HINT_ENABLED,
  autumnHintCount,
  autumnHintFrame,
  autumnHintMark,
} from "@/features/autumn-hint/autumn-hint";

test("PV-PM-067 keeps a soft leaf hint, richer in October, still when motion is reduced", () => {
  assert.equal(AUTUMN_HINT_ENABLED, true);
  assert.equal(autumnHintCount(10, false), 5);
  assert.equal(autumnHintCount(6, false), 2);
  assert.equal(autumnHintCount(10, true), 0);
  assert.equal(autumnHintCount(10, false, false), 0);
  assert.equal(autumnHintMark({ month: 10, quiet: false, reduced: false }), "drift");
  assert.equal(autumnHintMark({ month: 10, quiet: false, reduced: true }), "still");
  assert.equal(autumnHintMark({ month: 3, quiet: false, reduced: false }), "drift");
  assert.equal(autumnHintMark({ month: 10, quiet: true, reduced: false }), "off");
  const october = autumnHintFrame({ month: 10, quiet: false, reduced: false, t: 0 });
  const later = autumnHintFrame({ month: 10, quiet: false, reduced: false, t: 2 });
  assert.equal(october.length, 10);
  assert.notDeepEqual(october, later);
  const held = autumnHintFrame({ month: 10, quiet: false, reduced: true, t: 0 });
  assert.deepEqual(held, autumnHintFrame({ month: 10, quiet: false, reduced: true, t: 3 }));
  const soft = autumnHintFrame({ month: 1, quiet: false, reduced: false, t: 0 });
  assert.equal(soft.length, 4);
  assert.equal(autumnHintFrame({ month: 10, quiet: true, reduced: false, t: 0 }).length, 0);
});
