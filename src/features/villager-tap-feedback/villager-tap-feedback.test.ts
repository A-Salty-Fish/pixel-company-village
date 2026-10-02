import assert from "node:assert/strict";
import test from "node:test";
import {
  TAP_FEEDBACK_MS,
  VILLAGER_TAP_FEEDBACK_ENABLED,
  tapDustPixels,
  tapFeedbackMark,
  tapFeedbackOn,
  tapHop,
} from "@/features/villager-tap-feedback/villager-tap-feedback";

test("PV-PM-076 hops for at most 200ms and can be turned off", () => {
  assert.equal(VILLAGER_TAP_FEEDBACK_ENABLED, true);
  assert.equal(tapFeedbackOn(), true);
  assert.equal(tapFeedbackOn(false), false);
  assert.equal(TAP_FEEDBACK_MS <= 200, true);
  assert.equal(tapFeedbackMark({ elapsedMs: 0, reduced: false }), "bounce");
  assert.equal(tapFeedbackMark({ elapsedMs: 80, reduced: true }), "dust");
  assert.equal(tapFeedbackMark({ elapsedMs: TAP_FEEDBACK_MS, reduced: false }), "off");
  assert.equal(tapFeedbackMark({ elapsedMs: -1, reduced: false }), "off");
  assert.equal(tapFeedbackMark({ elapsedMs: 40, reduced: false, enabled: false }), "off");

  assert.equal(tapHop(0, false), 0);
  assert.equal(tapHop(100, false) >= 1, true);
  assert.equal(tapHop(100, true), 0);
  assert.equal(tapHop(TAP_FEEDBACK_MS, false), 0);

  const dust = tapDustPixels(40, 80, 40, true);
  assert.equal(dust.length, 3);
  assert.equal(dust.every((pixel) => pixel.w <= 3 && pixel.h <= 2), true);
  assert.equal(tapDustPixels(40, 80, 400, false).length, 0);
  assert.equal(tapDustPixels(40, 80, 40, false, false).length, 0);
});
