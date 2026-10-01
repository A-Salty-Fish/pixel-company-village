import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WARM_PLAQUE_ENABLED, warmPlaqueMark } from "@/features/warm-plaque/warm-plaque";

test("PV-PM-071 warms the wood chrome and keeps the dark ink", () => {
  assert.equal(WARM_PLAQUE_ENABLED, true);
  assert.equal(warmPlaqueMark(), "warm");
  assert.equal(warmPlaqueMark(false), "flat");
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-warm-plaque="warm"/);
  assert.match(css, /#8a5528/);
  assert.match(css, /#2a1a10/);
  assert.match(css, /#fff6d8/);
  assert.equal(css.includes("data-warm-plaque=\"warm\"] .hud-btn-ghost"), true);
});
