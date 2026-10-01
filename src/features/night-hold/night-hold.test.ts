import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  NIGHT_HOLD_ENABLED,
  NIGHT_HOLD_KEY,
  NIGHT_HOLD_LINE,
  nightHoldCopy,
  nightHoldOffer,
} from "@/features/night-hold/night-hold";

test("PV-PM-065 offers 路上慢点 once per night", () => {
  assert.equal(NIGHT_HOLD_ENABLED, true);
  assert.equal(NIGHT_HOLD_KEY, "village:night-hold-v1");
  assert.equal(NIGHT_HOLD_LINE, "路上慢点");
  assert.equal(nightHoldOffer({ night: true, storedYmd: null, today: "2026-10-01" }), true);
  assert.equal(nightHoldOffer({ night: true, storedYmd: "2026-09-30", today: "2026-10-01" }), true);
  assert.equal(nightHoldOffer({ night: true, storedYmd: "2026-10-01", today: "2026-10-01" }), false);
  assert.equal(nightHoldOffer({ night: false, storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(nightHoldOffer({ night: true, storedYmd: null, today: "2026-10-01", enabled: false }), false);
  assert.equal(copyIsClean(nightHoldCopy()), true);
});
