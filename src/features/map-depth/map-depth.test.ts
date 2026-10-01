import assert from "node:assert/strict";
import test from "node:test";
import {
  MAP_DEPTH_ENABLED,
  mapDepthCount,
  mapDepthMark,
  mapDepthOn,
  mapDepthPixels,
} from "@/features/map-depth/map-depth";

test("PV-D-022 adds roof, shadow, fence, and path grit without covering the pond", () => {
  assert.equal(MAP_DEPTH_ENABLED, true);
  assert.equal(mapDepthOn(), true);
  assert.equal(mapDepthOn(false), false);
  assert.equal(mapDepthMark(), "layered");
  assert.equal(mapDepthMark(false), "flat");
  assert.equal(mapDepthCount(false), 0);

  const frame = mapDepthPixels();
  assert.equal(frame.roofs.length, 6);
  assert.equal(frame.ground.length > 20, true);
  assert.equal(frame.roofs.some((pixel) => pixel.color === "#fff1c8" && pixel.y < 140), true);
  assert.equal(frame.ground.some((pixel) => pixel.w >= 40), true);
  assert.equal(mapDepthCount(), frame.ground.length + frame.roofs.length);
  const pixels = [...frame.ground, ...frame.roofs];
  assert.equal(pixels.every((pixel) => pixel.x >= 0 && pixel.x < 1216 && pixel.y >= 0 && pixel.y < 1120), true);
  const onPond = pixels.some((pixel) => pixel.x >= 32 && pixel.x <= 224 && pixel.y >= 32 && pixel.y <= 128);
  assert.equal(onPond, false);
  assert.equal(frame.roofs.some((pixel) => pixel.color === "#fff1c8"), true);
});
