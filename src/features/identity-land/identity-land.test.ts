import assert from "node:assert/strict";
import test from "node:test";
import { IDENTITY_LAND_ENABLED, IDENTITY_LAND_MS, identityLandDue } from "@/features/identity-land/identity-land";

test("a new name lands on self within a second", () => {
  assert.equal(IDENTITY_LAND_ENABLED, true);
  assert.ok(IDENTITY_LAND_MS <= 1_000);
  assert.equal(identityLandDue({ previous: null, next: "王满" }), true);
  assert.equal(identityLandDue({ previous: "王满", next: "李里" }), true);
  assert.equal(identityLandDue({ previous: "王满", next: "王满" }), false);
  assert.equal(identityLandDue({ previous: null, next: null }), false);
  assert.equal(identityLandDue({ previous: null, next: "  " }), false);
  assert.equal(identityLandDue({ previous: null, next: "王满", enabled: false }), false);
});
