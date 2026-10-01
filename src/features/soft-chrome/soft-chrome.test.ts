import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SOFT_CHROME_ENABLED, softChromeMark } from "@/features/soft-chrome/soft-chrome";

test("PV-D-018 soft chrome is on, and the page can fall back to the hard stamp", () => {
  assert.equal(SOFT_CHROME_ENABLED, true);
  assert.equal(softChromeMark(), "soft");
  assert.equal(softChromeMark(false), "hard");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-soft-chrome="soft"/);
  assert.match(css, /#2a1a10/);
  assert.match(css, /#fff6d8/);
});
