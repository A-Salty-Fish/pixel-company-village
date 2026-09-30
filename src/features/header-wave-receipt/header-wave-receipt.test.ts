import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  HEADER_WAVE_MS,
  HEADER_WAVE_RECEIPT_ENABLED,
  headerWaveCopy,
  headerWaveLine,
  headerWaveTarget,
} from "@/features/header-wave-receipt/header-wave-receipt";

test("PV-PM-028 header wave picks a neighbor and a canned receipt", () => {
  assert.equal(HEADER_WAVE_RECEIPT_ENABLED, true);
  assert.equal(HEADER_WAVE_MS <= 3000, true);
  const self = { name: "我", x: 0, y: 0 };
  const near = { name: "近", x: 10, y: 0 };
  const far = { name: "远", x: 80, y: 0 };
  assert.equal(headerWaveTarget(self, [far, near])?.name, "近");
  assert.equal(headerWaveTarget(null, [near]), null);
  assert.equal(headerWaveTarget(self, [near], false), null);
  assert.equal(headerWaveLine(true), "邻里应了一下。");
  assert.equal(headerWaveLine(false), "朝田边挥了一下。");
  assert.equal(headerWaveLine(true, false), "");
  assert.equal(copyIsClean(headerWaveCopy()), true);
  assert.equal(headerWaveCopy().some((line) => line.includes("说")), false);
});
