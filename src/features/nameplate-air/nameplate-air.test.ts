import assert from "node:assert/strict";
import test from "node:test";
import {
  NAMEPLATE_AIR_ENABLED,
  NAMEPLATE_TRACK_PX,
  nameplateAirAlpha,
  nameplateTrack,
  shortPlateAlpha,
} from "@/features/nameplate-air/nameplate-air";

test("nameplates gain a pixel of air and far plates step back", () => {
  assert.equal(NAMEPLATE_AIR_ENABLED, true);
  assert.equal(NAMEPLATE_TRACK_PX, 1);
  assert.equal(nameplateTrack(), 1);
  assert.equal(nameplateTrack(false), 0);
  assert.equal(nameplateAirAlpha("self"), 1);
  assert.equal(nameplateAirAlpha("pinned"), 1);
  assert.equal(nameplateAirAlpha("neighbor"), 0.92);
  assert.equal(nameplateAirAlpha("scored"), 0.84);
  assert.equal(nameplateAirAlpha("other"), 0.72);
  assert.equal(nameplateAirAlpha("other", false), 1);
  assert.equal(shortPlateAlpha(0.86), 0.86 * 0.82);
  assert.equal(shortPlateAlpha(0.86, false), 0.86);
});
