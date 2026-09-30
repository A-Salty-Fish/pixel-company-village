import assert from "node:assert/strict";
import test from "node:test";
import {
  LANE_ACTS,
  WIND_LINES,
  duckLine,
  emptyLane,
  laneCopyLines,
  laneLook,
  playLane,
  readLane,
} from "./lane";

test("nine lane acts stay canned", () => {
  assert.equal(LANE_ACTS.length, 9);
  const lines = laneCopyLines();
  assert.equal(lines.every((line) => line.length > 0 && line.length <= 80 && !line.includes("他说")), true);
  assert.equal(lines.some((line) => /原文|chat/i.test(line)), false);
  assert.equal(WIND_LINES.length, 4);
});

test("well, bridge, and wind happen once and do not store a sentence", () => {
  const drawn = playLane(emptyLane(), "well", "2026-09-30", true);
  assert.equal(drawn.ok, true);
  assert.equal(drawn.lane.wellDay, "2026-09-30");
  assert.equal(playLane(drawn.lane, "well", "2026-09-30", true).ok, false);
  assert.equal(playLane(drawn.lane, "well", "2026-10-01", true).lane.wellDay, "2026-10-01");

  const stood = playLane(emptyLane(), "bridge", "2026-09-30", true);
  assert.equal(playLane(stood.lane, "bridge", "2026-09-30", true).ok, false);

  const wind = playLane(emptyLane(), "wind", "2026-09-30", true);
  assert.equal(wind.ok, true);
  assert.equal(wind.lane.windDay, "2026-09-30");
  assert.equal(typeof wind.lane.windIndex, "number");
  assert.equal(WIND_LINES.includes(wind.line as (typeof WIND_LINES)[number]), true);
  assert.equal(playLane(wind.lane, "wind", "2026-09-30", true).ok, false);
  assert.equal(JSON.stringify(wind.lane).includes("风朝"), false);
});

test("stones and ducks stop at three and flags stay on", () => {
  let lane = emptyLane();
  for (let n = 1; n <= 3; n += 1) {
    const step = playLane(lane, "ducks", "2026-09-30", true);
    assert.equal(step.ok, true);
    assert.equal(step.line, duckLine(n));
    lane = step.lane;
  }
  assert.equal(lane.ducks, 3);
  assert.equal(playLane(lane, "ducks", "2026-09-30", true).ok, false);

  for (let n = 0; n < 3; n += 1) lane = playLane(lane, "stone", "2026-09-30", true).lane;
  assert.equal(lane.stone, 3);
  assert.equal(playLane(lane, "stone", "2026-09-30", true).lane, lane);

  const fixed = playLane(emptyLane(), "fence", "2026-09-30", true).lane;
  const lit = playLane(fixed, "lantern", "2026-09-30", true).lane;
  const hung = playLane(lit, "hat", "2026-09-30", true).lane;
  const shut = playLane(hung, "gate", "2026-09-30", true).lane;
  assert.equal(shut.fence && shut.lantern && shut.hat && shut.gate, true);
  assert.equal(playLane(shut, "lantern", "2026-09-30", true).ok, false);
  assert.equal(playLane(shut, "lantern", "2026-09-30", true).lane.lantern, true);
});

test("a closed lane and bad storage do not keep chat", () => {
  const start = emptyLane();
  assert.equal(playLane(start, "well", "2026-09-30", false).lane, start);
  assert.equal(playLane(start, "chat", "2026-09-30", true).ok, false);
  const cleaned = readLane({
    wellDay: "聊天原文",
    fence: "扶好的话",
    lantern: true,
    stone: 8,
    windDay: "2026-09-30",
    windIndex: 2,
    hat: false,
    ducks: -1,
    gate: true,
    bridgeDay: "2026-09-30",
    text: "他说了什么",
    message: "原文",
  });
  assert.equal(cleaned.wellDay, null);
  assert.equal(cleaned.fence, false);
  assert.equal(cleaned.lantern, true);
  assert.equal(cleaned.stone, 3);
  assert.equal(cleaned.windIndex, 2);
  assert.equal(cleaned.ducks, 0);
  assert.equal(cleaned.gate, true);
  assert.equal(JSON.stringify(cleaned).includes("原文"), false);
  assert.equal(laneLook(cleaned, "2026-09-30", true, true).bob, false);
  assert.equal(laneLook(cleaned, "2026-09-30", true, true).bridge, true);
  assert.equal(laneLook(cleaned, "2026-09-30", false, false).on, false);
});
