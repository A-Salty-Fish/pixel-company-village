import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  AGAIN_TODAY_ENABLED,
  AGAIN_TODAY_KEY,
  AGAIN_TODAY_LINE,
  AGAIN_TODAY_MS,
  againTodayCopy,
  againTodayOffer,
  againTodayVisit,
  resetAgainTodayVisit,
} from "@/features/again-today/again-today";

test("PV-PM-061 shows 又见面了 only when the stored day is already today", () => {
  assert.equal(AGAIN_TODAY_ENABLED, true);
  assert.equal(AGAIN_TODAY_KEY, "village:again-today-v1");
  assert.equal(AGAIN_TODAY_LINE, "又见面了");
  assert.equal(AGAIN_TODAY_MS <= 2_000, true);
  assert.equal(againTodayOffer({ storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(againTodayOffer({ storedYmd: "2026-09-30", today: "2026-10-01" }), false);
  assert.equal(againTodayOffer({ storedYmd: "2026-10-01", today: "2026-10-01" }), true);
  assert.equal(againTodayOffer({ storedYmd: "2026-10-01", today: "2026-10-01", enabled: false }), false);
  assert.equal(againTodayOffer({ storedYmd: "nope", today: "2026-10-01" }), false);
  resetAgainTodayVisit();
  assert.equal(againTodayVisit("2026-10-01", null), false);
  assert.equal(againTodayVisit("2026-10-01", "2026-10-01"), false);
  resetAgainTodayVisit();
  assert.equal(againTodayVisit("2026-10-01", "2026-10-01"), true);
  assert.equal(copyIsClean(againTodayCopy()), true);
});
