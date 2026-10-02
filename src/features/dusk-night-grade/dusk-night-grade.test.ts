import assert from "node:assert/strict";
import test from "node:test";
import { farmStillReads, nightField, nightWashBlanks } from "@/features/night-wash-v2/night-wash-v2";
import {
  DUSK_NIGHT_GRADE_ENABLED,
  DUSK_NOTCH,
  NIGHT_NOTCH,
  duskNightGradeFor,
  duskNightGradeOn,
  duskNightGradePhase,
  gradeKeepsBlacks,
  gradedNightGrass,
} from "@/features/dusk-night-grade/dusk-night-grade";

test("PV-PM-098 thickens dusk and night one notch without closing the blacks", () => {
  assert.equal(DUSK_NIGHT_GRADE_ENABLED, true);
  assert.equal(duskNightGradeOn(), true);
  assert.equal(duskNightGradeOn(false), false);
  assert.equal(duskNightGradePhase({ dusk: true, night: false }), "dusk");
  assert.equal(duskNightGradePhase({ dusk: false, night: true }), "night");
  assert.equal(duskNightGradePhase({ dusk: true, night: true }), "night");
  assert.equal(duskNightGradePhase({ dusk: false, night: false }), "off");
  assert.equal(duskNightGradePhase({ dusk: true, night: true }, false), "off");
  assert.equal(duskNightGradeFor({ hour: 16, night: false }), "off");
  assert.equal(duskNightGradeFor({ hour: 17, night: false }), "dusk");
  assert.equal(duskNightGradeFor({ hour: 19, night: false }), "dusk");
  assert.equal(duskNightGradeFor({ hour: 20, night: true }), "night");
  assert.equal(duskNightGradeFor({ hour: 18, night: false }, false), "off");

  assert.equal(DUSK_NOTCH.a > 0.06 && DUSK_NOTCH.a < 0.16, true);
  assert.equal(NIGHT_NOTCH.a > 0.04 && NIGHT_NOTCH.a < 0.12, true);
  assert.equal(DUSK_NOTCH.r > DUSK_NOTCH.b, true);

  const shipped = nightField();
  const graded = gradedNightGrass();
  const drop = shipped.g - graded.g;
  assert.equal(drop >= 2 && drop <= 14, true);
  assert.equal(graded.b > graded.g, true);
  assert.equal(farmStillReads(graded), true);
  assert.equal(nightWashBlanks(1 - (1 - 0.62) * (1 - NIGHT_NOTCH.a)), false);
  assert.equal(gradeKeepsBlacks(), true);
});
