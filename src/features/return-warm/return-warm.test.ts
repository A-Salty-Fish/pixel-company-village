import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  RETURN_WARM_ENABLED,
  RETURN_WARM_LINES,
  RETURN_WARM_MS,
  pickLineCue,
  returnWarmCopy,
  returnWarmKey,
  returnWarmLine,
  returnWarmOffer,
} from "@/features/return-warm/return-warm";

test("PV-PM-054 welcomes a later day once, and stays quiet the same day", () => {
  assert.equal(RETURN_WARM_ENABLED, true);
  assert.equal(RETURN_WARM_MS >= 8_000 && RETURN_WARM_MS <= 12_000, true);
  assert.equal(returnWarmKey("王满"), "village:return-warm-v1:王满");
  assert.notEqual(returnWarmKey("王满"), returnWarmKey("李里"));
  assert.equal(returnWarmOffer({ storedYmd: "2026-09-30", today: "2026-10-01" }), true);
  assert.equal(returnWarmOffer({ storedYmd: "2026-10-01", today: "2026-10-01" }), false);
  assert.equal(returnWarmOffer({ storedYmd: null, today: "2026-10-01" }), false);
  assert.equal(returnWarmOffer({ storedYmd: "yesterday", today: "2026-10-01" }), false);
  assert.equal(returnWarmOffer({ storedYmd: "2026-09-30", today: "2026-10-01", enabled: false }), false);
  const line = returnWarmLine("王满", "2026-10-01");
  assert.equal(RETURN_WARM_LINES.includes(line), true);
  assert.equal(returnWarmLine("王满", "2026-10-01"), line);
  assert.equal(copyIsClean(returnWarmCopy()), true);
});

test("one map line at a time, and the return line goes first", () => {
  assert.equal(pickLineCue({ returnWarm: true, dusk: true, dawn: true, night: true }), "return");
  assert.equal(pickLineCue({ returnWarm: false, dusk: true, dawn: true, night: true }), "dusk");
  assert.equal(pickLineCue({ returnWarm: false, dusk: false, dawn: true, night: true }), "dawn");
  assert.equal(pickLineCue({ returnWarm: false, dusk: false, dawn: false, night: true }), "night");
  assert.equal(pickLineCue({ returnWarm: false, dusk: false, dawn: false, night: false }), null);
});
