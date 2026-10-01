import assert from "node:assert/strict";
import test from "node:test";
import {
  PATH_CLEAR,
  PATH_MEADOW_ENABLED,
  pathMeadowAnchors,
  pathMeadowCount,
  pathMeadowMark,
  pathMeadowOn,
  pathMeadowPixels,
} from "@/features/path-meadow/path-meadow";

/** Grass just outside a path tile, not on the walk itself. */
function besidePath(x: number, y: number) {
  const north = y >= 188 && y <= 268 && (y < 208 || y > 240);
  const vertical = x >= 548 && x <= 668 && y >= 268 && y <= 1100 && (x < 592 || x > 624);
  const south = y >= 612 && y <= 700 && (y < 640 || y > 672);
  return north || vertical || south;
}

test("PV-PM-068 puts a few flowers beside the paths and leaves the crossing clear", () => {
  assert.equal(PATH_MEADOW_ENABLED, true);
  assert.equal(pathMeadowOn(), true);
  assert.equal(pathMeadowOn(false), false);
  assert.equal(pathMeadowMark(), "edged");
  assert.equal(pathMeadowMark(false), "bare");
  assert.equal(pathMeadowCount(false), 0);
  assert.equal(pathMeadowAnchors(false).length, 0);

  const anchors = pathMeadowAnchors();
  assert.equal(anchors.length >= 16 && anchors.length <= 24, true);
  assert.equal(anchors.some((anchor) => anchor.kind === "flower"), true);
  assert.equal(anchors.some((anchor) => anchor.kind === "tuft"), true);
  for (const anchor of anchors) {
    assert.equal(besidePath(anchor.x, anchor.y), true);
    const inClear =
      anchor.x >= PATH_CLEAR.x0 &&
      anchor.x <= PATH_CLEAR.x1 &&
      anchor.y >= PATH_CLEAR.y0 &&
      anchor.y <= PATH_CLEAR.y1;
    assert.equal(inClear, false);
    const onPond = anchor.x >= 32 && anchor.x <= 224 && anchor.y >= 32 && anchor.y <= 128;
    assert.equal(onPond, false);
  }

  const pixels = pathMeadowPixels();
  assert.equal(pathMeadowCount(), pixels.length);
  assert.equal(pixels.length < 80, true);
  assert.equal(pixels.every((pixel) => pixel.w <= 3 && pixel.h <= 5), true);
  assert.equal(pixels.every((pixel) => pixel.x >= 0 && pixel.x < 1216 && pixel.y >= 0 && pixel.y < 1120), true);
});
