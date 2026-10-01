import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTUMN_LEAF_DRIFT_ENABLED,
  LEAF_COUNT,
  autumnLeafCount,
  autumnLeafFrame,
  leafDriftMark,
  leafDriftOn,
} from "@/features/autumn-leaf-drift/autumn-leaf-drift";

test("PV-PM-038 drifts a few leaves on autumn paths and holds them still when motion is reduced", () => {
  assert.equal(AUTUMN_LEAF_DRIFT_ENABLED, true);
  assert.equal(leafDriftOn("autumn"), true);
  assert.equal(leafDriftOn("winter"), false);
  assert.equal(leafDriftOn("autumn", false), false);
  assert.equal(leafDriftMark("autumn", false), "drift");
  assert.equal(leafDriftMark("autumn", true), "still");
  assert.equal(leafDriftMark("spring", false), "off");
  assert.equal(autumnLeafCount("autumn"), LEAF_COUNT);
  assert.equal(autumnLeafCount("summer"), 0);
  assert.equal(autumnLeafFrame("summer", false, 1).length, 0);
  assert.equal(autumnLeafFrame("autumn", false, 0, false).length, 0);
  const start = autumnLeafFrame("autumn", false, 0);
  const later = autumnLeafFrame("autumn", false, 2);
  assert.equal(start.length, LEAF_COUNT * 2);
  assert.notDeepEqual(start, later);
  assert.deepEqual(autumnLeafFrame("autumn", true, 0), autumnLeafFrame("autumn", true, 3));
  assert.equal(start.every((pixel) => pixel.y > 200 && pixel.y < 700), true);
});
