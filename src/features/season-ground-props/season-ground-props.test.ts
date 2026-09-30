import assert from "node:assert/strict";
import test from "node:test";
import {
  GROUND_CLUSTER_COUNT,
  groundClusterCount,
  groundPropMark,
  groundPropsBlockClicks,
  seasonGroundProps,
} from "@/features/season-ground-props/season-ground-props";

test("season-ground-props stay off in a quiet village and never take clicks", () => {
  assert.equal(groundPropMark("autumn", true), "off");
  assert.equal(groundPropMark("winter", true), "off");
  assert.equal(groundClusterCount("autumn", true), 0);
  assert.equal(seasonGroundProps("autumn", true).length, 0);
  assert.equal(groundPropMark("autumn", false, false), "off");
  assert.equal(groundPropsBlockClicks(), false);
});

test("season-ground-props lay denser leaves and snow tufts that do not move", () => {
  assert.equal(groundPropMark("autumn", false), "leaf");
  assert.equal(groundPropMark("winter", false), "tuft");
  assert.equal(groundPropMark("spring", false), "petal");
  assert.equal(groundPropMark("summer", false), "grass");
  assert.equal(groundClusterCount("autumn", false), GROUND_CLUSTER_COUNT);
  assert.equal(GROUND_CLUSTER_COUNT > 4, true);

  const leaves = seasonGroundProps("autumn", false);
  const snow = seasonGroundProps("winter", false);
  assert.equal(leaves.length, GROUND_CLUSTER_COUNT * 3);
  assert.equal(snow.length, GROUND_CLUSTER_COUNT * 3);
  assert.equal(leaves.length > 4, true);
  assert.equal(leaves.some((pixel) => pixel.color === "#d46a32"), true);
  assert.equal(snow.some((pixel) => pixel.color === "#fff6d8"), true);
  assert.deepEqual(seasonGroundProps("winter", false), snow);
  for (const pixel of leaves) {
    assert.equal(pixel.x > 0 && pixel.y > 0, true);
    assert.equal("id" in pixel, false);
  }
});
