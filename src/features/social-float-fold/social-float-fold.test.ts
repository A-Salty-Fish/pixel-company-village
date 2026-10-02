import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  SOCIAL_FLOAT_CHIP,
  SOCIAL_FLOAT_FOLD_ENABLED,
  floatBlockCount,
  floatReachableIn,
  socialFloatFoldOn,
  socialFloatFolds,
} from "@/features/social-float-fold/social-float-fold";

test("PV-PM-108 folds wave and companionship into one chip after self", () => {
  assert.equal(SOCIAL_FLOAT_FOLD_ENABLED, true);
  assert.equal(socialFloatFoldOn(false), false);
  assert.equal(socialFloatFolds(true, 390), true);
  assert.equal(socialFloatFolds(false, 390), false);
  assert.equal(socialFloatFolds(true, 481), false);
  assert.equal(socialFloatFolds(true, 390, false), false);
  assert.equal(floatBlockCount({ folded: true, open: false, extras: 0 }), 1);
  assert.equal(floatBlockCount({ folded: true, open: true, extras: 0 }), 3);
  assert.equal(floatBlockCount({ folded: false, open: false, extras: 0 }), 2);
  assert.equal(floatReachableIn(false) <= 2, true);
  assert.equal(copyIsClean([SOCIAL_FLOAT_CHIP]), true);
});
