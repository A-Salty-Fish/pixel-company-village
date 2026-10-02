import assert from "node:assert/strict";
import test from "node:test";
import {
  SILHOUETTE_RIM_ENABLED,
  villagerSilhouetteMark,
  villagerSilhouetteOn,
  villagerSilhouettePixels,
} from "@/features/villager-silhouette/villager-silhouette";

test("PV-PM-095 keeps a broken rim and a grass shadow, not a box", () => {
  assert.equal(SILHOUETTE_RIM_ENABLED, true);
  assert.equal(villagerSilhouetteOn(), true);
  assert.equal(villagerSilhouetteOn(false), false);
  assert.equal(villagerSilhouetteMark(), "rim");
  assert.equal(villagerSilhouetteMark(false), "off");
  assert.equal(villagerSilhouettePixels(40, 80, false).length, 0);

  const pixels = villagerSilhouettePixels(40, 80);
  assert.equal(pixels.length, 7);
  const shade = pixels.filter((pixel) => pixel.y >= 80);
  const rim = pixels.filter((pixel) => pixel.color.includes("0.7"));
  assert.equal(shade.length, 1);
  assert.equal(shade[0]?.h, 2);
  assert.equal(shade[0]?.w <= 28, true);
  assert.equal(rim.length, 6);
  assert.equal(rim.every((pixel) => pixel.w <= 5 && pixel.h <= 8), true);
  assert.equal(pixels.some((pixel) => pixel.w >= 18 && pixel.h >= 16), false);
  const tops = rim.filter((pixel) => pixel.y === 42);
  assert.equal(tops.length, 2);
  assert.equal(tops[1]!.x - (tops[0]!.x + tops[0]!.w) >= 2, true);
});
