import assert from "node:assert/strict";
import test from "node:test";
import { HOME_BREATH_ENABLED, HOME_FLASH_MS, homeBreathMark, homeBreathPixels } from "@/features/home-breath/home-breath";

test("PV-PM-066 breathes on the roof pin and flashes once for 回家", () => {
  assert.equal(HOME_BREATH_ENABLED, true);
  assert.equal(HOME_FLASH_MS <= 1_000, true);
  assert.equal(homeBreathMark({ hasSelf: false, flashAt: null, now: 0 }), "off");
  assert.equal(homeBreathMark({ hasSelf: true, flashAt: null, now: 0 }), "glow");
  assert.equal(homeBreathMark({ hasSelf: true, flashAt: 1_000, now: 1_200 }), "flash");
  assert.equal(homeBreathMark({ hasSelf: true, flashAt: 1_000, now: 1_000 + HOME_FLASH_MS }), "glow");
  assert.equal(homeBreathMark({ hasSelf: true, flashAt: null, now: 0, enabled: false }), "off");
  assert.equal(homeBreathPixels(null, 0, "glow", false).length, 0);
  assert.equal(homeBreathPixels({ x: 40, y: 80 }, 0, "off", false).length, 0);
  const glow = homeBreathPixels({ x: 40, y: 80 }, 0, "glow", true);
  const flash = homeBreathPixels({ x: 40, y: 80 }, 0, "flash", true);
  assert.equal(glow.length > 0, true);
  assert.equal(flash.some((pixel) => pixel.color === "#fff6d8"), true);
  assert.equal(glow.some((pixel) => pixel.color === "#fff6d8"), false);
});
