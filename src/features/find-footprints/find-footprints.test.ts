import assert from "node:assert/strict";
import test from "node:test";
import {
  FIND_FOOTPRINT_COUNT,
  FIND_FOOTPRINT_MS,
  FIND_FOOTPRINT_REDUCED_COUNT,
  FIND_FOOTPRINT_REDUCED_MS,
  FIND_FOOTPRINTS_ENABLED,
  FIND_SETTLE_MS,
  findFootprintCount,
  findFootprintMark,
  findFootprintPixels,
} from "@/features/find-footprints/find-footprints";

test("PV-PM-062 leaves a few footprints after 找我 settles", () => {
  assert.equal(FIND_FOOTPRINTS_ENABLED, true);
  assert.equal(FIND_FOOTPRINT_COUNT >= 3 && FIND_FOOTPRINT_COUNT <= 5, true);
  assert.equal(FIND_FOOTPRINT_MS, 8_000);
  assert.equal(findFootprintMark(0, false), "wait");
  assert.equal(findFootprintMark(FIND_SETTLE_MS, false), "show");
  assert.equal(findFootprintMark(FIND_SETTLE_MS + FIND_FOOTPRINT_MS, false), "off");
  assert.equal(findFootprintCount(false), FIND_FOOTPRINT_COUNT);
  assert.equal(findFootprintCount(true), FIND_FOOTPRINT_REDUCED_COUNT);
  assert.equal(findFootprintCount(false, false), 0);
  const shown = findFootprintPixels(100, 200, FIND_SETTLE_MS + 100, false);
  assert.equal(shown.length, FIND_FOOTPRINT_COUNT * 2);
  assert.equal(findFootprintPixels(100, 200, 0, false).length, 0);
  const still = findFootprintPixels(100, 200, FIND_SETTLE_MS + 50, true);
  assert.equal(still.length, FIND_FOOTPRINT_REDUCED_COUNT * 2);
  assert.equal(findFootprintMark(FIND_SETTLE_MS + FIND_FOOTPRINT_REDUCED_MS, true), "off");
  assert.equal(findFootprintPixels(100, 200, FIND_SETTLE_MS, false, false).length, 0);
  const early = shown[0]?.color ?? "";
  const late = findFootprintPixels(100, 200, FIND_SETTLE_MS + FIND_FOOTPRINT_MS - 1, false)[0]?.color ?? "";
  assert.notEqual(early, late);
});
