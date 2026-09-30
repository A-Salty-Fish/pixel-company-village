import assert from "node:assert/strict";
import test from "node:test";
import { GUIDE_KEY, GUIDE_LINES, guideSeen } from "@/lib/first-run";
import { emoteFx, kindnessFx, SOCIAL_KIND_REPLY, SOCIAL_WAVE_REPLY, withSocialReply } from "@/lib/interactions";
import { DEFAULT_COMFORT } from "@/lib/village-life";
import { choreAction, choreWorldOf, copyIsClean, noteWeekChore, weekBoard, EMPTY_WAVE, type WeekFacts } from "@/lib/wave-d";

const QUIET: WeekFacts = {
  wateredToday: false,
  cardOpen: false,
  visitedGate: false,
  porchOn: false,
  diaryToday: false,
  steps: 0,
  pinned: false,
  resting: false,
  noticedSeason: false,
};

test("a finished chore lights one world mark and a kept label survives", () => {
  const blank = choreWorldOf(QUIET, "2026-W40", null);
  assert.equal(Object.values(blank).every((on) => on === false), true);
  const live = choreWorldOf({ ...QUIET, porchOn: true, steps: 2 }, "2026-W40", null);
  assert.equal(live.porch, true);
  assert.equal(live.steps, false);
  const label = weekBoard("2026-W40").items[0];
  const action = choreAction(label);
  assert.ok(action);
  const kept = noteWeekChore(EMPTY_WAVE, "2026-W40", label);
  const after = choreWorldOf(QUIET, "2026-W40", kept.weekMarks);
  assert.equal(after[action ?? "water"], true);
  assert.equal(Object.values(after).filter(Boolean).length, 1);
});

test("wave and kindness toward someone else get one canned reply", () => {
  const wave = withSocialReply(emoteFx("林小满", "wave"), "周野");
  assert.equal(wave.partner, "周野");
  assert.match(wave.line, new RegExp(SOCIAL_WAVE_REPLY));
  const self = withSocialReply(emoteFx("周野", "wave"), "周野");
  assert.equal(self.partner, undefined);
  assert.equal(self.line.includes(SOCIAL_WAVE_REPLY), false);
  const kind = withSocialReply(kindnessFx("seed", "林小满"), "周野");
  assert.equal(kind.partner, "周野");
  assert.match(kind.line, new RegExp(SOCIAL_KIND_REPLY));
  assert.equal(copyIsClean([wave.line, kind.line, ...GUIDE_LINES]), true);
});

test("first-run guide stores a seen flag and keeps quiet village on", () => {
  assert.equal(GUIDE_KEY, "village:guide-seen-v1");
  assert.equal(guideSeen(null), false);
  assert.equal(guideSeen("1"), true);
  assert.equal(guideSeen("聊天原文"), false);
  assert.equal(DEFAULT_COMFORT.quiet, true);
  assert.match(GUIDE_LINES.join(""), /减动开关/);
});
