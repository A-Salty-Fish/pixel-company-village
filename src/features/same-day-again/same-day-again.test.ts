import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  SAME_DAY_AGAIN_ENABLED,
  SAME_DAY_AGAIN_LINE,
  SAME_DAY_AGAIN_MS,
  claimSameDayVisit,
  sameDayCopy,
  sameDayKey,
  sameDayOffer,
} from "@/features/same-day-again/same-day-again";

test("PV-PM-061 shows a short same-day chip and only stores the date", () => {
  assert.equal(SAME_DAY_AGAIN_ENABLED, true);
  assert.equal(SAME_DAY_AGAIN_MS <= 2_000, true);
  assert.equal(SAME_DAY_AGAIN_MS > 0, true);
  assert.equal(sameDayKey("王满"), "village:same-day-v1:王满");
  assert.equal(sameDayOffer({ storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(sameDayOffer({ storedYmd: "2026-09-30", today: "2026-10-01" }), false);
  assert.equal(sameDayOffer({ storedYmd: "2026-10-01", today: "2026-10-01" }), true);
  assert.equal(sameDayOffer({ storedYmd: "2026-10-01", today: "2026-10-01", enabled: false }), false);
  assert.equal(sameDayOffer({ storedYmd: "noon", today: "2026-10-01" }), false);
  assert.equal(claimSameDayVisit("", "2026-10-01"), false);
  assert.equal(copyIsClean(sameDayCopy()), true);
  assert.equal(SAME_DAY_AGAIN_LINE, "又见面了");
});
