import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  FIND_ME_PATH_ENABLED,
  FIND_ME_PATH_MS,
  FIND_ME_RECEIPT,
  findMeApproach,
  findMePathCopy,
  findMePathMark,
  findMePathOn,
  findMePathPixels,
  findMeStones,
} from "@/features/find-me-path/find-me-path";

test("PV-PM-090 find-me leaves a short line and two or three still-able stones", () => {
  assert.equal(FIND_ME_PATH_ENABLED, true);
  assert.equal(findMePathOn(), true);
  assert.equal(findMePathOn(false), false);
  assert.equal(FIND_ME_PATH_MS <= 2000, true);
  assert.equal(FIND_ME_PATH_MS >= 1800, true);
  assert.equal(findMePathMark({ elapsedMs: 0, quiet: false, reduced: false }), "pulse");
  assert.equal(findMePathMark({ elapsedMs: 500, quiet: true, reduced: false }), "still");
  assert.equal(findMePathMark({ elapsedMs: 500, quiet: false, reduced: true }), "still");
  assert.equal(findMePathMark({ elapsedMs: 2000, quiet: false, reduced: false }), "off");
  assert.equal(findMePathMark({ elapsedMs: 100, quiet: false, reduced: false, enabled: false }), "off");

  const approach = findMeApproach({ x: 200, y: 160 });
  const stones = findMeStones(approach.from, approach.to);
  assert.equal(stones.length >= 2 && stones.length <= 3, true);
  const stillA = findMePathPixels(approach.from, approach.to, "still", 0);
  const stillB = findMePathPixels(approach.from, approach.to, "still", 1.2);
  assert.equal(stillA.length, stones.length);
  assert.deepEqual(stillB, stillA);
  assert.equal(stillA.every((pixel) => pixel.color === "#f2d15c"), true);
  assert.deepEqual(findMePathPixels(approach.from, approach.to, "off", 0), []);
  assert.equal(copyIsClean(findMePathCopy()), true);
  assert.equal(/他说|原文|聊天/.test(FIND_ME_RECEIPT), false);
});
