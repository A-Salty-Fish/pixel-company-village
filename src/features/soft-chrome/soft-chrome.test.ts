import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SOFT_CHROME_ENABLED, softChromeMark } from "@/features/soft-chrome/soft-chrome";

test("soft chrome is on and the sheet no longer scrolls like a panel", () => {
  assert.equal(SOFT_CHROME_ENABLED, true);
  assert.equal(softChromeMark(), "soft");
  assert.equal(softChromeMark(false), "off");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-soft-chrome="soft"/);
  assert.match(css, /\.map-more-sheet \{[^}]*overflow: hidden/s);
  assert.match(css, /255 246 216 \/ 94%/);
});
