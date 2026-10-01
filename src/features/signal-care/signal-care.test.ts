import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  SIGNAL_CARE_ENABLED,
  SIGNAL_CARE_LINE,
  signalCareCopy,
  signalCareView,
} from "@/features/signal-care/signal-care";

test("PV-PM-036 shows counts and a care date, and drops anything that is not a date", () => {
  assert.equal(SIGNAL_CARE_ENABLED, true);
  const view = signalCareView({
    days: ["2026-09-02", "他说了你好", "2026-10-01", "chat transcript", "2026-09-02"],
    bondCount: 4.8,
  });
  assert.ok(view);
  assert.equal(view.careCount, 2);
  assert.equal(view.bondCount, 4);
  assert.equal(view.lastDate, "2026年10月1日");
  assert.equal(view.line, SIGNAL_CARE_LINE);
  assert.equal(view.line.includes("他说"), false);
  assert.equal(JSON.stringify(view).includes("他说"), false);
  assert.equal(signalCareView({ days: ["not-a-date"], bondCount: -2 })?.careCount, 0);
  assert.equal(signalCareView({ days: ["not-a-date"], bondCount: -2 })?.bondCount, 0);
  assert.equal(signalCareView({ days: ["not-a-date"], bondCount: -2 })?.lastDate, null);
  assert.equal(signalCareView({ days: ["2026-09-30"], bondCount: 9 })?.bondCount, 6);
  assert.equal(signalCareView({ days: [], bondCount: 1, enabled: false }), null);
  assert.equal(copyIsClean(signalCareCopy(view)), true);
  assert.equal(copyIsClean(signalCareCopy(signalCareView({ days: [], bondCount: 0 }))), true);
});
