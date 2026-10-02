import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  TIP_AFTER_SELF,
  rectsIntersect,
  tipFollowsMark,
  tipFollowsOn,
  tipForIdentity,
  tipStillClearsBar,
  tipTeachesChooseSelf,
} from "@/features/tip-follows-content/tip-follows-content";

test("PV-PM-117 lets the tip travel and drops 先选定 after a name", () => {
  assert.equal(tipFollowsOn(), true);
  assert.equal(tipFollowsOn(false), false);
  assert.equal(tipFollowsMark(), "1");
  assert.equal(tipFollowsMark(false), "0");
  const before = "先选定「我是谁」。先在地图上找我，或去看村口。";
  assert.equal(tipTeachesChooseSelf(before), true);
  assert.equal(tipForIdentity(before, false), before);
  assert.equal(tipForIdentity(before, true, false), before);
  const after = tipForIdentity(before, true);
  assert.equal(after, TIP_AFTER_SELF);
  assert.equal(tipTeachesChooseSelf(after), false);
  assert.equal(after.includes("去看村口"), false);
  assert.equal(tipForIdentity("做一件院里的事，或点一项本周小事。", true), "做一件院里的事，或点一项本周小事。");
  assert.equal(tipStillClearsBar(760, 779), true);
  assert.equal(tipStillClearsBar(776, 779), false);
  assert.equal(rectsIntersect({ top: 10, right: 40, bottom: 30, left: 8 }, { top: 20, right: 50, bottom: 48, left: 12 }), true);
  assert.equal(rectsIntersect({ top: 10, right: 40, bottom: 20, left: 8 }, { top: 24, right: 50, bottom: 48, left: 12 }), false);
  assert.equal(copyIsClean([before, after, "减少动作和安静村子在这里。"]), true);
});
