import assert from "node:assert/strict";
import test from "node:test";
import { CLICK_GAIN } from "@/features/light-sfx/light-sfx";
import { AMBIENT_GAIN, GESTURE_SPEC } from "@/features/gesture-sfx/gesture-sfx";
import { DEFAULT_COMFORT } from "@/lib/village-life";
import {
  SOFT_AMBIENT_ENABLED,
  WATER_GAIN,
  WIND_GAIN,
  softAmbientOn,
  softAmbientUnderSfx,
  syncSoftAmbient,
} from "@/features/soft-ambient/soft-ambient";

test("PV-PM-037 loops only after unmute and stays softer than the existing tones", () => {
  assert.equal(SOFT_AMBIENT_ENABLED, true);
  assert.equal(DEFAULT_COMFORT.sfxMuted, true);
  assert.equal(softAmbientOn({ muted: true, reduceMotion: false }), false);
  assert.equal(softAmbientOn({ muted: false, reduceMotion: true }), false);
  assert.equal(softAmbientOn({ muted: false, reduceMotion: false }), true);
  assert.equal(softAmbientOn({ muted: false, reduceMotion: false, enabled: false }), false);
  assert.equal(softAmbientUnderSfx(CLICK_GAIN, GESTURE_SPEC.lamp.gain), true);
  assert.equal(WIND_GAIN < AMBIENT_GAIN, true);
  assert.equal(WATER_GAIN < AMBIENT_GAIN, true);
  assert.equal(syncSoftAmbient(false), "off");
  assert.equal(syncSoftAmbient(true), "off");
});
