import assert from "node:assert/strict";
import test from "node:test";
import {
  MORE_LEAN_ADDS,
  intersectionArea,
  moreLeanMark,
  moreLeanOn,
  moreSheetHidesToday,
  toolbarClear,
} from "@/features/more-lean/more-lean";

test("PV-PM-115 keeps 更多 to legend, yard, and nameplates", () => {
  assert.equal(moreLeanOn(), true);
  assert.equal(moreLeanOn(false), false);
  assert.equal(moreLeanMark(), "1");
  assert.equal(moreSheetHidesToday(), true);
  assert.equal(moreSheetHidesToday(false), false);
  assert.deepEqual([...MORE_LEAN_ADDS], ["图例", "院子", "全显名牌"]);
  assert.equal(intersectionArea({ left: 0, top: 0, right: 40, bottom: 40 }, { left: 40, top: 0, right: 80, bottom: 40 }), 0);
  assert.equal(intersectionArea({ left: 0, top: 0, right: 40, bottom: 40 }, { left: 20, top: 20, right: 50, bottom: 50 }) > 0, true);
  assert.equal(
    toolbarClear([
      { left: 0, top: 0, right: 44, bottom: 44 },
      { left: 48, top: 0, right: 92, bottom: 44 },
    ]),
    true,
  );
  assert.equal(
    toolbarClear([
      { left: 0, top: 0, right: 44, bottom: 44 },
      { left: 20, top: 10, right: 64, bottom: 54 },
    ]),
    false,
  );
});
