import assert from "node:assert/strict";
import test from "node:test";
import {
  AMBIENT_INSECTS,
  AMBIENT_SPARKS,
  ambientLifeMark,
  ambientPixels,
  ambientSpeckCount,
  ambientSpecks,
} from "@/features/ambient-life/ambient-life";

test("ambient-life stays off unless the village is awake and moving", () => {
  assert.equal(ambientLifeMark(true, false), "off");
  assert.equal(ambientLifeMark(false, true), "off");
  assert.equal(ambientLifeMark(true, true), "off");
  assert.equal(ambientLifeMark(false, false), "on");
  assert.equal(ambientLifeMark(false, false, false), "off");
  assert.equal(ambientSpeckCount(true, false), 0);
  assert.equal(ambientSpeckCount(false, true), 0);
  assert.equal(ambientPixels([], 3).length, 0);
});

test("ambient-life is a handful of sparkles and insects, with no text", () => {
  const specks = ambientSpecks(false, false);
  assert.equal(specks.length, AMBIENT_SPARKS + AMBIENT_INSECTS);
  assert.equal(specks.length <= 6, true);
  assert.equal(specks.filter((speck) => speck.kind === "spark").length, AMBIENT_SPARKS);
  assert.equal(specks.filter((speck) => speck.kind === "insect").length, AMBIENT_INSECTS);
  for (const speck of specks) {
    assert.equal(speck.x > 0 && speck.x < 1216, true);
    assert.equal(speck.y > 0 && speck.y < 1120, true);
    assert.equal("text" in speck, false);
  }
  const still = ambientPixels(specks, 0);
  const later = ambientPixels(specks, 1.2);
  assert.equal(still.length > 0, true);
  assert.notDeepEqual(still, later);
  assert.equal(JSON.stringify(still).includes("说"), false);
});
