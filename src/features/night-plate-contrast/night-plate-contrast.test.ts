import assert from "node:assert/strict";
import test from "node:test";
import {
  NIGHT_PLATE_CONTRAST_ENABLED,
  nightPlateAlpha,
  nightPlateHour,
  nightPlateMark,
  nightPlateOn,
} from "@/features/night-plate-contrast/night-plate-contrast";

test("PV-PM-092 night lifts own and near plates one notch, not the far ones", () => {
  assert.equal(NIGHT_PLATE_CONTRAST_ENABLED, true);
  assert.equal(nightPlateOn(), true);
  assert.equal(nightPlateOn(false), false);
  assert.equal(nightPlateHour(22), true);
  assert.equal(nightPlateHour(23), true);
  assert.equal(nightPlateHour(2), true);
  assert.equal(nightPlateHour(21), false);
  assert.equal(nightPlateHour(14), false);
  assert.equal(nightPlateMark(22, false), "lift");
  assert.equal(nightPlateMark(22, true), "quiet");
  assert.equal(nightPlateMark(21, false), "off");
  assert.equal(nightPlateMark(22, false, false), "off");

  const base = 0.7;
  const lift = nightPlateAlpha(base, "self", "lift");
  const near = nightPlateAlpha(base, "neighbor", "lift");
  const quiet = nightPlateAlpha(base, "self", "quiet");
  const far = nightPlateAlpha(base, "far", "lift");
  assert.equal(lift > base, true);
  assert.equal(near, lift);
  assert.equal(quiet > base, true);
  assert.equal(quiet < lift, true);
  assert.equal(far, base);
  assert.equal(nightPlateAlpha(base, "self", "off"), base);
  assert.equal(lift <= 1, true);
});
