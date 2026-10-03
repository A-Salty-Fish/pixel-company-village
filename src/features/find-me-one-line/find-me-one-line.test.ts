import assert from "node:assert/strict";
import test from "node:test";
import {
  FIND_ME_ONE_LINE_ENABLED,
  findMeCoversSentence,
  findMeOneLineMark,
  findMeOneLineOn,
  findMeSentence,
  selfInFrame,
} from "@/features/find-me-one-line/find-me-one-line";

test("PV-PM-119 stays quiet when the camera already frames you", () => {
  assert.equal(FIND_ME_ONE_LINE_ENABLED, true);
  assert.equal(findMeOneLineOn(), true);
  assert.equal(findMeOneLineOn(false), false);
  assert.equal(findMeOneLineMark(), "1");
  assert.equal(findMeOneLineMark(false), "0");
  assert.equal(
    selfInFrame({ self: { x: 80, y: 90 }, camX: 0, camY: 0, spanW: 200, spanH: 160 }),
    true,
  );
  assert.equal(
    selfInFrame({ self: { x: 240, y: 90 }, camX: 0, camY: 0, spanW: 200, spanH: 160 }),
    false,
  );
  assert.equal(selfInFrame({ self: null, camX: 0, camY: 0, spanW: 200, spanH: 160 }), false);
  assert.equal(findMeSentence({ framed: true }), "silent");
  assert.equal(findMeSentence({ framed: false }), "replace");
  assert.equal(findMeSentence({ framed: true, enabled: false }), "add");
  assert.equal(findMeCoversSentence("replace"), true);
  assert.equal(findMeCoversSentence("silent"), false);
  assert.equal(findMeCoversSentence("add"), false);
});
