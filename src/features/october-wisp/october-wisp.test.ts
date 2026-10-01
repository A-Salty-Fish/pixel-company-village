import assert from "node:assert/strict";
import test from "node:test";
import {
  OCTOBER_WISP_COUNT,
  OCTOBER_WISP_ENABLED,
  OCTOBER_WISP_KEY,
  octoberWispCount,
  octoberWispFrame,
  octoberWispMark,
  octoberWispOn,
  readWispChoice,
} from "@/features/october-wisp/october-wisp";

test("PV-PM-067 drifts a few leaves in October and honors the toggle", () => {
  assert.equal(OCTOBER_WISP_ENABLED, true);
  assert.equal(OCTOBER_WISP_KEY, "village:october-wisp-v1");
  assert.equal(octoberWispOn({ month: 10, stored: null }), true);
  assert.equal(octoberWispOn({ month: 7, stored: null }), false);
  assert.equal(octoberWispOn({ month: 7, stored: "on" }), true);
  assert.equal(octoberWispOn({ month: 10, stored: "off" }), false);
  assert.equal(octoberWispOn({ month: 10, stored: null, enabled: false }), false);
  assert.equal(readWispChoice("on"), "on");
  assert.equal(readWispChoice("off"), "off");
  assert.equal(readWispChoice("maybe"), null);
  assert.equal(octoberWispMark(true, false), "drift");
  assert.equal(octoberWispMark(true, true), "still");
  assert.equal(octoberWispMark(false, false), "off");
  assert.equal(octoberWispCount(true), OCTOBER_WISP_COUNT);
  assert.equal(octoberWispCount(false), 0);
  const moving = octoberWispFrame(false, 1.2);
  const still = octoberWispFrame(true, 4);
  assert.equal(moving.length, OCTOBER_WISP_COUNT * 2);
  assert.equal(still.length, OCTOBER_WISP_COUNT * 2);
  assert.notDeepEqual(moving, octoberWispFrame(false, 3));
  assert.deepEqual(still, octoberWispFrame(true, 0));
  assert.equal(octoberWispFrame(false, 1, false).length, 0);
});
