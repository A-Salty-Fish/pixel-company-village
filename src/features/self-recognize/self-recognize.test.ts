import assert from "node:assert/strict";
import test from "node:test";
import { findMeRing } from "@/lib/worldcraft";
import {
  SELF_RECOGNIZE_ENABLED,
  SELF_RECOGNIZE_MS,
  selfPlateDash,
  selfRecognizeFeet,
  selfRecognizeMark,
  selfRecognizeOn,
} from "@/features/self-recognize/self-recognize";

test("PV-PM-089 a warm self mark appears without 找我 and does not flash", () => {
  assert.equal(SELF_RECOGNIZE_ENABLED, true);
  assert.equal(selfRecognizeOn(), true);
  assert.equal(selfRecognizeOn(false), false);
  assert.equal(SELF_RECOGNIZE_MS <= 2000, true);
  assert.equal(selfRecognizeMark({ hasSelf: false, quiet: false, reduced: false }), "off");
  assert.equal(selfRecognizeMark({ hasSelf: true, quiet: false, reduced: false }), "warm");
  assert.equal(selfRecognizeMark({ hasSelf: true, quiet: true, reduced: false }), "still");
  assert.equal(selfRecognizeMark({ hasSelf: true, quiet: false, reduced: true }), "still");
  assert.equal(selfRecognizeMark({ hasSelf: true, quiet: false, reduced: false, enabled: false }), "off");

  const warm = selfRecognizeFeet(80, 120, "warm");
  const still = selfRecognizeFeet(80, 120, "still");
  assert.equal(warm.length > 0, true);
  assert.deepEqual(still, warm);
  assert.deepEqual(selfRecognizeFeet(80, 120, "off"), []);
  assert.equal(selfPlateDash("warm"), true);
  assert.equal(selfPlateDash("still"), true);
  assert.equal(selfPlateDash("off"), false);

  const ring = findMeRing(80, 120, true, 0);
  const sameShape = warm.some((pixel) =>
    ring.some((tick) => tick.w === pixel.w && tick.h === pixel.h && tick.x === pixel.x && tick.y === pixel.y),
  );
  assert.equal(sameShape, false);
});
