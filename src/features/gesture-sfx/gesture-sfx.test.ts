import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_COMFORT } from "@/lib/village-life";
import {
  AMBIENT_GAIN,
  GESTURE_SFX_ENABLED,
  GESTURE_SPEC,
  ambientBedOn,
  gestureAllowed,
  gestureSpec,
} from "@/features/gesture-sfx/gesture-sfx";

test("PV-PM-025 gestures stay silent until unmute, and the bed stays softer", () => {
  assert.equal(GESTURE_SFX_ENABLED, true);
  assert.equal(DEFAULT_COMFORT.sfxMuted, true);
  assert.equal(gestureAllowed({ muted: true, reduceMotion: false }), false);
  assert.equal(gestureAllowed({ muted: false, reduceMotion: true }), false);
  assert.equal(gestureAllowed({ muted: false, reduceMotion: false }), true);
  assert.equal(gestureAllowed({ muted: false, reduceMotion: false, enabled: false }), false);
  assert.equal(gestureSpec("lamp", false), null);
  assert.equal(gestureSpec("wave", true)?.hz, GESTURE_SPEC.wave.hz);
  assert.equal(gestureSpec("find", true)?.hz !== GESTURE_SPEC.lamp.hz, true);
  assert.equal(GESTURE_SPEC.lamp.gain <= 0.03, true);
  assert.equal(GESTURE_SPEC.wave.gain <= 0.03, true);
  assert.equal(GESTURE_SPEC.find.gain <= 0.03, true);
  assert.equal(ambientBedOn({ muted: true, ambient: true, reduceMotion: false }), false);
  assert.equal(ambientBedOn({ muted: false, ambient: false, reduceMotion: false }), false);
  assert.equal(ambientBedOn({ muted: false, ambient: true, reduceMotion: true }), false);
  assert.equal(ambientBedOn({ muted: false, ambient: true, reduceMotion: false }), true);
  assert.equal(AMBIENT_GAIN < GESTURE_SPEC.find.gain, true);
});
