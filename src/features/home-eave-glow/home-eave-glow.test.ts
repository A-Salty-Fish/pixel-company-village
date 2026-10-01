import assert from "node:assert/strict";
import test from "node:test";
import {
  EAVE_FLASH_MS,
  HOME_EAVE_GLOW_ENABLED,
  eaveFlashOn,
  eaveGlowMark,
  eaveGlowPixels,
} from "@/features/home-eave-glow/home-eave-glow";

test("PV-PM-066 breathes on the home pin and flashes when heading home", () => {
  assert.equal(HOME_EAVE_GLOW_ENABLED, true);
  assert.equal(EAVE_FLASH_MS <= 1_000, true);
  assert.equal(eaveGlowMark({ hasSelf: false, flashing: false, reduced: false }), "off");
  assert.equal(eaveGlowMark({ hasSelf: true, flashing: false, reduced: false }), "breath");
  assert.equal(eaveGlowMark({ hasSelf: true, flashing: false, reduced: true }), "still");
  assert.equal(eaveGlowMark({ hasSelf: true, flashing: true, reduced: false }), "flash");
  assert.equal(eaveGlowMark({ hasSelf: true, flashing: true, reduced: true }), "flash");
  assert.equal(eaveGlowMark({ hasSelf: true, flashing: false, reduced: false, enabled: false }), "off");
  assert.equal(eaveFlashOn(1_000, 1_200), true);
  assert.equal(eaveFlashOn(1_000, 1_000 + EAVE_FLASH_MS), false);
  assert.equal(eaveFlashOn(null, 1_000), false);
  const anchor = { x: 80, y: 40 };
  const breathA = eaveGlowPixels(anchor, 0, "breath");
  const breathB = eaveGlowPixels(anchor, 1.2, "breath");
  assert.equal(breathA.length > 0, true);
  assert.notEqual(breathA[0]?.color, breathB[0]?.color);
  const stillA = eaveGlowPixels(anchor, 0, "still");
  const stillB = eaveGlowPixels(anchor, 2, "still");
  assert.deepEqual(stillA, stillB);
  const flash = eaveGlowPixels(anchor, 0, "flash")[0]?.color ?? "";
  const still = stillA[0]?.color ?? "";
  assert.equal(flash.includes("0.950"), true);
  assert.equal(still.includes("0.500"), true);
  assert.equal(eaveGlowPixels(null, 0, "breath").length, 0);
  assert.equal(eaveGlowPixels(anchor, 0, "off").length, 0);
});
