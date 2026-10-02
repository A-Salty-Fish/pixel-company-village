import assert from "node:assert/strict";
import test from "node:test";
import { PATH_CLEAR } from "@/features/path-meadow/path-meadow";
import {
  CORNER_PROPS_ENABLED,
  cornerPropAnchors,
  cornerPropClear,
  cornerPropCount,
  cornerPropPixels,
  cornerPropsMark,
  cornerPropsOn,
} from "@/features/corner-props/corner-props";

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

test("PV-PM-100 keeps two or three props off the roads", () => {
  assert.equal(CORNER_PROPS_ENABLED, true);
  assert.equal(cornerPropsOn(), true);
  assert.equal(cornerPropsOn(false), false);
  assert.equal(cornerPropsMark(), "sparse");
  assert.equal(cornerPropsMark(false), "bare");
  assert.equal(cornerPropCount(false), 0);
  assert.equal(cornerPropAnchors(false).length, 0);

  const anchors = cornerPropAnchors();
  assert.equal(anchors.length >= 2 && anchors.length <= 3, true);
  assert.equal(anchors.filter((prop) => prop.kind === "post").length >= 1, true);
  assert.equal(anchors.filter((prop) => prop.kind === "flowers").length >= 1, true);

  const people = plotPeople();
  const pixels = cornerPropPixels();
  assert.equal(pixels.length > 0 && pixels.length <= 18, true);
  for (const pixel of pixels) {
    assert.equal(pixel.x >= 0 && pixel.y >= 0 && pixel.x + pixel.w < WORLD_W && pixel.y + pixel.h < WORLD_H, true);
    for (let x = pixel.x; x < pixel.x + pixel.w; x += 1) {
      for (let y = pixel.y; y < pixel.y + pixel.h; y += 1) {
        assert.equal(cornerPropClear(x, y), true);
        const margin = 36;
        const crowds =
          x >= PATH_CLEAR.x0 - margin &&
          x <= PATH_CLEAR.x1 + margin &&
          y >= PATH_CLEAR.y0 - margin &&
          y <= PATH_CLEAR.y1 + margin;
        assert.equal(crowds, false);
      }
    }
    assert.equal(people.some((person) => blocksTap(pixel, person)), false);
  }
});
