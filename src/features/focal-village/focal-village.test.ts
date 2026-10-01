import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FOCAL_VILLAGE_ENABLED, focalVillageMark } from "@/features/focal-village/focal-village";

test("PV-D-025 the first screen is the village, without the sky stripe", () => {
  assert.equal(FOCAL_VILLAGE_ENABLED, true);
  assert.equal(focalVillageMark(), "village");
  assert.equal(focalVillageMark(false), "chrome");
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-focal-village="village"/);
  assert.match(css, /background-image: none/);
});
