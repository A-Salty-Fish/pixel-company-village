import assert from "node:assert/strict";
import test from "node:test";
import { scoreDateCopy } from "./copy";
import {
  CHORE_JUICE_MS,
  FAR_PLATE_CAP,
  bumpFamiliar,
  farPlates,
  glanceLine,
  lightLabel,
  loadRitual,
  momentCopy,
  readFamiliar,
  ritualCopyLines,
  ritualDone,
  ritualStep,
  socialReply,
} from "./ritual";

test("the glance is season, weather, light, and self", () => {
  assert.equal(glanceLine({ season: "秋日田色", weather: "晴", light: "白天", selfName: "林小满" }), "秋日田色 · 晴 · 白天 · 我是林小满");
  assert.match(glanceLine({ season: "秋日田色", weather: "晴", light: "白天", selfName: null }), /还没选定我是谁/);
  assert.equal(lightLabel(10), "白天");
  assert.equal(lightLabel(18), "傍晚");
  assert.equal(lightLabel(22), "夜里");
  assert.equal(glanceLine({ season: "秋", weather: "晴", light: "白天", selfName: null }).includes("有分"), false);
});

test("a stale score day stays in the village's present", () => {
  const stale = momentCopy("2026-09-24", "2026-09-30");
  assert.equal(stale.fresh, false);
  assert.equal(stale.headline, "分数来自2026-09-24 · 村里仍是此刻");
  assert.match(stale.detail, /此刻/);
  const fresh = momentCopy("2026-09-30", "2026-09-30");
  assert.equal(fresh.fresh, true);
  assert.equal(scoreDateCopy("2026-09-24", "2026-09-30").headline, stale.headline);
});

test("far plates stay within eight and prefer self, pins, and neighbors", () => {
  const names = farPlates({
    selfName: "我",
    selected: ["选中"],
    pins: ["钉一", "钉二"],
    neighbors: ["邻一", "邻二", "邻三", "邻四", "邻五", "邻六", "邻七"],
  });
  assert.equal(names.length, FAR_PLATE_CAP);
  assert.equal(names[0], "我");
  assert.equal(names.includes("邻七"), false);
  assert.equal(farPlates({ selfName: null, selected: [], pins: [], neighbors: [] }).length, 0);
});

test("the first visit is three local steps and does not invent a card", () => {
  const fresh = loadRitual(null);
  assert.equal(ritualStep(fresh), "self");
  assert.equal(ritualDone(fresh), false);
  const walked = { self: true, yard: true, social: true, skip: false };
  assert.equal(ritualStep(walked), "done");
  assert.equal(ritualDone({ ...fresh, skip: true }), true);
  const dirty = loadRitual(JSON.stringify({ self: true, yard: "聊天原文", social: false, text: "他说" }));
  assert.equal(dirty.yard, false);
  assert.equal(dirty.self, true);
  assert.equal(JSON.stringify(dirty).includes("原文"), false);
});

test("a chore spark is under a second and a half, and replies stay canned", () => {
  assert.equal(CHORE_JUICE_MS <= 1_500, true);
  assert.equal(socialReply("wave"), "对方也挥了挥手。");
  assert.equal(socialReply("seed").includes("他说"), false);
  const bumped = bumpFamiliar({ 林小满: 1 }, "林小满");
  assert.equal(bumped.林小满, 2);
  const tooLong = "名".repeat(25);
  assert.equal(tooLong in bumpFamiliar({}, tooLong), false);
  const cleaned = readFamiliar({ 林小满: 9, 坏名字: "聊天原文", 周晚风: 1 });
  assert.equal(cleaned.林小满, 6);
  assert.equal(cleaned.周晚风, 1);
  assert.equal(JSON.stringify(cleaned).includes("原文"), false);
  assert.equal(ritualCopyLines().every((line) => line.length > 0 && line.length <= 80 && !line.includes("他说")), true);
});
