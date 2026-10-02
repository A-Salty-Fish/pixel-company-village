import assert from "node:assert/strict";
import test from "node:test";
import {
  COLD_START_KEY,
  SLOGAN_REST_ENABLED,
  SLOGAN_SEEN_KEY,
  applyColdStart,
  readCount,
  sloganRestOn,
  sloganShouldRest,
} from "@/features/slogan-rest/slogan-rest";

test("PV-PM-107 rests the header slogan after a second start or a seen log", () => {
  assert.equal(SLOGAN_REST_ENABLED, true);
  assert.equal(sloganRestOn(false), false);
  assert.equal(COLD_START_KEY.startsWith("village:"), true);
  assert.equal(SLOGAN_SEEN_KEY.startsWith("village:"), true);
  assert.equal(applyColdStart(0, false), 1);
  assert.equal(applyColdStart(1, false), 2);
  assert.equal(applyColdStart(2, true), 2);
  assert.equal(readCount(null), 0);
  assert.equal(readCount("3"), 3);
  assert.equal(readCount("nope"), 0);
  assert.equal(sloganShouldRest({ coldStarts: 1, releaseSeen: false }), false);
  assert.equal(sloganShouldRest({ coldStarts: 2, releaseSeen: false }), true);
  assert.equal(sloganShouldRest({ coldStarts: 1, releaseSeen: true }), true);
  assert.equal(sloganShouldRest({ coldStarts: 2, releaseSeen: true, enabled: false }), false);
});
