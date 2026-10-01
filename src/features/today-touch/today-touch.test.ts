import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  TODAY_TOUCH_ENABLED,
  TODAY_TOUCH_LINE,
  todayTouchCompletes,
  todayTouchCopy,
  todayTouchKey,
  todayTouchPhase,
} from "@/features/today-touch/today-touch";

test("PV-PM-063 opens a local strip and closes it after one gentle action", () => {
  assert.equal(TODAY_TOUCH_ENABLED, true);
  assert.equal(todayTouchKey("王满"), "village:today-touch-v1:王满");
  assert.equal(todayTouchPhase({ hasSelf: false, storedYmd: null, today: "2026-10-01" }), "off");
  assert.equal(todayTouchPhase({ hasSelf: true, storedYmd: null, today: "2026-10-01" }), "open");
  assert.equal(todayTouchPhase({ hasSelf: true, storedYmd: "2026-10-01", today: "2026-10-01" }), "off");
  assert.equal(todayTouchPhase({ hasSelf: true, storedYmd: "2026-09-30", today: "2026-10-01" }), "open");
  assert.equal(
    todayTouchPhase({ hasSelf: true, storedYmd: null, today: "2026-10-01", justDone: true }),
    "done",
  );
  assert.equal(todayTouchPhase({ hasSelf: true, storedYmd: null, today: "2026-10-01", enabled: false }), "off");
  assert.equal(todayTouchCompletes("find"), true);
  assert.equal(todayTouchCompletes("home"), true);
  assert.equal(todayTouchCompletes("ritual"), true);
  assert.equal(todayTouchCompletes("wave"), false);
  assert.equal(copyIsClean(todayTouchCopy()), true);
  assert.equal(TODAY_TOUCH_LINE.includes("未完成"), false);
  assert.equal(todayTouchCopy().join("").includes("排名"), false);
});
