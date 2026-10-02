import assert from "node:assert/strict";
import test from "node:test";
import {
  PATH_BODY,
  PATH_FLECK,
  PATH_GRIT,
  PATH_GRIT_LIT,
  PATH_STONE_WARM_ENABLED,
  PATH_WASH,
  pathStoneGrit,
  pathStoneGritLit,
  pathStoneWarmMark,
  pathStoneWarmOn,
  pathWarmth,
  warmedPath,
} from "@/features/path-stone-warm/path-stone-warm";

test("PV-PM-097 pulls path flecks into the same honey stone", () => {
  assert.equal(PATH_STONE_WARM_ENABLED, true);
  assert.equal(pathStoneWarmOn(), true);
  assert.equal(pathStoneWarmOn(false), false);
  assert.equal(pathStoneWarmMark(), "honey");
  assert.equal(pathStoneWarmMark(false), "mixed");
  assert.equal(PATH_WASH.a > 0.15 && PATH_WASH.a < 0.4, true);
  assert.equal(pathStoneGrit(), PATH_GRIT);
  assert.equal(pathStoneGrit(false), "rgba(92, 58, 28, 0.45)");
  assert.equal(pathStoneGritLit(), PATH_GRIT_LIT);
  assert.equal(pathStoneGritLit(false), null);

  const fleck = warmedPath(PATH_FLECK);
  const body = warmedPath(PATH_BODY);
  assert.equal(fleck.r >= fleck.g, true);
  assert.equal(pathWarmth(fleck) >= 60, true);
  assert.equal(pathWarmth(body) >= 60, true);
  assert.equal(body.r > fleck.r, true);
  assert.deepEqual(warmedPath(PATH_FLECK, false), PATH_FLECK);
});
