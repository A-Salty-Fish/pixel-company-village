import assert from "node:assert/strict";
import test from "node:test";
import { layoutClearPlates } from "@/features/nameplate-clear/nameplate-clear";
import {
  NAMEPLATE_AIR_ENABLED,
  NAMEPLATE_GAP,
  NAMEPLATE_GAP_TIGHT,
  NAMEPLATE_TRACKING,
  glyphOffsets,
  nameplateAirMark,
  nameplateGap,
  nameplateTracking,
  trackedSpan,
} from "@/features/nameplate-air/nameplate-air";

test("PV-D-020 nameplates track one pixel and step farther apart", () => {
  assert.equal(NAMEPLATE_AIR_ENABLED, true);
  assert.equal(NAMEPLATE_TRACKING, 1);
  assert.equal(nameplateAirMark(), "air");
  assert.equal(nameplateAirMark(false), "tight");
  assert.equal(nameplateTracking(), 1);
  assert.equal(nameplateTracking(false), 0);
  assert.equal(nameplateGap(), NAMEPLATE_GAP);
  assert.equal(nameplateGap(false), NAMEPLATE_GAP_TIGHT);

  assert.deepEqual(glyphOffsets([12, 12, 12], 1), [0, 13, 26]);
  assert.equal(trackedSpan([12, 12, 12], 1), 38);
  assert.equal(trackedSpan([12], 1), 12);
  assert.equal(trackedSpan([], 1), 0);
  assert.deepEqual(glyphOffsets([12, 12], 0), [0, 12]);

  const stacked = [
    { id: "self", role: "self" as const, x: 8, y: 8, w: 40, h: 16, dist: 0 },
    { id: "pin", role: "pinned" as const, x: 12, y: 10, w: 40, h: 16, dist: 4 },
  ];
  const tight = layoutClearPlates(stacked, { viewW: 320, viewH: 200, gap: NAMEPLATE_GAP_TIGHT });
  const airy = layoutClearPlates(stacked, { viewW: 320, viewH: 200, gap: NAMEPLATE_GAP });
  assert.equal(tight.get("pin")?.draw, true);
  assert.equal(airy.get("pin")?.draw, true);
  assert.equal((airy.get("pin")?.y ?? 0) - (tight.get("pin")?.y ?? 0), NAMEPLATE_GAP - NAMEPLATE_GAP_TIGHT);
});
