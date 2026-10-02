import assert from "node:assert/strict";
import test from "node:test";
import {
  PATH_GLOW_MS,
  PATH_GLOW_TILES,
  PATH_MICRO_GLOW_ENABLED,
  pathGlowMark,
  pathGlowOn,
  pathGlowPixels,
  pathGlowTiles,
} from "@/features/path-micro-glow/path-micro-glow";

test("PV-PM-074 lays two or three still warm stones and does not flicker a lamp", () => {
  assert.equal(PATH_MICRO_GLOW_ENABLED, true);
  assert.equal(pathGlowOn(), true);
  assert.equal(pathGlowOn(false), false);
  assert.equal(PATH_GLOW_MS >= 2_000 && PATH_GLOW_MS <= 3_000, true);
  assert.equal(PATH_GLOW_TILES >= 2 && PATH_GLOW_TILES <= 3, true);

  assert.equal(pathGlowMark({ elapsedMs: 0, reduced: false, quiet: false }), "pulse");
  assert.equal(pathGlowMark({ elapsedMs: 400, reduced: true, quiet: false }), "still");
  assert.equal(pathGlowMark({ elapsedMs: 400, reduced: false, quiet: true }), "still");
  assert.equal(pathGlowMark({ elapsedMs: PATH_GLOW_MS, reduced: false, quiet: false }), "off");
  assert.equal(pathGlowMark({ elapsedMs: 10, reduced: false, quiet: false, enabled: false }), "off");
  assert.equal(pathGlowMark({ elapsedMs: 0, reduced: true, quiet: true }), "still");

  const from = { x: 100, y: 200 };
  const to = { x: 280, y: 200 };
  const tiles = pathGlowTiles(from, to);
  assert.equal(tiles.length, 3);
  for (const tile of tiles) {
    assert.equal(tile.x > from.x && tile.x < to.x, true);
    assert.equal(tile.y, 200);
  }

  const still = pathGlowPixels(from, to, "still", 0);
  const later = pathGlowPixels(from, to, "still", 4);
  assert.deepEqual(still, later);
  assert.equal(still.length, 3);
  assert.equal(still.every((pixel) => pixel.w <= 4 && pixel.h <= 3), true);
  assert.equal(still.every((pixel) => pixel.color === "#f2d15c"), true);
  assert.equal(pathGlowPixels(from, to, "off", 0).length, 0);
  assert.equal(pathGlowPixels(from, to, "pulse", 0, false).length, 0);

  const pulse = pathGlowPixels(from, to, "pulse", 0);
  const flipped = pathGlowPixels(from, to, "pulse", 1.4);
  assert.notDeepEqual(pulse.map((pixel) => pixel.color), flipped.map((pixel) => pixel.color));
});
