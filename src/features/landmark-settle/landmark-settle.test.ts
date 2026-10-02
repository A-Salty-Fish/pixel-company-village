import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LANDMARK_SETTLE_ENABLED,
  LANDMARK_SETTLE_MS,
  NARROW_SETTLE_WIDTH,
  landmarkSettleEase,
  landmarkSettleFrame,
  landmarkSettleMode,
  landmarkSettleNarrow,
} from "@/features/landmark-settle/landmark-settle";

test("LANDMARK_SETTLE eases onto a landmark and snaps still when quiet", () => {
  assert.equal(LANDMARK_SETTLE_ENABLED, true);
  assert.equal(LANDMARK_SETTLE_MS >= 360 && LANDMARK_SETTLE_MS <= 640, true);
  assert.equal(NARROW_SETTLE_WIDTH, 390);
  assert.equal(landmarkSettleMode({ quiet: false }), "ease");
  assert.equal(landmarkSettleMode({ quiet: true }), "still");
  assert.equal(landmarkSettleMode({ quiet: false, reduced: true }), "still");
  assert.equal(landmarkSettleMode({ quiet: false, enabled: false }), "off");
  assert.equal(landmarkSettleNarrow(390), true);
  assert.equal(landmarkSettleNarrow(391), false);
  assert.equal(landmarkSettleNarrow(0), false);

  assert.equal(landmarkSettleEase(0), 0);
  assert.equal(landmarkSettleEase(1), 1);
  const mid = landmarkSettleEase(0.5);
  assert.equal(mid > 0.4 && mid < 0.6, true);

  const from = { x: 0, y: 10 };
  const to = { x: 100, y: 40 };
  const start = landmarkSettleFrame({ elapsedMs: 0, narrow: false, from, to });
  assert.equal(start.done, false);
  assert.equal(start.x, 0);
  const halfway = landmarkSettleFrame({ elapsedMs: LANDMARK_SETTLE_MS / 2, narrow: false, from, to });
  assert.equal(halfway.x > 40 && halfway.x < 60, true);
  const end = landmarkSettleFrame({ elapsedMs: LANDMARK_SETTLE_MS, narrow: false, from, to });
  assert.equal(end.done, true);
  assert.equal(end.x, 100);
  assert.equal(end.y, 40);

  const narrow = landmarkSettleFrame({ elapsedMs: LANDMARK_SETTLE_MS / 2, narrow: true, from, to });
  assert.equal(Number.isInteger(narrow.x), true);
  assert.equal(Number.isInteger(narrow.y), true);
  const jumped = landmarkSettleFrame({ elapsedMs: Number.NaN, narrow: true, from, to });
  assert.equal(jumped.done, true);
  assert.equal(jumped.x, 100);

  const scene = readFileSync("src/components/village-scene.tsx", "utf8");
  assert.match(scene, /landmarkSettleFrame/);
  assert.match(scene, /landmarkSettleMode/);
  assert.match(scene, /data-landmark-settle/);
});
