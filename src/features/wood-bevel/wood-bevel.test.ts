import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WOOD_BEVEL_ENABLED, woodBevelLayoutSafe, woodBevelMark, woodBevelOn } from "@/features/wood-bevel/wood-bevel";

test("PV-PM-099 cuts a bevel and a fine grain without resizing the panels", () => {
  assert.equal(WOOD_BEVEL_ENABLED, true);
  assert.equal(woodBevelOn(), true);
  assert.equal(woodBevelOn(false), false);
  assert.equal(woodBevelMark(), "cut");
  assert.equal(woodBevelMark(false), "flat");

  const css = readFileSync("src/app/globals.css", "utf8");
  const start = css.indexOf("/* PV-PM-099");
  const end = css.indexOf("/* PV-PM-099 end */");
  assert.equal(start >= 0 && end > start, true);
  const block = css.slice(start, end);
  assert.equal(woodBevelLayoutSafe(block), true);
  assert.match(block, /data-wood-bevel="cut"/);
  assert.match(block, /\.hud-panel/);
  assert.match(block, /inset 1px 1px 0 #fff6d8/);
  assert.match(block, /inset -1px -2px 0/);
  assert.match(block, /repeating-linear-gradient\(90deg/);
  assert.match(block, /repeating-linear-gradient\(180deg/);
  assert.match(block, /#2a1a10|#6a3d18/);
  assert.match(block, /#fff6d8/);
  assert.equal(block.includes("min-height"), false);
  assert.equal(block.includes("@media"), false);

  const page = readFileSync("src/components/village-page.tsx", "utf8");
  assert.match(page, /data-wood-bevel=\{woodBevelMark\(\)\}/);
});
