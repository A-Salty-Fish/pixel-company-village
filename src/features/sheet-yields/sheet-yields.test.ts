import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SHEET_YIELDS_ENABLED,
  sheetYieldsMark,
  sheetYieldsOn,
  sheetYieldsToStrip,
} from "@/features/sheet-yields/sheet-yields";

test("PV-PM-123 lets the more sheet yield to the first-run strip", () => {
  assert.equal(SHEET_YIELDS_ENABLED, true);
  assert.equal(sheetYieldsOn(), true);
  assert.equal(sheetYieldsOn(false), false);
  assert.equal(sheetYieldsMark(), "1");
  assert.equal(sheetYieldsMark(false), "0");
  assert.equal(sheetYieldsToStrip(true), true);
  assert.equal(sheetYieldsToStrip(false), false);
  assert.equal(sheetYieldsToStrip(true, false), false);

  const css = readFileSync("src/app/globals.css", "utf8");
  const block = css.match(/data-sheet-yield="1"[\s\S]*?\.map-more-sheet\s*\{([^}]*)\}/);
  assert.ok(block?.[1]);
  assert.match(block[1], /top:\s*0\.45rem/);
  assert.match(block[1], /bottom:\s*auto/);
  assert.match(block[1], /height:\s*max-content/);
  assert.match(css, /first-run-guide/);
});
