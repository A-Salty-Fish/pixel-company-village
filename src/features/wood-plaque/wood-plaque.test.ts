import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WOOD_PLAQUE_ENABLED, woodPlaqueMark } from "@/features/wood-plaque/wood-plaque";

test("PV-D-024 wood plaques stay square and keep dark ink", () => {
  assert.equal(WOOD_PLAQUE_ENABLED, true);
  assert.equal(woodPlaqueMark(), "plaque");
  assert.equal(woodPlaqueMark(false), "flat");
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-wood-plaque="plaque"/);
  assert.match(css, /border-radius: 0/);
  assert.match(css, /#2a1a10/);
});
