import assert from "node:assert/strict";
import test from "node:test";
import { comfortFromStorage, DEFAULT_COMFORT } from "@/lib/village-life";
import {
  AMBIENT_BED_ENABLED,
  CLICK_GAIN,
  CLICK_MS,
  LIGHT_SFX_ENABLED,
  clickSpec,
  playUiClick,
  sfxAllowed,
  sfxMark,
} from "@/features/light-sfx/light-sfx";

test("PV-PM-022 clicks stay off until unmute, and reduced motion stays silent", () => {
  assert.equal(LIGHT_SFX_ENABLED, true);
  assert.equal(AMBIENT_BED_ENABLED, false);
  assert.equal(DEFAULT_COMFORT.sfxMuted, true);
  assert.equal(comfortFromStorage(null).sfxMuted, true);
  assert.equal(comfortFromStorage("{}").sfxMuted, true);
  assert.equal(comfortFromStorage('{"sfxMuted":false}').sfxMuted, false);
  assert.equal(comfortFromStorage('{"quiet":false}').sfxMuted, true);

  assert.equal(sfxMark(true, false), "muted");
  assert.equal(sfxMark(false, true), "still");
  assert.equal(sfxMark(false, false), "live");
  assert.equal(sfxMark(false, false, false), "off");

  assert.equal(sfxAllowed({ muted: true, reduceMotion: false }), false);
  assert.equal(sfxAllowed({ muted: false, reduceMotion: true }), false);
  assert.equal(sfxAllowed({ muted: false, reduceMotion: false }), true);
  assert.equal(sfxAllowed({ muted: false, reduceMotion: false, enabled: false }), false);

  const spec = clickSpec(true);
  assert.ok(spec);
  assert.equal(spec.gain <= 0.04, true);
  assert.equal(spec.ms <= 60, true);
  assert.equal(CLICK_GAIN, spec.gain);
  assert.equal(CLICK_MS, spec.ms);
  assert.equal(clickSpec(false), null);
  assert.equal(playUiClick(false), "skipped");
  assert.equal(playUiClick(true), "skipped");
});
