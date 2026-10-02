import assert from "node:assert/strict";
import test from "node:test";
import {
  SHARE_LABEL,
  SHARE_VILLAGE_ENABLED,
  shareCardIsPublic,
  sharePreview,
  shareVillageOn,
} from "@/features/share-village/share-village";

test("PV-PM-083 shares names, a date, and counts, and drops chat", () => {
  assert.equal(SHARE_VILLAGE_ENABLED, true);
  assert.equal(shareVillageOn(), true);
  assert.equal(shareVillageOn(false), false);
  assert.equal(SHARE_LABEL, "分享村子");

  const card = sharePreview({
    date: "2026-10-02",
    scored: 12,
    messages: 34,
    names: ["阿盐", "小林", "not a sentence with spaces", "小周"],
    version: "1.9.0",
  });
  assert.equal(card.title, "像素公司村");
  assert.equal(card.lines[0], "像素公司村");
  assert.equal(card.lines.includes("2026-10-02"), true);
  assert.equal(card.lines.includes("有分 12 人"), true);
  assert.equal(card.lines.includes("消息 34 条"), true);
  assert.equal(card.text.includes("阿盐"), true);
  assert.equal(card.text.includes("小林"), true);
  assert.equal(card.text.includes("not a sentence"), false);
  assert.equal(card.text.includes("v1.9.0"), true);
  assert.equal(shareCardIsPublic(card.text), true);

  const dirty = sharePreview({
    date: "他说了好多话",
    scored: Number.NaN,
    messages: -3,
    names: ["聊天原文不该出现在这里面呀"],
    version: "nope",
  });
  assert.equal(dirty.text.includes("他说"), false);
  assert.equal(dirty.text.includes("聊天"), false);
  assert.equal(dirty.lines.includes("有分 0 人"), true);
  assert.equal(dirty.lines.includes("消息 0 条"), true);
  assert.equal(sharePreview({ date: "2026-10-02", scored: 1, messages: 1, names: [], version: "1.9.0" }, false).text, "");
});
