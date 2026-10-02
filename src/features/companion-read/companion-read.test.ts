import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  COMPANION_CUE_MS,
  COMPANION_READ_ENABLED,
  COMPANION_WAVE_ENTRIES,
  companionLabel,
  companionMark,
  companionReadOn,
  companionWaveCue,
  waveCuePixels,
  waveCueVisible,
} from "@/features/companion-read/companion-read";

test("PV-PM-082 names the companion state and holds a wave cue for 2–3s", () => {
  assert.equal(COMPANION_READ_ENABLED, true);
  assert.equal(companionReadOn(), true);
  assert.equal(companionReadOn(false), false);
  assert.equal(companionLabel(true), "相伴 · 开着");
  assert.equal(companionLabel(false), "相伴");
  assert.notEqual(companionLabel(true), companionLabel(false));
  assert.equal(companionLabel(true, false), "相伴");
  assert.equal(companionMark(true), "on");
  assert.equal(companionMark(false), "off");
  assert.equal(companionMark(true, false), "off");

  assert.equal(COMPANION_CUE_MS >= 2_000 && COMPANION_CUE_MS <= 3_000, true);
  assert.equal(waveCueVisible(0), true);
  assert.equal(waveCueVisible(2_500), true);
  assert.equal(waveCueVisible(COMPANION_CUE_MS), false);
  assert.equal(waveCueVisible(100, false), false);

  const ring = waveCuePixels(40, 80);
  assert.equal(ring.length, 3);
  assert.equal(ring.every((pixel) => pixel.w <= 16 && pixel.h <= 8), true);
  assert.equal(waveCuePixels(40, 80, false).length, 0);
});

test("PV-D-018 panel and header waves share the companion cue only while 相伴 is on", () => {
  const at = 1_000;
  const line = "邻里应了一下。";
  assert.deepEqual([...COMPANION_WAVE_ENTRIES], ["panel", "header"]);
  for (const entry of COMPANION_WAVE_ENTRIES) {
    const cue = companionWaveCue({ entry, companionOn: true, name: "林小满", line, at });
    assert.ok(cue);
    assert.equal(cue.line, line);
    assert.equal(cue.name, "林小满");
    assert.equal(cue.at, at);
    assert.equal(waveCueVisible(at + 2_700 - at), true);
    assert.equal(waveCuePixels(12, 40).length, 3);
  }
  assert.equal(companionWaveCue({ entry: "panel", companionOn: false, name: "林小满", line, at }), null);
  assert.equal(companionWaveCue({ entry: "header", companionOn: false, name: "林小满", line, at }), null);
  assert.equal(
    companionWaveCue({ entry: "panel", companionOn: true, name: "林小满", line, at, enabled: false }),
    null,
  );
  assert.equal(companionWaveCue({ entry: "header", companionOn: true, name: "  ", line, at }), null);
  assert.equal(companionWaveCue({ entry: "panel", companionOn: true, name: "林小满", line: "  ", at }), null);
  assert.equal(copyIsClean([line, "朝田边挥了一下。"]), true);
});
