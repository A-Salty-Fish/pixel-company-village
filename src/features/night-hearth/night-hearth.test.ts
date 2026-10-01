import assert from "node:assert/strict";
import test from "node:test";
import { POND_SLAB_ENABLED } from "@/features/night-readability/night-readability";
import { NARROW_MAP_FILL_ENABLED, narrowFillCamera, narrowMapFillMark } from "@/features/narrow-map-fill/narrow-map-fill";
import { viewSpan } from "@/lib/pixel-scene";
import {
  NIGHT_HEARTH_ENABLED,
  nightHearthMark,
  nightHearthOn,
  nightHearthPixels,
} from "@/features/night-hearth/night-hearth";

function plotPeople(count: number) {
  const people = [];
  for (let index = 0; index < count; index += 1) {
    const col = index % 10;
    const row = Math.floor(index / 10) % 10;
    people.push({
      x: 32 + col * 112 + (col >= 5 ? 32 : 0) + 64,
      y: 240 + row * 80 + (row >= 5 ? 32 : 0) + 58,
    });
  }
  return people;
}

test("PV-PM-072 warms a few night windows and does not paint a navy slab", () => {
  assert.equal(NIGHT_HEARTH_ENABLED, true);
  assert.equal(nightHearthOn(), true);
  assert.equal(nightHearthOn(false), false);
  assert.equal(nightHearthMark(true), "warm");
  assert.equal(nightHearthMark(false), "off");
  assert.equal(nightHearthMark(true, false), "off");
  assert.equal(nightHearthPixels(false).length, 0);

  assert.equal(NARROW_MAP_FILL_ENABLED, true);
  assert.equal(POND_SLAB_ENABLED, false);

  const pixels = nightHearthPixels(true);
  assert.equal(pixels.length >= 4 && pixels.length <= 12, true);
  let area = 0;
  for (const pixel of pixels) {
    assert.equal(pixel.w <= 8 && pixel.h <= 6, true);
    assert.equal(pixel.w * pixel.h <= 48, true);
    area += pixel.w * pixel.h;
    const pond = pixel.x >= 32 && pixel.x <= 224 && pixel.y >= 32 && pixel.y <= 128;
    assert.equal(pond, false);
    assert.equal(/#fff6d8|#f2d15c|#e7c48a/.test(pixel.color), true);
  }
  assert.equal(area < 200, true);

  const cam = narrowFillCamera({ people: plotPeople(18), cssW: 390, cssH: 596 });
  assert.ok(cam);
  assert.equal(cam.zoom > 1, true);
  assert.equal(narrowMapFillMark(cam.zoom), "village");
  const span = viewSpan(cam.zoom);
  assert.ok(cam.y + span.h < 700);
});
