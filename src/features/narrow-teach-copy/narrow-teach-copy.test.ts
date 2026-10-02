import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  NARROW_TEACH_COPY_ENABLED,
  TEACH_NARROW,
  narrowTeachOn,
  nextBeatFirstScreen,
  teachAria,
  teachHint,
  teachIsNarrow,
  teachMentionsWheel,
} from "@/features/narrow-teach-copy/narrow-teach-copy";

test("PV-PM-086 narrow teaching drops the wheel and keeps the next beat on screen", () => {
  assert.equal(NARROW_TEACH_COPY_ENABLED, true);
  assert.equal(narrowTeachOn(), true);
  assert.equal(narrowTeachOn(false), false);
  assert.equal(teachIsNarrow(390), true);
  assert.equal(teachIsNarrow(480), true);
  assert.equal(teachIsNarrow(481), false);
  assert.equal(teachIsNarrow(390, false), false);

  const narrow = teachHint(true);
  const wide = teachHint(false);
  assert.equal(teachMentionsWheel(narrow), false);
  assert.equal(narrow.includes("双指捏合"), true);
  assert.equal(narrow.includes("拖动"), true);
  assert.equal(teachMentionsWheel(wide), true);
  assert.equal(teachMentionsWheel(teachHint(true, false)), true);
  assert.equal(teachMentionsWheel(teachAria(true)), false);
  assert.equal(teachMentionsWheel(teachAria(false)), true);
  assert.equal(teachAria(true).includes("双指捏合"), true);
  assert.equal(nextBeatFirstScreen(), true);
  assert.equal(nextBeatFirstScreen(false), false);
  assert.equal(copyIsClean([narrow, TEACH_NARROW, teachAria(true)]), true);
});
