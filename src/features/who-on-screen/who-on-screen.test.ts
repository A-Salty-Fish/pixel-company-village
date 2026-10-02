import assert from "node:assert/strict";
import test from "node:test";
import {
  quietLineInView,
  scrollStaysOnScreen,
  whoOnScreenMark,
  whoOnScreenOn,
} from "@/features/who-on-screen/who-on-screen";

test("PV-PM-111 keeps the name picker on this screen", () => {
  assert.equal(whoOnScreenOn(), true);
  assert.equal(whoOnScreenOn(false), false);
  assert.equal(whoOnScreenMark(), "1");
  assert.equal(whoOnScreenMark(false), "0");
  assert.equal(scrollStaysOnScreen(0, 40, 844), true);
  assert.equal(scrollStaysOnScreen(12, 7310, 844), false);
  assert.equal(scrollStaysOnScreen(0, 0, 0), false);
  assert.equal(quietLineInView(7400, 7600, 844), false);
  assert.equal(quietLineInView(200, 280, 844), true);
});
