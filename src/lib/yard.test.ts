import assert from "node:assert/strict";
import test from "node:test";
import {
  YARD_ACTS,
  emptyYard,
  playYard,
  readYard,
  yardCopyLines,
  yardLook,
} from "./yard";

test("nine canned yard acts stay short and local", () => {
  assert.equal(YARD_ACTS.length, 9);
  for (const act of YARD_ACTS) {
    assert.equal(act.label.length > 0 && act.label.length <= 12, true);
    assert.equal(act.line.includes("他说"), false);
    assert.equal(/chat|原文/.test(act.line), false);
  }
  const lines = yardCopyLines();
  assert.equal(lines.every((line) => line.length > 0 && line.length <= 80), true);
});

test("hen and sweep happen once per day", () => {
  const fed = playYard(emptyYard(), "hen", "2026-09-30", true);
  assert.equal(fed.ok, true);
  assert.equal(fed.yard.henDay, "2026-09-30");
  const again = playYard(fed.yard, "hen", "2026-09-30", true);
  assert.equal(again.ok, false);
  assert.equal(again.yard, fed.yard);
  const next = playYard(fed.yard, "hen", "2026-10-01", true);
  assert.equal(next.ok, true);
  assert.equal(next.yard.henDay, "2026-10-01");

  const swept = playYard(emptyYard(), "sweep", "2026-09-30", true);
  assert.equal(swept.ok, true);
  assert.equal(playYard(swept.yard, "sweep", "2026-09-30", true).ok, false);
  assert.equal(yardLook(swept.yard, "2026-09-30", true, false).wear, false);
  assert.equal(yardLook(emptyYard(), "2026-09-30", true, false).wear, true);
});

test("bell and grain stop at three and flags do not flip off", () => {
  let yard = emptyYard();
  for (let n = 0; n < 3; n += 1) {
    const step = playYard(yard, "bell", "2026-09-30", true);
    assert.equal(step.ok, true);
    yard = step.yard;
  }
  assert.equal(yard.bell, 3);
  assert.equal(playYard(yard, "bell", "2026-09-30", true).ok, false);
  assert.equal(playYard(yard, "bell", "2026-09-30", true).yard.bell, 3);

  for (let n = 0; n < 3; n += 1) yard = playYard(yard, "grain", "2026-09-30", true).yard;
  assert.equal(yard.grain, 3);
  assert.equal(playYard(yard, "grain", "2026-09-30", true).ok, false);

  const hung = playYard(emptyYard(), "laundry", "2026-09-30", true);
  assert.equal(hung.yard.laundry, true);
  assert.equal(playYard(hung.yard, "laundry", "2026-09-30", true).ok, false);
  assert.equal(playYard(hung.yard, "laundry", "2026-09-30", true).yard.laundry, true);
  const warm = playYard(hung.yard, "stove", "2026-09-30", true).yard;
  const shut = playYard(warm, "shutters", "2026-09-30", true).yard;
  const bowl = playYard(shut, "bowl", "2026-09-30", true).yard;
  const pepper = playYard(bowl, "pepper", "2026-09-30", true).yard;
  assert.equal(pepper.stove && pepper.shutters && pepper.bowl && pepper.pepper, true);
});

test("a closed yard and unknown ids do not write", () => {
  const start = emptyYard();
  const closed = playYard(start, "hen", "2026-09-30", false);
  assert.equal(closed.ok, false);
  assert.equal(closed.yard, start);
  assert.equal(playYard(start, "chat", "2026-09-30", true).ok, false);
  assert.equal(playYard(start, "hen", "today", true).ok, false);
  assert.equal(yardLook(start, "2026-09-30", false, false).on, false);
  assert.equal(yardLook(start, "2026-09-30", true, true).sway, false);
});

test("stored yard drops free text and chat-shaped fields", () => {
  const cleaned = readYard({
    henDay: "聊天原文很长的一天",
    laundry: "衣裳上的话",
    stove: 1,
    bell: 9,
    grain: -2,
    shutters: true,
    bowl: false,
    sweepDay: "2026-09-30",
    pepper: true,
    message: "他说了什么",
    text: "原文",
    chat: "transcript",
  });
  assert.equal(cleaned.henDay, null);
  assert.equal(cleaned.laundry, false);
  assert.equal(cleaned.stove, false);
  assert.equal(cleaned.bell, 3);
  assert.equal(cleaned.grain, 0);
  assert.equal(cleaned.shutters, true);
  assert.equal(cleaned.sweepDay, "2026-09-30");
  assert.equal(JSON.stringify(cleaned).includes("他说"), false);
  assert.equal(JSON.stringify(cleaned).includes("原文"), false);
});
