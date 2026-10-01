import assert from "node:assert/strict";
import test from "node:test";
import {
  MEADOW_BREATH_ENABLED,
  MEADOW_GRASS,
  meadowBreathCount,
  meadowBreathFrame,
  meadowBreathMark,
  meadowBreathOn,
} from "@/features/meadow-breath/meadow-breath";

test("PV-D-021 grass leans and the path lantern breathes, then holds still", () => {
  assert.equal(MEADOW_BREATH_ENABLED, true);
  assert.equal(meadowBreathOn(), true);
  assert.equal(meadowBreathOn(false), false);
  assert.equal(meadowBreathMark(false), "sway");
  assert.equal(meadowBreathMark(true), "still");
  assert.equal(meadowBreathMark(false, false), "off");

  const off = meadowBreathFrame(false, 1, false);
  assert.equal(off.grass.length + off.lantern.length, 0);
  assert.equal(meadowBreathCount(false, false), 0);

  const start = meadowBreathFrame(false, 0);
  const later = meadowBreathFrame(false, 1);
  assert.equal(start.grass.length, MEADOW_GRASS * 2);
  assert.equal(start.lantern.length, 2);
  assert.equal(meadowBreathCount(false), MEADOW_GRASS * 2 + 2);
  assert.notDeepEqual(start, later);

  const held = meadowBreathFrame(true, 0);
  assert.deepEqual(held, meadowBreathFrame(true, 3));
  assert.equal(held.grass.every((pixel, index) => index % 2 === 1 ? pixel.x === held.grass[index - 1]?.x : true), true);

  const pixels = [...start.grass, ...start.lantern, ...later.lantern];
  assert.equal(pixels.every((pixel) => pixel.x >= 0 && pixel.x < 1216 && pixel.y >= 0 && pixel.y < 1120), true);
  assert.equal(start.lantern.some((pixel) => pixel.color === "#fff6d8"), true);
});
