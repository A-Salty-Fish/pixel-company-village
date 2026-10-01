import assert from "node:assert/strict";
import test from "node:test";
import {
  VILLAGER_READ_ENABLED,
  villagerIdleBob,
  villagerReadMark,
  villagerReadOn,
  villagerShadowPixels,
} from "@/features/villager-read/villager-read";

test("PV-D-023 stands people on an oval shadow and lifts idle cats one pixel", () => {
  assert.equal(VILLAGER_READ_ENABLED, true);
  assert.equal(villagerReadOn(), true);
  assert.equal(villagerReadOn(false), false);
  assert.equal(villagerReadMark(), "stood");
  assert.equal(villagerReadMark(false), "stamp");

  assert.equal(villagerIdleBob({ t: 0, reduced: false, selected: false }), 0);
  assert.equal(villagerIdleBob({ t: 1, reduced: false, selected: false }), 1);
  assert.equal(villagerIdleBob({ t: 1, reduced: true, selected: false }), 0);
  assert.equal(villagerIdleBob({ t: 1, reduced: false, selected: true }), 0);
  assert.equal(villagerIdleBob({ t: 1, reduced: false, selected: false, enabled: false }), 0);

  const shadow = villagerShadowPixels(40, 80);
  assert.equal(shadow.length, 3);
  assert.equal(Math.max(...shadow.map((pixel) => pixel.w)) >= 16, true);
  assert.equal(shadow.every((pixel) => pixel.h <= 2), true);
  assert.equal(villagerShadowPixels(40, 80, false).length, 0);
});
