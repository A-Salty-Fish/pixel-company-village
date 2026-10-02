import assert from "node:assert/strict";
import test from "node:test";
import {
  atMostOneLoudInvite,
  guestInvitesQuiet,
  oneFieldInviteMark,
  oneFieldInviteOn,
  sentenceBlockCount,
} from "@/features/one-field-invite/one-field-invite";

test("PV-PM-110 keeps one invitation before a name is chosen", () => {
  assert.equal(oneFieldInviteOn(), true);
  assert.equal(oneFieldInviteOn(false), false);
  assert.equal(oneFieldInviteMark(), "1");
  assert.equal(guestInvitesQuiet(false), true);
  assert.equal(guestInvitesQuiet(true), false);
  assert.equal(guestInvitesQuiet(false, false), false);
  assert.equal(atMostOneLoudInvite(["先在地图上找我，或去看村口。"]), true);
  assert.equal(atMostOneLoudInvite(["今日还空着，先做一件小事", "村口 · 晴", "分享村子"]), false);
  assert.equal(atMostOneLoudInvite(["门灯还亮着", "分享村子"]), false);
  assert.equal(sentenceBlockCount(["拉远", "全景", "拉近", "静音", "找我"]) <= 3, true);
  assert.equal(sentenceBlockCount(["找我", "挥手", "相伴", "分享村子", "去看村口"]) > 3, true);
});
