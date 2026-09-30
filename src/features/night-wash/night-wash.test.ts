import assert from "node:assert/strict";
import test from "node:test";
import {
  DAY_GRASS,
  NIGHT_INK,
  WINDOW_CORE,
  blendOver,
  contrastRatio,
  nightLook,
  nightShift,
  nightWashMark,
} from "@/features/night-wash/night-wash";

test("PV-PM-014 night wash stays cool, still, and readable", () => {
  assert.deepEqual(nightLook(true), nightLook(false));
  assert.equal(nightLook(true).static, true);
  assert.equal(nightWashMark(true, true), "cool");
  assert.equal(nightWashMark(true, false), "cool");
  assert.equal(nightWashMark(false, true), "off");

  const night = blendOver(DAY_GRASS, NIGHT_INK);
  assert.equal(nightShift(DAY_GRASS, night) >= 24, true);
  assert.equal(night.b > DAY_GRASS.b, true);
  assert.equal(contrastRatio(WINDOW_CORE, night) >= 3, true);
});
