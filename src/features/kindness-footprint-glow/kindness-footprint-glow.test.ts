import assert from "node:assert/strict";
import test from "node:test";
import {
  kindnessGlowMark,
  kindnessGlowPixels,
} from "@/features/kindness-footprint-glow/kindness-footprint-glow";

test("kindness-footprint-glow is a soft halo only when a local stake exists", () => {
  assert.equal(kindnessGlowMark(0), "off");
  assert.equal(kindnessGlowMark(1), "soft");
  assert.equal(kindnessGlowMark(4), "soft");
  assert.equal(kindnessGlowMark(3, false), "off");

  assert.deepEqual(kindnessGlowPixels(10, 20, false), []);
  const glow = kindnessGlowPixels(40, 80);
  assert.deepEqual(kindnessGlowPixels(40, 80), glow);
  assert.equal(glow.length, 2);
  assert.equal(glow.every((pixel) => pixel.color.startsWith("rgba(")), true);
  const area = glow.reduce((sum, pixel) => sum + pixel.w * pixel.h, 0);
  assert.equal(area > 9, true);
  assert.equal(JSON.stringify(glow).includes("说"), false);
});
