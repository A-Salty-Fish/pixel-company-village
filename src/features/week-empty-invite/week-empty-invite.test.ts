import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  WEEK_EMPTY_INVITE_ENABLED,
  WEEK_INVITE_LINE,
  weekInviteCopy,
  weekInviteOn,
  weekInviteOpensList,
  weekInviteShows,
} from "@/features/week-empty-invite/week-empty-invite";

test("PV-PM-105 invites when the week is still empty", () => {
  assert.equal(WEEK_EMPTY_INVITE_ENABLED, true);
  assert.equal(weekInviteOn(false), false);
  assert.equal(weekInviteShows(0, true), true);
  assert.equal(weekInviteShows(1, true), false);
  assert.equal(weekInviteShows(0, false), false);
  assert.equal(weekInviteShows(0, true, false), false);
  const line = weekInviteCopy(true);
  assert.equal(line, WEEK_INVITE_LINE);
  assert.equal(/\d/.test(line), false);
  assert.equal(weekInviteOpensList(true, true), true);
  assert.equal(weekInviteOpensList(false, true), false);
  assert.equal(copyIsClean([line]), true);
});
