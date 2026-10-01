import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  HOME_SETTLE_ENABLED,
  HOME_SETTLE_MS,
  HOME_SETTLE_TOAST,
  HOME_WARM_MS,
  homeSettleCopy,
  homeSettleFrame,
  homeWarmOn,
  roofFocus,
} from "@/features/home-settle/home-settle";

test("PV-PM-057 eases home onto the roof and keeps the warm wash brief", () => {
  assert.equal(HOME_SETTLE_ENABLED, true);
  assert.equal(HOME_SETTLE_MS >= 600 && HOME_SETTLE_MS <= 1_000, true);
  assert.equal(HOME_WARM_MS <= 1_200, true);
  assert.deepEqual(roofFocus({ homeX: 10, homeY: 20 }), { x: 58, y: 44 });
  const from = { x: 0, y: 0, zoom: 1 };
  const to = { x: 100, y: 50, zoom: 2 };
  const start = homeSettleFrame({ elapsedMs: 0, from, to });
  assert.equal(start.x, 0);
  assert.equal(start.done, false);
  const mid = homeSettleFrame({ elapsedMs: HOME_SETTLE_MS / 2, from, to });
  assert.equal(mid.x > 0 && mid.x < 100, true);
  const end = homeSettleFrame({ elapsedMs: HOME_SETTLE_MS, from, to });
  assert.equal(end.done, true);
  assert.equal(end.x, 100);
  assert.equal(end.zoom, 2);
  assert.equal(homeWarmOn({ elapsedMs: 0, reduceMotion: false }), true);
  assert.equal(homeWarmOn({ elapsedMs: HOME_WARM_MS, reduceMotion: false }), false);
  assert.equal(homeWarmOn({ elapsedMs: 100, reduceMotion: true }), false);
  assert.equal(homeWarmOn({ elapsedMs: 100, reduceMotion: false, enabled: false }), false);
  assert.equal(copyIsClean(homeSettleCopy()), true);
  assert.equal(HOME_SETTLE_TOAST.length <= 24, true);
});
