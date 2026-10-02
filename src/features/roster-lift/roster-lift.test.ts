import assert from "node:assert/strict";
import test from "node:test";
import {
  ROSTER_LIFT_ENABLED,
  rosterLiftMark,
  rosterLiftOn,
  rosterLiftsAt,
} from "@/features/roster-lift/roster-lift";

test("PV-PM-106 lifts the roster on a narrow screen", () => {
  assert.equal(ROSTER_LIFT_ENABLED, true);
  assert.equal(rosterLiftOn(false), false);
  assert.equal(rosterLiftMark(), "1");
  assert.equal(rosterLiftMark(false), "0");
  assert.equal(rosterLiftsAt(390), true);
  assert.equal(rosterLiftsAt(480), true);
  assert.equal(rosterLiftsAt(481), false);
  assert.equal(rosterLiftsAt(390, false), false);
});
