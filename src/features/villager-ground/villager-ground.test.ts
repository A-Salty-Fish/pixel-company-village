import assert from "node:assert/strict";
import test from "node:test";
import {
  VILLAGER_GROUND_ENABLED,
  villagerGroundMark,
  villagerGroundOn,
  villagerGroundPixels,
} from "@/features/villager-ground/villager-ground";

test("PV-PM-070 softens the contact shadow and keeps a short rim", () => {
  assert.equal(VILLAGER_GROUND_ENABLED, true);
  assert.equal(villagerGroundOn(), true);
  assert.equal(villagerGroundOn(false), false);
  assert.equal(villagerGroundMark(), "soft");
  assert.equal(villagerGroundMark(false), "hard");
  assert.equal(villagerGroundPixels(40, 80, false).length, 0);

  const pixels = villagerGroundPixels(40, 80);
  assert.equal(pixels.length, 7);
  const shadow = pixels.filter((pixel) => pixel.y >= 78);
  const rim = pixels.filter((pixel) => pixel.color.includes("0.72"));
  assert.equal(shadow.length, 3);
  assert.equal(Math.max(...shadow.map((pixel) => pixel.w)) >= 28, true);
  assert.equal(shadow.every((pixel) => pixel.h <= 2), true);
  assert.equal(shadow.every((pixel) => pixel.color.includes("0.2") || pixel.color.includes("0.12") || pixel.color.includes("0.07")), true);
  assert.equal(rim.length, 4);
  assert.equal(rim.every((pixel) => pixel.w <= 2 && pixel.h <= 6), true);
  assert.equal(pixels.some((pixel) => pixel.w >= 18 && pixel.h >= 16), false);
});
