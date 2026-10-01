import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  DAWN_PORCH_ENABLED,
  dawnPanTarget,
  dawnPorchCopy,
  dawnPorchOffer,
  isMorning,
  pickDawnSpot,
} from "@/features/dawn-porch/dawn-porch";

test("PV-PM-056 speaks once in the morning, and midday and night stay quiet", () => {
  assert.equal(DAWN_PORCH_ENABLED, true);
  assert.equal(isMorning(5), true);
  assert.equal(isMorning(10), true);
  assert.equal(isMorning(4), false);
  assert.equal(isMorning(11), false);
  assert.equal(dawnPorchOffer({ hour: 7, alreadyShown: false }), true);
  assert.equal(dawnPorchOffer({ hour: 10, alreadyShown: false }), true);
  assert.equal(dawnPorchOffer({ hour: 7, alreadyShown: true }), false);
  assert.equal(dawnPorchOffer({ hour: 12, alreadyShown: false }), false);
  assert.equal(dawnPorchOffer({ hour: 16, alreadyShown: false }), false);
  assert.equal(dawnPorchOffer({ hour: 18, alreadyShown: false }), false);
  assert.equal(dawnPorchOffer({ hour: 22, alreadyShown: false }), false);
  assert.equal(dawnPorchOffer({ hour: 8, alreadyShown: false, enabled: false }), false);
  const spot = pickDawnSpot("2026-10-01");
  assert.equal(pickDawnSpot("2026-10-01").id, spot.id);
  const porch = dawnPanTarget({ id: "lamp", label: "门灯还亮着", x: 1, y: 2 }, { homeX: 40, homeY: 50 });
  assert.deepEqual(porch, { x: 88, y: 74 });
  const field = dawnPanTarget({ id: "dew", label: "露水还在田边", x: 300, y: 560 }, { homeX: 40, homeY: 50 });
  assert.deepEqual(field, { x: 300, y: 560 });
  assert.equal(copyIsClean(dawnPorchCopy()), true);
});
