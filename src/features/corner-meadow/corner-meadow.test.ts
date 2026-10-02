import assert from "node:assert/strict";
import test from "node:test";
import { PATH_CLEAR } from "@/features/path-meadow/path-meadow";
import {
  CORNER_MEADOW_ENABLED,
  cornerMeadowAnchors,
  cornerMeadowCount,
  cornerMeadowMark,
  cornerMeadowOn,
  cornerMeadowPixels,
  cornerOnRoad,
  cornerOnWater,
} from "@/features/corner-meadow/corner-meadow";

const WORLD_W = 1216;
const WORLD_H = 1120;

/** Same boxes as hitTest at zoom 1, the widest tap pad. */
function blocksTap(pixel: { x: number; y: number; w: number; h: number }, person: { x: number; y: number }) {
  const pad = 22;
  const left = person.x - 16 - pad;
  const right = person.x + 16 + pad;
  const top = person.y - 40 - pad;
  const bottom = person.y + 8 + pad;
  return pixel.x < right && pixel.x + pixel.w > left && pixel.y < bottom && pixel.y + pixel.h > top;
}

function plotPeople() {
  const people = [];
  for (let index = 0; index < 100; index += 1) {
    const col = index % 10;
    const row = Math.floor(index / 10) % 10;
    people.push({
      x: 32 + col * 112 + (col >= 5 ? 32 : 0) + 64,
      y: 240 + row * 80 + (row >= 5 ? 32 : 0) + 58,
    });
  }
  return people;
}

function crowdsCrossing(x: number, y: number) {
  const margin = 48;
  return (
    x >= PATH_CLEAR.x0 - margin &&
    x <= PATH_CLEAR.x1 + margin &&
    y >= PATH_CLEAR.y0 - margin &&
    y <= PATH_CLEAR.y1 + margin
  );
}

test("PV-PM-077 keeps a few weeds in empty corners", () => {
  assert.equal(CORNER_MEADOW_ENABLED, true);
  assert.equal(cornerMeadowOn(), true);
  assert.equal(cornerMeadowOn(false), false);
  assert.equal(cornerMeadowMark(false), "sway");
  assert.equal(cornerMeadowMark(true), "still");
  assert.equal(cornerMeadowMark(false, false), "off");
  assert.equal(cornerMeadowCount(false, 0, false), 0);
  assert.equal(cornerMeadowAnchors(false).length, 0);

  const anchors = cornerMeadowAnchors();
  assert.equal(anchors.length >= 2 && anchors.length <= 4, true);

  const still = cornerMeadowPixels(true, 0);
  assert.deepEqual(still, cornerMeadowPixels(true, 4));
  assert.equal(still.some((pixel) => pixel.color === "#6a5340"), true);
  assert.equal(still.some((pixel) => pixel.color === "#3f7a3a"), true);

  const sway = cornerMeadowPixels(false, 2.4);
  assert.notDeepEqual(
    still.map((pixel) => pixel.x),
    sway.map((pixel) => pixel.x),
  );

  const people = plotPeople();
  const frames = [cornerMeadowPixels(true, 0), cornerMeadowPixels(false, 0), cornerMeadowPixels(false, 2.4), cornerMeadowPixels(false, 8)];
  for (const pixels of frames) {
    assert.equal(pixels.length > 0 && pixels.length <= 16, true);
    for (const pixel of pixels) {
      assert.equal(pixel.x >= 0 && pixel.y >= 0 && pixel.x + pixel.w < WORLD_W && pixel.y + pixel.h < WORLD_H, true);
      for (let x = pixel.x; x < pixel.x + pixel.w; x += 1) {
        for (let y = pixel.y; y < pixel.y + pixel.h; y += 1) {
          assert.equal(cornerOnRoad(x, y), false);
          assert.equal(cornerOnWater(x, y), false);
          assert.equal(crowdsCrossing(x, y), false);
        }
      }
      assert.equal(people.some((person) => blocksTap(pixel, person)), false);
    }
  }
});
