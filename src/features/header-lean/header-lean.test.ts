import assert from "node:assert/strict";
import test from "node:test";
import {
  VISITOR_LEGEND,
  headerLeanMark,
  headerLeanOn,
  scoreSourceCount,
  showScoreSourceButton,
  visitorLegend,
} from "@/features/header-lean/header-lean";

test("PV-PM-113 keeps the header menu short", () => {
  assert.equal(headerLeanOn(), true);
  assert.equal(headerLeanOn(false), false);
  assert.equal(headerLeanMark(), "1");
  assert.equal(showScoreSourceButton(), false);
  assert.equal(showScoreSourceButton(false), true);
  assert.equal(visitorLegend(false), VISITOR_LEGEND);
  assert.equal(VISITOR_LEGEND.length <= 12, true);
  assert.equal(visitorLegend(true), "");
  assert.equal(visitorLegend(false, false), "");
  assert.equal(scoreSourceCount(["分数从哪来"]), 1);
  assert.equal(scoreSourceCount(["分数从哪来", "分数从哪来"]) <= 1, false);
});
