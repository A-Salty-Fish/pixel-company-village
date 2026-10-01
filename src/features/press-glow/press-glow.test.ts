import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRESS_GLOW_ENABLED, pressGlowMark } from "@/features/press-glow/press-glow";

test("press glow scales with gold, and reduced motion only keeps the gold", () => {
  assert.equal(PRESS_GLOW_ENABLED, true);
  assert.equal(pressGlowMark(false), "press");
  assert.equal(pressGlowMark(true), "still");
  assert.equal(pressGlowMark(false, false), "off");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-press-glow="press"/);
  assert.match(css, /scale\(0\.94\)/);
  assert.match(css, /#ffe56a/);
  assert.match(css, /#e7b14a/);
  assert.match(css, /data-press-glow="still"/);
});
