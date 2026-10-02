import assert from "node:assert/strict";
import test from "node:test";
import {
  reachesWithinScreens,
  rosterMoreLabel,
  rosterShortList,
  rosterShortMark,
  rosterShortOn,
} from "@/features/roster-short-cut/roster-short-cut";

test("PV-PM-112 folds the roster to self, scores, and the rest", () => {
  assert.equal(rosterShortOn(), true);
  assert.equal(rosterShortOn(false), false);
  assert.equal(rosterShortMark(), "1");
  const people = [
    { name: "甲", scored: true },
    { name: "乙", scored: false },
    { name: "丙", scored: true },
    { name: "丁", scored: false },
  ];
  const folded = rosterShortList(people, "丙", false);
  assert.equal(folded.folded, true);
  assert.deepEqual(folded.shown.map((person) => person.name), ["丙", "甲"]);
  assert.equal(folded.hidden, 2);
  assert.equal(rosterMoreLabel(folded.hidden), "还有 2 人");
  const open = rosterShortList(people, "丙", true);
  assert.equal(open.folded, false);
  assert.equal(open.shown.length, 4);
  assert.equal(rosterShortList(people, null, false, false).folded, false);
  assert.equal(reachesWithinScreens(1400, 844), true);
  assert.equal(reachesWithinScreens(6662, 844), false);
});
