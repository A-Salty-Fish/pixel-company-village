import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  NIGHT_LINGER_ENABLED,
  nightCornerFree,
  nightLingerCopy,
  nightLingerKey,
  nightLingerOffer,
  pickNightSpot,
} from "@/features/night-linger/night-linger";

test("PV-PM-059 sits once at night after the ritual, and yields the corner", () => {
  assert.equal(NIGHT_LINGER_ENABLED, true);
  assert.equal(nightLingerKey("王满"), "village:night-linger-v1:王满");
  const ready = { hour: 21, ritualToday: true, storedYmd: null, today: "2026-10-01", blocked: false };
  assert.equal(nightLingerOffer(ready), true);
  assert.equal(nightLingerOffer({ ...ready, hour: 2 }), true);
  assert.equal(nightLingerOffer({ ...ready, hour: 18 }), false);
  assert.equal(nightLingerOffer({ ...ready, hour: 12 }), false);
  assert.equal(nightLingerOffer({ ...ready, ritualToday: false }), false);
  assert.equal(nightLingerOffer({ ...ready, storedYmd: "2026-10-01" }), false);
  assert.equal(nightLingerOffer({ ...ready, blocked: true }), false);
  assert.equal(nightLingerOffer({ ...ready, enabled: false }), false);
  assert.equal(nightCornerFree({ dusk: false, extraWalk: false }), true);
  assert.equal(nightCornerFree({ dusk: true, extraWalk: false }), false);
  assert.equal(nightCornerFree({ dusk: false, extraWalk: true }), false);
  const spot = pickNightSpot({ name: "王满", ymd: "2026-10-01", roof: { homeX: 10, homeY: 20 } });
  assert.equal(pickNightSpot({ name: "王满", ymd: "2026-10-01", roof: { homeX: 10, homeY: 20 } }).id, spot.id);
  if (spot.id === "window") assert.deepEqual({ x: spot.x, y: spot.y }, { x: 58, y: 44 });
  assert.equal(copyIsClean(nightLingerCopy()), true);
});
