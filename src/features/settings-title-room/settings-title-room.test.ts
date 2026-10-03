import assert from "node:assert/strict";
import test from "node:test";
import {
  SETTINGS_TITLE_ROOM_ENABLED,
  overlapHeight,
  settingsTitleRoomMark,
  settingsTitleRoomOn,
} from "@/features/settings-title-room/settings-title-room";

test("PV-PM-120 keeps the motion line off the settings title", () => {
  assert.equal(SETTINGS_TITLE_ROOM_ENABLED, true);
  assert.equal(settingsTitleRoomOn(), true);
  assert.equal(settingsTitleRoomOn(false), false);
  assert.equal(settingsTitleRoomMark(), "1");
  assert.equal(settingsTitleRoomMark(false), "0");
  const title = { top: 400, right: 96, bottom: 444, left: 16 };
  const beside = { top: 404, right: 360, bottom: 436, left: 140 };
  const covering = { top: 402, right: 360, bottom: 444, left: 20 };
  assert.equal(overlapHeight(title, beside), 0);
  assert.equal(overlapHeight(title, covering), 42);
  assert.equal(overlapHeight(title, { top: 444, right: 200, bottom: 480, left: 16 }), 0);
});
