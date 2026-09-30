import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "./wave-d";
import { BOND_LINES, bondLevel, bondLine, bondNames, bumpBond, dropBond, readBonds } from "./social-bond";

test("a bond steps locally and drops chat-shaped names", () => {
  assert.deepEqual([0, 1, 2, 3, 6].map(bondLevel), [0, 1, 1, 2, 3]);
  const once = bumpBond({}, "林小满");
  assert.equal(once.林小满, 1);
  assert.equal(bondLine(bondLevel(1)), "点过一次头。");
  assert.equal(bumpBond(once, "林小满").林小满, 2);
  assert.equal(bumpBond({ 林小满: 6 }, "林小满").林小满, 6);
  const dropped = dropBond({ 林小满: 1 }, "林小满");
  assert.equal("林小满" in dropped, false);
  const dirty = readBonds({ 林小满: 9, 坏: "聊天原文", 周晚风: 2 });
  assert.equal(dirty.林小满, 6);
  assert.equal(dirty.周晚风, 2);
  assert.equal(JSON.stringify(dirty).includes("原文"), false);
  assert.equal(bondNames(dirty).includes("周晚风"), true);
  assert.equal(copyIsClean(BOND_LINES.filter((line) => line.length > 0)), true);
  assert.equal("名".repeat(25) in bumpBond({}, "名".repeat(25)), false);
});
