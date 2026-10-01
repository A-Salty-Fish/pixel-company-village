import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  TODAY_TOUCH_ENABLED,
  TODAY_TOUCH_LINE,
  todayTouchCompletes,
  todayTouchCopy,
  todayTouchKey,
  todayTouchOffer,
} from "@/features/today-touch/today-touch";

test("PV-PM-063 offers one soft strip until find, home, or ritual", () => {
  assert.equal(TODAY_TOUCH_ENABLED, true);
  assert.equal(TODAY_TOUCH_LINE, "今日摸一下村里");
  assert.equal(todayTouchKey("王满"), "village:today-touch-v1:王满");
  assert.equal(todayTouchOffer({ selfName: null, storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(todayTouchOffer({ selfName: "王满", storedYmd: null, today: "2026-10-01" }), true);
  assert.equal(todayTouchOffer({ selfName: "王满", storedYmd: "2026-09-30", today: "2026-10-01" }), true);
  assert.equal(todayTouchOffer({ selfName: "王满", storedYmd: "2026-10-01", today: "2026-10-01" }), false);
  assert.equal(todayTouchOffer({ selfName: "王满", storedYmd: null, today: "2026-10-01", enabled: false }), false);
  assert.equal(todayTouchCompletes("find"), true);
  assert.equal(todayTouchCompletes("home"), true);
  assert.equal(todayTouchCompletes("ritual"), true);
  assert.equal(todayTouchCompletes("wave"), false);
  assert.equal(copyIsClean(todayTouchCopy()), true);
});
