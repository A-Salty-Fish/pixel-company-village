import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import { COMPANION_CUE_MS } from "@/features/companion-read/companion-read";
import {
  FIRST_SCREEN_SOCIAL_ENABLED,
  FIRST_WAVE_LABEL,
  firstScreenSocial,
  firstScreenSocialOn,
  firstSocialCopy,
  waveOnFirstScreen,
} from "@/features/first-screen-social/first-screen-social";

test("PV-PM-087 puts wave on the first screen and keeps a 2–3s receipt", () => {
  assert.equal(FIRST_SCREEN_SOCIAL_ENABLED, true);
  assert.equal(firstScreenSocialOn(), true);
  assert.equal(firstScreenSocialOn(false), false);
  assert.equal(firstScreenSocial(390), true);
  assert.equal(firstScreenSocial(480), true);
  assert.equal(firstScreenSocial(481), false);
  assert.equal(firstScreenSocial(390, false), false);
  assert.equal(waveOnFirstScreen(), true);
  assert.equal(waveOnFirstScreen(false), false);
  assert.equal(FIRST_WAVE_LABEL, "挥手");
  assert.equal(COMPANION_CUE_MS >= 2_000 && COMPANION_CUE_MS <= 3_000, true);
  assert.equal(copyIsClean(firstSocialCopy()), true);
});
