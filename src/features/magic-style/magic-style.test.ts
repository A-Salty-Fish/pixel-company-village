import assert from "node:assert/strict";
import test from "node:test";
import {
  TIERS,
  auraCap,
  beat,
  envelope,
  harmonize,
  loopCap,
  paletteColors,
  particleCount,
  zoomTier,
} from "./magic-style";

test("three tiers get brighter from background to play", () => {
  assert.equal(TIERS.back.alpha < TIERS.ambient.alpha && TIERS.ambient.alpha < TIERS.play.alpha, true);
  assert.equal(TIERS.back.top < TIERS.ambient.top && TIERS.ambient.top < TIERS.play.top, true);
});

test("harmonize maps every lit pixel onto the shared palette", () => {
  const palette = new Set(paletteColors().map((c) => c.toLowerCase()));
  const data = new Uint8ClampedArray([255, 40, 40, 255, 30, 200, 90, 200, 120, 60, 220, 255, 0, 0, 0, 0]);
  harmonize(data, "ambient");
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] === 0) continue;
    const hex = `#${[data[p], data[p + 1], data[p + 2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    assert.equal(palette.has(hex), true, hex);
    assert.equal(data[p + 3] <= Math.round(255 * TIERS.ambient.alpha), true);
  }
});

test("envelope rises, holds and falls back to nothing", () => {
  assert.equal(envelope(0, 2), 0);
  assert.equal(envelope(2, 2), 0);
  assert.equal(envelope(1, 2), 1);
  assert.equal(envelope(0.05, 2) < 1, true);
  assert.equal(envelope(1.9, 2) < envelope(1.75, 2), true);
});

test("looks step on a shared 12fps beat", () => {
  assert.equal(beat(0.05), 0);
  assert.equal(beat(1 / 12 + 0.001), 1 / 12);
});

test("the full map shows less than a close view", () => {
  assert.equal(zoomTier(1), "map");
  assert.equal(zoomTier(2), "near");
  assert.equal(zoomTier(3), "close");
  for (const narrow of [true, false]) {
    assert.equal(loopCap("map", narrow) < loopCap("near", narrow), true);
    assert.equal(auraCap("map", narrow) <= auraCap("near", narrow), true);
  }
  assert.equal(particleCount(10, "map") < particleCount(10, "near"), true);
});
