import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRESS_FEEL_ENABLED, pressFeelMark } from "@/features/press-feel/press-feel";

test("PV-D-019 map tools and the bottom bar share one press", () => {
  assert.equal(PRESS_FEEL_ENABLED, true);
  assert.equal(pressFeelMark(), "shared");
  assert.equal(pressFeelMark(false), "plain");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-press-feel="shared"/);
  assert.match(css, /\.map-tools \.hud-icon:active:not\(:disabled\)/);
  assert.match(css, /\.thumb-bar \.hud-btn:active:not\(:disabled\)/);
  assert.match(css, /data-reduce-motion="1"\]\[data-press-feel="shared"\]/);
});
