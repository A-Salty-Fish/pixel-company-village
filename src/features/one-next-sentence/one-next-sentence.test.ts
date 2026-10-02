import assert from "node:assert/strict";
import test from "node:test";
import {
  HEADER_SYNONYM,
  chooseNextSentence,
  headerRepeatsInvite,
  loudHitCount,
  oneNextSentenceMark,
  oneNextSentenceOn,
  sentenceSpeaks,
} from "@/features/one-next-sentence/one-next-sentence";

const offered = {
  hasSelf: true,
  home: false,
  line: true,
  suggest: false,
  gate: true,
  welcome: true,
  share: true,
  week: true,
  touch: true,
};

test("PV-PM-116 keeps one next sentence after a name is chosen", () => {
  assert.equal(oneNextSentenceOn(), true);
  assert.equal(oneNextSentenceOn(false), false);
  assert.equal(oneNextSentenceMark(), "1");
  assert.equal(oneNextSentenceMark(false), "0");
  assert.equal(chooseNextSentence({ ...offered, hasSelf: false }), "all");
  assert.equal(chooseNextSentence({ ...offered, enabled: false }), "all");
  assert.equal(chooseNextSentence(offered), "line");
  assert.equal(sentenceSpeaks("line", "line"), true);
  assert.equal(sentenceSpeaks("line", "gate"), false);
  assert.equal(sentenceSpeaks("line", "week"), false);
  assert.equal(sentenceSpeaks("line", "touch"), false);
  assert.equal(sentenceSpeaks("all", "share"), true);
  assert.equal(chooseNextSentence({ ...offered, home: true }), "home");
  assert.equal(chooseNextSentence({ ...offered, line: false, hold: true }), "hold");
  assert.equal(sentenceSpeaks("hold", "gate"), false);
  assert.equal(chooseNextSentence({ ...offered, line: false }), "gate");
  assert.equal(chooseNextSentence({ ...offered, line: false, gate: false }), "welcome");
  assert.equal(
    chooseNextSentence({ ...offered, line: false, gate: false, welcome: false, done: ["share"] }),
    "week",
  );
  assert.equal(
    chooseNextSentence({ ...offered, line: false, gate: false, welcome: false, share: false, week: false }),
    "touch",
  );
  assert.equal(chooseNextSentence({ ...offered, line: false, gate: false, welcome: false, share: false }), "week");
  assert.equal(loudHitCount(["今日还空着，先做一件小事", "去看村口", "分享村子"]), 3);
  assert.equal(loudHitCount(["门灯还亮着"]), 1);
  assert.equal(loudHitCount(["先在地图上找我。"]), 0);
  assert.equal(headerRepeatsInvite("今日 · 周事 0/3"), false);
  assert.equal(headerRepeatsInvite(`今日还空着，先做一件小事 ${HEADER_SYNONYM}`), true);
  assert.equal(headerRepeatsInvite(HEADER_SYNONYM), true);
});
