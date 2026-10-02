import assert from "node:assert/strict";
import test from "node:test";
import { narrowFillCamera } from "@/features/narrow-map-fill/narrow-map-fill";
import { viewSpan } from "@/lib/pixel-scene";
import {
  PATH_FOCUS,
  PATH_FOCUS_ENABLED,
  PATH_FOCUS_MS,
  pathFocusCount,
  pathFocusMark,
  pathFocusOn,
  pathFocusPixels,
} from "@/features/path-focus/path-focus";

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

test("PV-PM-073 and PV-PM-080 keep warm stones still when motion is reduced", () => {
  assert.equal(PATH_FOCUS_ENABLED, true);
  assert.equal(pathFocusOn(), true);
  assert.equal(pathFocusOn(false), false);
  assert.equal(PATH_FOCUS_MS, 30_000);
  assert.equal(pathFocusMark({ elapsedMs: 0, reduced: false }), "pulse");
  assert.equal(pathFocusMark({ elapsedMs: 29_000, reduced: true }), "still");
  assert.equal(pathFocusMark({ elapsedMs: PATH_FOCUS_MS, reduced: false }), "off");
  assert.equal(pathFocusMark({ elapsedMs: -1, reduced: false }), "off");
  assert.equal(pathFocusMark({ elapsedMs: 1000, reduced: false, enabled: false }), "off");

  assert.equal(pathFocusCount("off"), 0);
  assert.equal(pathFocusPixels("pulse", 0, false).length, 0);

  const still = pathFocusPixels("still", 0);
  const later = pathFocusPixels("still", 4);
  assert.deepEqual(still, later);
  assert.equal(still.length, 14);
  assert.equal(still.every((pixel) => Math.abs(pixel.x - PATH_FOCUS.x) <= 80), true);
  assert.equal(still.every((pixel) => pixel.y >= 200 && pixel.y <= 290), true);
  assert.equal(still.every((pixel) => pixel.w <= 6 && pixel.h <= 3), true);

  const pulse = pathFocusPixels("pulse", 0);
  const flipped = pathFocusPixels("pulse", 1.2);
  assert.notDeepEqual(pulse.map((pixel) => pixel.color), flipped.map((pixel) => pixel.color));

  const reduced = pathFocusPixels("still", 0.4);
  assert.deepEqual(reduced.map((pixel) => pixel.color), later.map((pixel) => pixel.color));
  assert.equal(reduced.every((pixel) => pixel.color === "#f2d15c" || pixel.color === "#fff6d8"), true);

  const cam = narrowFillCamera({ people: plotPeople(18), cssW: 390, cssH: 596 });
  assert.ok(cam);
  const span = viewSpan(cam.zoom);
  assert.ok(PATH_FOCUS.x >= cam.x && PATH_FOCUS.x <= cam.x + span.w);
  assert.ok(PATH_FOCUS.y >= cam.y && PATH_FOCUS.y <= cam.y + span.h);
});
