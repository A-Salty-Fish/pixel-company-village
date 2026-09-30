import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "./wave-d";
import {
  ritualBeat,
  ritualCopyLines,
  ritualNearCount,
  ritualPayload,
  ritualSeal,
  ritualStorageKey,
  sanitizeRitual,
  parseRitual,
  nearLine,
} from "./header-ritual";

test("header ritual follows the hour and stays one beat per day", () => {
  assert.equal(ritualBeat(5).id, "dawn");
  assert.equal(ritualBeat(10).id, "dawn");
  assert.equal(ritualBeat(11).id, "noon");
  assert.equal(ritualBeat(16).id, "noon");
  assert.equal(ritualBeat(17).id, "dusk");
  assert.equal(ritualBeat(2).id, "dusk");
  const saved = sanitizeRitual({ ymd: "2026-09-30", beat: "dawn" }, "2026-09-30");
  assert.deepEqual(saved, { ymd: "2026-09-30", beat: "dawn" });
  assert.equal(sanitizeRitual(saved, "2026-10-01"), null);
  assert.equal(sanitizeRitual({ ymd: "2026-09-30", beat: "dawn", text: "hello" }, "2026-09-30"), null);
  assert.equal(parseRitual("not-json", "2026-09-30"), null);
  assert.equal(parseRitual(ritualPayload({ ymd: "2026-09-30", beat: "noon" }), "2026-09-30")?.beat, "noon");
});

test("two viewers do not share a ritual key", () => {
  assert.notEqual(ritualStorageKey("甲"), ritualStorageKey("乙"));
  assert.equal(ritualStorageKey("甲").includes("乙"), false);
});

test("proximity count and the gate seal stay canned and still", () => {
  const self = { name: "甲", x: 0, y: 0 };
  const near = ritualNearCount(self, [
    self,
    { name: "乙", x: 40, y: 0 },
    { name: "丙", x: 400, y: 0 },
  ]);
  assert.equal(near, 1);
  assert.equal(nearLine(near), "身边有 1 人，点头就好。");
  assert.equal(nearLine(0), "身边暂时没有人靠近。");
  const dawn = ritualSeal("dawn");
  const dusk = ritualSeal("dusk");
  assert.equal(dawn.length, dusk.length);
  assert.equal(dawn.some((pixel) => pixel.color === "#f2d15c"), true);
  assert.equal(dusk.some((pixel) => pixel.color === "#c44b3a"), true);
  assert.equal(copyIsClean(ritualCopyLines()), true);
});
