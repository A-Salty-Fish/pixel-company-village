import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILDING_VOLUME_ENABLED,
  buildingVolumeCount,
  buildingVolumeLayers,
  buildingVolumeMark,
  buildingVolumeOn,
  buildingVolumePixels,
} from "@/features/building-volume/building-volume";

test("PV-PM-069 gives each house a ridge lip and a shaded wall", () => {
  assert.equal(BUILDING_VOLUME_ENABLED, true);
  assert.equal(buildingVolumeOn(), true);
  assert.equal(buildingVolumeOn(false), false);
  assert.equal(buildingVolumeMark(), "round");
  assert.equal(buildingVolumeMark(false), "flat");
  assert.equal(buildingVolumeCount(false), 0);
  assert.equal(buildingVolumeLayers(false).length, 0);

  const layers = buildingVolumeLayers();
  assert.equal(layers.length, 3);
  for (const layer of layers) {
    assert.equal(layer.pixels.length, 4);
    const lip = layer.pixels[0];
    const wall = layer.pixels[2];
    assert.ok(lip);
    assert.ok(wall);
    assert.equal(lip.color, "#fff1c8");
    assert.equal(lip.y < wall.y, true);
    assert.equal(wall.color.startsWith("rgba(42, 18, 8"), true);
    assert.equal(lip.h <= 2, true);
    assert.equal(wall.w >= 16, true);
  }

  const pixels = buildingVolumePixels();
  assert.equal(buildingVolumeCount(), pixels.length);
  assert.equal(pixels.every((pixel) => pixel.x >= 0 && pixel.x < 1216 && pixel.y >= 0 && pixel.y < 1120), true);
  assert.equal(pixels.some((pixel) => pixel.color === "#fff1c8"), true);
  assert.equal(pixels.some((pixel) => pixel.color.includes("0.4")), true);
});
