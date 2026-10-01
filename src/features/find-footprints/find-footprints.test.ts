import assert from "node:assert/strict";
import test from "node:test";
import {
  FIND_FOOTPRINTS_ENABLED,
  FIND_PRINT_MAX,
  FIND_PRINT_MIN,
  FIND_PRINT_MS,
  FIND_PRINT_STILL_MS,
  findPrintAlpha,
  findPrintCount,
  findPrintMark,
  findPrintPixels,
} from "@/features/find-footprints/find-footprints";

test("PV-PM-062 leaves a short fading trail after find-me settles", () => {
  assert.equal(FIND_FOOTPRINTS_ENABLED, true);
  assert.equal(FIND_PRINT_MS >= 7_000 && FIND_PRINT_MS <= 9_000, true);
  assert.equal(FIND_PRINT_STILL_MS < FIND_PRINT_MS / 2, true);
  const count = findPrintCount("林小满", false);
  assert.equal(count >= FIND_PRINT_MIN && count <= FIND_PRINT_MAX, true);
  assert.equal(findPrintCount("林小满", true), 1);
  assert.equal(findPrintCount("林小满", false, false), 0);
  assert.equal(findPrintAlpha(0, false) > findPrintAlpha(FIND_PRINT_MS - 1, false), true);
  assert.equal(findPrintAlpha(FIND_PRINT_MS, false), 0);
  assert.equal(findPrintAlpha(FIND_PRINT_STILL_MS, true), 0);
  assert.equal(findPrintAlpha(100, false, false), 0);
  const origin = { x: 200, y: 300 };
  const fresh = findPrintPixels({ origin, name: "林小满", elapsedMs: 0, reduced: false });
  const later = findPrintPixels({ origin, name: "林小满", elapsedMs: 4_000, reduced: false });
  assert.equal(fresh.length, count * 2);
  assert.notEqual(fresh[0]?.color, later[0]?.color);
  assert.equal(fresh[0]?.x, later[0]?.x);
  const still = findPrintPixels({ origin, name: "林小满", elapsedMs: 0, reduced: true });
  const stillLater = findPrintPixels({ origin, name: "林小满", elapsedMs: 400, reduced: true });
  assert.equal(still.length, 2);
  assert.equal(still[0]?.x, stillLater[0]?.x);
  assert.equal(still[0]?.y, stillLater[0]?.y);
  assert.equal(findPrintPixels({ origin, name: "林小满", elapsedMs: FIND_PRINT_MS, reduced: false }).length, 0);
  assert.equal(findPrintMark(1_000, 1_100, false), "live");
  assert.equal(findPrintMark(1_000, 1_100, true), "still");
  assert.equal(findPrintMark(null, 1_100, false), "off");
});
