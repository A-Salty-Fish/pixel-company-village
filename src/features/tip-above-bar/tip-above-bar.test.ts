import assert from "node:assert/strict";
import test from "node:test";
import { TIP_BAR_GAP_PX, tipAboveBarMark, tipAboveBarOn, tipClearsBar } from "@/features/tip-above-bar/tip-above-bar";

test("PV-PM-109 keeps the first tip above the bottom bar", () => {
  assert.equal(tipAboveBarOn(), true);
  assert.equal(tipAboveBarOn(false), false);
  assert.equal(tipAboveBarMark(), "1");
  assert.equal(tipAboveBarMark(false), "0");
  assert.equal(TIP_BAR_GAP_PX >= 8, true);
  assert.equal(tipClearsBar(776, 790), true);
  assert.equal(tipClearsBar(784, 790), false);
  assert.equal(tipClearsBar(782, 790, 8), true);
  assert.equal(tipClearsBar(Number.NaN, 790), false);
});
