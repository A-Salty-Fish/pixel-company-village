import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  WEEK_DONE_SUMMARY_ENABLED,
  WEEK_SETTLED_NOTE,
  WEEK_SETTLED_TITLE,
  WEEK_THUMBS,
  weekPanelMode,
} from "@/features/week-done-summary/week-done-summary";

test("PV-PM-015 replaces a finished week with traces, not a ranking", () => {
  assert.equal(WEEK_DONE_SUMMARY_ENABLED, true);
  assert.equal(weekPanelMode(true), "settled");
  assert.equal(weekPanelMode(false), "chores");
  assert.equal(weekPanelMode(true, false), "chores");
  assert.deepEqual(
    WEEK_THUMBS.map((thumb) => thumb.label),
    ["脚印", "水壶", "布条"],
  );
  assert.equal(copyIsClean([WEEK_SETTLED_TITLE, WEEK_SETTLED_NOTE, ...WEEK_THUMBS.map((thumb) => thumb.label)]), true);
  assert.equal(/排名|第一|比拼/.test(`${WEEK_SETTLED_TITLE}${WEEK_SETTLED_NOTE}`), false);
});
