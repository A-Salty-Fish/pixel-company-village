import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  RITUAL_BEAT_TOTAL,
  RITUAL_RIM_ENABLED,
  RITUAL_RIM_TOAST,
  ritualRimCopy,
  ritualRimOffer,
} from "@/features/ritual-rim/ritual-rim";

test("PV-PM-040 offers one toast after the day's ritual and does not nag", () => {
  assert.equal(RITUAL_RIM_ENABLED, true);
  assert.equal(RITUAL_BEAT_TOTAL, 3);
  assert.equal(ritualRimOffer({ justCompleted: true, alreadyShown: false }), true);
  assert.equal(ritualRimOffer({ justCompleted: true, alreadyShown: true }), false);
  assert.equal(ritualRimOffer({ justCompleted: false, alreadyShown: false }), false);
  assert.equal(ritualRimOffer({ justCompleted: true, alreadyShown: false, enabled: false }), false);
  assert.equal(RITUAL_RIM_TOAST.length <= 24, true);
  assert.equal(copyIsClean(ritualRimCopy()), true);
});
