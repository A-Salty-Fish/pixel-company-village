import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  NIGHT_LEAVE_ENABLED,
  NIGHT_LEAVE_HOLD_MS,
  NIGHT_LEAVE_LINE,
  nightLeaveCopy,
  nightLeaveKey,
  nightLeaveOffer,
} from "@/features/night-leave/night-leave";

test("PV-PM-065 offers one skippable night line and stays quiet after that", () => {
  assert.equal(NIGHT_LEAVE_ENABLED, true);
  assert.equal(NIGHT_LEAVE_HOLD_MS <= 1_500, true);
  assert.equal(nightLeaveKey("王满"), "village:night-leave-v1:王满");
  assert.equal(nightLeaveKey(""), "village:night-leave-v1:_");
  assert.equal(nightLeaveOffer({ hour: 22, storedYmd: null, today: "2026-10-01" }), true);
  assert.equal(nightLeaveOffer({ hour: 3, storedYmd: null, today: "2026-10-01" }), true);
  assert.equal(nightLeaveOffer({ hour: 12, storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(nightLeaveOffer({ hour: 18, storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(nightLeaveOffer({ hour: 22, storedYmd: "2026-10-01", today: "2026-10-01" }), false);
  assert.equal(nightLeaveOffer({ hour: 22, storedYmd: "2026-09-30", today: "2026-10-01" }), true);
  assert.equal(nightLeaveOffer({ hour: 22, storedYmd: null, today: "2026-10-01", enabled: false }), false);
  assert.equal(copyIsClean(nightLeaveCopy()), true);
  assert.equal(NIGHT_LEAVE_LINE, "路上慢点");
});
