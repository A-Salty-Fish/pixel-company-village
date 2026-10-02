import assert from "node:assert/strict";
import test from "node:test";
import {
  SHARE_SOLO_DETAILS,
  SHARE_SOLO_LAYER_ENABLED,
  SHARE_SOLO_MAX_PX,
  SHARE_SOLO_PANELS,
  shareSoloActive,
  shareSoloMark,
  shareSoloOn,
} from "@/features/share-solo-layer/share-solo-layer";

test("PV-PM-085 share takes the narrow screen alone", () => {
  assert.equal(SHARE_SOLO_LAYER_ENABLED, true);
  assert.equal(shareSoloOn(), true);
  assert.equal(shareSoloOn(false), false);
  assert.equal(SHARE_SOLO_MAX_PX, 480);
  assert.deepEqual([...SHARE_SOLO_PANELS], ["more", "yard", "legend", "today"]);
  assert.deepEqual([...SHARE_SOLO_DETAILS], ["name-legend", "comfort-settings"]);

  assert.equal(shareSoloActive(true, 390), true);
  assert.equal(shareSoloActive(true, 480), true);
  assert.equal(shareSoloActive(true, 481), false);
  assert.equal(shareSoloActive(false, 390), false);
  assert.equal(shareSoloActive(true, 390, false), false);
  assert.equal(shareSoloMark(true), "1");
  assert.equal(shareSoloMark(false), "0");
});
