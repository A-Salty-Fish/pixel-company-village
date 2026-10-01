import assert from "node:assert/strict";
import test from "node:test";
import { THUMB_IDENTITY_ENABLED, thumbShowsHome, thumbShowsWho } from "@/features/thumb-identity/thumb-identity";

test("guests only get 我是谁 until a name is chosen", () => {
  assert.equal(THUMB_IDENTITY_ENABLED, true);
  assert.equal(thumbShowsHome(false), false);
  assert.equal(thumbShowsHome(true), true);
  assert.equal(thumbShowsWho(), true);
  assert.equal(thumbShowsHome(false, false), true);
});
