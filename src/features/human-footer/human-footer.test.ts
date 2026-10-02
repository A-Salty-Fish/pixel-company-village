import assert from "node:assert/strict";
import test from "node:test";
import {
  footerKeepsEngineering,
  footerLine,
  humanFooterMark,
  humanFooterOn,
} from "@/features/human-footer/human-footer";

test("PV-PM-114 speaks one human sentence in the footer", () => {
  assert.equal(humanFooterOn(), true);
  assert.equal(humanFooterOn(false), false);
  assert.equal(humanFooterMark(), "1");
  const line = footerLine();
  assert.equal(line.length > 0, true);
  assert.equal(footerKeepsEngineering(line), false);
  assert.equal(footerLine(false), "");
  assert.equal(footerKeepsEngineering("work / on_task · CREDITS.md · CC0"), true);
});
