import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  MAP_FIELD_HOLD_ENABLED,
  MAP_FIELD_HOLD_LINE,
  mapFieldHoldOn,
  mapPendingAttr,
} from "@/features/map-field-hold/map-field-hold";

test("PV-PM-104 holds a field placeholder until the map is ready", () => {
  assert.equal(MAP_FIELD_HOLD_ENABLED, true);
  assert.equal(mapFieldHoldOn(false), false);
  assert.equal(mapPendingAttr(false), "1");
  assert.equal(mapPendingAttr(true), "0");
  assert.equal(mapPendingAttr(false, false), "0");
  assert.equal(MAP_FIELD_HOLD_LINE.includes("田"), true);
  assert.equal(copyIsClean([MAP_FIELD_HOLD_LINE]), true);
});
