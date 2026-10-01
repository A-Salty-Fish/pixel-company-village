import assert from "node:assert/strict";
import test from "node:test";
import { nightField } from "@/features/night-wash-v2/night-wash-v2";
import { farmStillReads } from "@/features/night-wash-v2/night-wash-v2";
import {
  AUTUMN_DOT,
  NIGHT_READABILITY_ENABLED,
  autumnDotsOn,
  nightReadMark,
  pondSlabOn,
  readabilityOk,
} from "@/features/night-readability/night-readability";

test("PV-PM-023 night structure stays readable without lifting the dark field", () => {
  assert.equal(NIGHT_READABILITY_ENABLED, true);
  assert.equal(nightReadMark(false), "off");
  assert.equal(nightReadMark(true), "lift");
  assert.equal(nightReadMark(true, false), "off");
  assert.equal(autumnDotsOn("autumn", true), true);
  assert.equal(autumnDotsOn("winter", true), false);
  assert.equal(autumnDotsOn("autumn", false), false);
  const field = nightField();
  assert.equal(pondSlabOn(), false);
  assert.equal(field.b > field.g, true);
  assert.equal(farmStillReads(field), true);
  assert.equal(readabilityOk(field), true);
  assert.equal(AUTUMN_DOT.r > 180, true);
});
