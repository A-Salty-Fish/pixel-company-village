import assert from "node:assert/strict";
import test from "node:test";
import { lightLabel } from "@/lib/copy";
import {
  DAY_GRASS,
  LAMP_CORE,
  NIGHT_WASH_V2_ENABLED,
  VEIL_INK,
  WASH_COMPOSITE,
  contrastRatio,
  farmStillReads,
  nightField,
  nightLookV2,
  nightWashBlanks,
  nightWashV2Mark,
  nightWashV2ShouldPaint,
  sessionIsNight,
} from "@/features/night-wash-v2/night-wash-v2";

test("PV-PM-016 night wash follows the glance clock and stays dark, cool, and still", () => {
  assert.equal(NIGHT_WASH_V2_ENABLED, true);
  assert.deepEqual(nightLookV2(true), nightLookV2(false));
  assert.equal(nightLookV2(true).static, true);
  assert.equal(nightWashV2Mark(true), "active");
  assert.equal(nightWashV2Mark(false), "off");

  for (let hour = 0; hour < 24; hour += 1) {
    assert.equal(sessionIsNight(hour), lightLabel(hour) === "夜里");
    assert.equal(nightWashV2ShouldPaint(hour, true), sessionIsNight(hour));
    assert.equal(nightWashV2ShouldPaint(hour, false), sessionIsNight(hour));
  }

  const night = nightField(DAY_GRASS);
  assert.equal(WASH_COMPOSITE, "source-over");
  assert.equal(nightWashBlanks(), false);
  assert.equal(nightWashBlanks(0.78), true);
  assert.equal(VEIL_INK.a < 0.75, true);
  assert.equal(farmStillReads(night), true);
  assert.equal(night.b > night.g, true);
  assert.equal(night.g < DAY_GRASS.g - 40, true);
  assert.equal(night.r < DAY_GRASS.r - 20, true);
  assert.equal(DAY_GRASS.g - DAY_GRASS.b - (night.g - night.b) >= 40, true);
  assert.equal(contrastRatio(LAMP_CORE, night) >= 4.5, true);
});
