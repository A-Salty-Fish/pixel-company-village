import assert from "node:assert/strict";
import test from "node:test";
import { findMeRing } from "@/lib/worldcraft";
import {
  SELF_PLATE_GHOST_ENABLED,
  selfBracketPixels,
  selfGhostOn,
  selfGhostSuppressed,
} from "@/features/self-plate-ghost/self-plate-ghost";

test("PV-PM-091 self brackets stay off for find-me, home, and idle", () => {
  assert.equal(SELF_PLATE_GHOST_ENABLED, true);
  assert.equal(selfGhostOn(), true);
  assert.equal(selfGhostSuppressed(), true);
  assert.equal(selfGhostSuppressed(false), false);
  assert.deepEqual(selfBracketPixels(40, 90, false, 1, false), []);
  assert.deepEqual(selfBracketPixels(40, 90, true, 0, true), []);
  assert.deepEqual(selfBracketPixels(40, 90, false, 0, false, false), findMeRing(40, 90, false, 0));
  const stacked = selfBracketPixels(40, 90, false, 0, true, false);
  assert.equal(stacked.length, findMeRing(40, 90, false, 0).length * 2);
});
