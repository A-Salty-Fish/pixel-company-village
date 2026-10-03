import assert from "node:assert/strict";
import test from "node:test";
import { isToyId } from "@/features/yard-toy-focus/yard-toy-focus";
import {
  LANTERN_INVITE_AIM,
  LANTERN_INVITE_FRAME_ENABLED,
  lanternInviteFollow,
  lanternInviteFrameMark,
  lanternInviteFrameOn,
} from "@/features/lantern-invite-frame/lantern-invite-frame";

test("PV-PM-121 frames the lantern without the yard counts", () => {
  assert.equal(LANTERN_INVITE_FRAME_ENABLED, true);
  assert.equal(lanternInviteFrameOn(), true);
  assert.equal(lanternInviteFrameOn(false), false);
  assert.equal(lanternInviteFrameMark(), "1");
  assert.equal(lanternInviteFrameMark(false), "0");

  const follow = lanternInviteFollow();
  assert.equal(follow.openYard, false);
  assert.equal(follow.aimKind, LANTERN_INVITE_AIM);
  assert.equal(isToyId(follow.aimKind), false);

  const legacy = lanternInviteFollow(false);
  assert.equal(legacy.openYard, true);
  assert.equal(legacy.aimKind, "lantern");
  assert.equal(isToyId(legacy.aimKind), true);
});
