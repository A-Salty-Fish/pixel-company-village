import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  WAVE_GIFT_DELAY_MS,
  WAVE_GIFT_ENABLED,
  WAVE_GIFT_FADE_MS,
  WAVE_GIFT_HOLD_MS,
  WAVE_GIFT_MOTION_MS,
  WAVE_GIFT_OPEN_MS,
  waveGiftPhase,
  waveGiftVisible,
  wavePressMark,
} from "@/features/wave-gift/wave-gift";

test("WAVE_GIFT opens the receipt like a gift and is still at once when quiet", () => {
  assert.equal(WAVE_GIFT_ENABLED, true);
  assert.equal(WAVE_GIFT_DELAY_MS >= 120 && WAVE_GIFT_DELAY_MS <= 280, true);
  assert.equal(WAVE_GIFT_OPEN_MS >= 160 && WAVE_GIFT_OPEN_MS <= 360, true);
  assert.equal(WAVE_GIFT_HOLD_MS >= 800, true);
  assert.equal(WAVE_GIFT_FADE_MS >= 280 && WAVE_GIFT_FADE_MS <= 600, true);
  assert.equal(WAVE_GIFT_MOTION_MS < 3000, true);

  assert.equal(waveGiftPhase(0, false), "wait");
  assert.equal(waveGiftPhase(WAVE_GIFT_DELAY_MS, false), "open");
  assert.equal(waveGiftPhase(WAVE_GIFT_DELAY_MS + WAVE_GIFT_OPEN_MS, false), "hold");
  assert.equal(waveGiftPhase(WAVE_GIFT_DELAY_MS + WAVE_GIFT_OPEN_MS + WAVE_GIFT_HOLD_MS, false), "fade");
  assert.equal(waveGiftPhase(WAVE_GIFT_MOTION_MS, false), "off");
  assert.equal(waveGiftPhase(0, true), "still");
  assert.equal(waveGiftPhase(2_000, true), "still");
  assert.equal(waveGiftPhase(0, false, false), "off");
  assert.equal(waveGiftPhase(Number.NaN, false), "off");

  assert.equal(waveGiftVisible("wait"), false);
  assert.equal(waveGiftVisible("open"), true);
  assert.equal(waveGiftVisible("hold"), true);
  assert.equal(waveGiftVisible("fade"), true);
  assert.equal(waveGiftVisible("still"), true);
  assert.equal(waveGiftVisible("off"), false);
  assert.equal(waveGiftVisible("off", false), true);

  assert.equal(wavePressMark(true), "down");
  assert.equal(wavePressMark(false), "up");
  assert.equal(wavePressMark(true, false), "off");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-wave-press="down"/);
  assert.match(css, /wave-gift-open/);
  assert.match(css, /data-gift="still"/);
  assert.match(css, /data-micro-still="1"/);
  const page = readFileSync("src/components/village-page.tsx", "utf8");
  assert.match(page, /WaveGiftNote/);
  assert.match(page, /data-wave-gift/);
});
