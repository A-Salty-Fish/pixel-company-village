import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  AFTERGLOW_FADE_MS,
  AFTERGLOW_LINE,
  AFTERGLOW_PEAK,
  AFTERGLOW_STILL_MS,
  RITUAL_AFTERGLOW_ENABLED,
  afterglowAlpha,
  afterglowPhase,
} from "@/features/ritual-afterglow/ritual-afterglow";

test("PV-PM-019 afterglow fades, and reduced motion holds then clears", () => {
  assert.equal(RITUAL_AFTERGLOW_ENABLED, true);
  assert.equal(afterglowPhase(-1, false), "off");
  assert.equal(afterglowPhase(0, false), "fade");
  assert.equal(afterglowPhase(AFTERGLOW_FADE_MS - 1, false), "fade");
  assert.equal(afterglowPhase(AFTERGLOW_FADE_MS, false), "off");
  assert.equal(afterglowAlpha(0, false), AFTERGLOW_PEAK);
  assert.equal(afterglowAlpha(AFTERGLOW_FADE_MS / 2, false) < AFTERGLOW_PEAK, true);
  assert.equal(afterglowAlpha(AFTERGLOW_FADE_MS, false), 0);

  assert.equal(afterglowPhase(0, true), "still");
  assert.equal(afterglowPhase(AFTERGLOW_STILL_MS - 1, true), "still");
  assert.equal(afterglowAlpha(400, true), AFTERGLOW_PEAK);
  assert.equal(afterglowAlpha(800, true), afterglowAlpha(0, true));
  assert.equal(afterglowPhase(AFTERGLOW_STILL_MS, true), "off");
  assert.equal(afterglowAlpha(AFTERGLOW_STILL_MS, true), 0);

  assert.equal(afterglowPhase(0, false, false), "off");
  assert.equal(copyIsClean([AFTERGLOW_LINE]), true);
});
