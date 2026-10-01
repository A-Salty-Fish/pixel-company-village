import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  APP_VERSION,
  RELEASE_NOTES_ENABLED,
  RELEASES,
  currentRelease,
  documentTitle,
  playerFacingLines,
  releaseDateLabel,
  releaseNotesScrollable,
  releaseScrollDelta,
  releaseUiVisible,
  releaseWheelShouldCapture,
  releasesAreNewestFirst,
  shipTitle,
  versionLabel,
} from "@/features/village-release/changelog";

test("1.7.0 is the displayed ship and stays newest-first", () => {
  assert.equal(RELEASE_NOTES_ENABLED, true);
  assert.equal(APP_VERSION, "1.7.0");
  assert.equal(versionLabel(), "v1.7.0");
  assert.equal(releaseUiVisible(), true);
  assert.equal(releaseUiVisible(false), false);
  assert.equal(RELEASES[0]?.version, APP_VERSION);
  assert.equal(RELEASES[1]?.version, "1.6.4");
  assert.equal(RELEASES[2]?.version, "1.6.3");
  assert.equal(RELEASES[3]?.version, "1.6.2");
  assert.equal(RELEASES[4]?.version, "1.6.1");
  assert.equal(RELEASES[5]?.version, "1.6.0");
  assert.equal(RELEASES[6]?.version, "1.5.1");
  assert.equal(RELEASES[7]?.version, "1.5.0");
  assert.equal(RELEASES[8]?.version, "1.4.0");
  assert.equal(RELEASES[9]?.version, "1.3.1");
  assert.equal(RELEASES[10]?.version, "1.3.0");
  assert.equal(RELEASES[11]?.version, "1.2.0");
  assert.equal(RELEASES[12]?.version, "1.1.0");
  assert.equal(RELEASES[13]?.version, "1.0.0");
  assert.equal(releasesAreNewestFirst(RELEASES), true);
  assert.equal(releasesAreNewestFirst([]), false);
  assert.equal(releasesAreNewestFirst([{ ...RELEASES[0], version: "nope" }]), false);
  assert.equal(currentRelease()?.title, "还想点一下");
  assert.equal(shipTitle(), "还想点一下");
  assert.equal(documentTitle(), "像素公司村 · 还想点一下");
  assert.equal(documentTitle(RELEASES, APP_VERSION).startsWith("像素公司村"), true);
  assert.equal(RELEASES[1]?.title, "窄屏先看见田");
  assert.equal(RELEASES[2]?.title, "告别廉价");
  assert.equal(RELEASES[3]?.title, "夜里认得出村子");
  assert.equal(RELEASES[4]?.title, "回家在底栏");
  assert.equal(RELEASES[5]?.title, "慢慢住下");
  assert.equal(RELEASES[6]?.title, "再来一趟");
  assert.equal(RELEASES[7]?.title, "再来一趟");
  assert.equal(RELEASES[8]?.title, "手机也想多待");
  assert.equal(RELEASES[9]?.title, "还想回村");
  assert.equal(RELEASES[10]?.title, "还想回村");
  assert.equal(RELEASES[11]?.title, "再待一会儿");
  assert.equal(RELEASES[12]?.title, "夜里还能认路");
  assert.equal(RELEASES[13]?.title, "村里开张");
  assert.equal(releaseDateLabel("2026-09-30"), "2026年9月30日");
  assert.equal(releaseDateLabel("soon"), "soon");

  const lines = playerFacingLines();
  assert.equal(copyIsClean(lines), true);
  const blob = lines.join("\n");
  assert.equal(/SITE_PASSWORD|INGEST_SECRET|VILLAGE_ROSTER|VILLAGE_SEED/.test(blob), false);
  assert.equal(/他说|她说|原文/.test(blob), false);
  assert.match(blob, /农庄/);
  assert.match(blob, /分数环/);
  assert.match(blob, /挥回来/);
  assert.match(blob, /小桩/);
  assert.match(blob, /冷色/);
  assert.match(blob, /秋天/);
  assert.match(blob, /今日仪式/);
  assert.match(blob, /静音/);
  assert.match(blob, /说过的话/);
  assert.match(blob, /玩乐雷达/);
  assert.match(blob, /小路/);
  assert.match(blob, /去看村口/);
  assert.match(blob, /灯笼/);
  assert.match(blob, /短音/);
  assert.match(blob, /全显名牌/);
  assert.match(blob, /回执/);
  assert.match(blob, /再待一会儿/);
  assert.match(blob, /两三件小事/);
  assert.match(blob, /最多八张/);
  assert.match(blob, /短回执/);
  assert.match(blob, /还想回村/);
  assert.match(blob, /今日可做/);
  assert.match(blob, /地图上角/);
  assert.match(blob, /页头版本旁边/);
  assert.match(blob, /人影/);
  assert.match(blob, /上次关照/);
  assert.match(blob, /风声/);
  assert.match(blob, /叶子/);
  assert.match(blob, /默认合上/);
  assert.match(blob, /暖光/);
  assert.match(blob, /再来一趟/);
  assert.match(blob, /灯笼该亮了/);
  assert.match(blob, /轻轻亮一下/);
  assert.match(blob, /整颗按钮会亮一会儿/);
  assert.match(blob, /轻勾/);
  assert.match(blob, /站一会儿/);
  assert.match(blob, /更新日志就在眼前/);
  assert.match(blob, /手机也想多待/);
  assert.match(blob, /找我/);
  assert.match(blob, /回家/);
  assert.match(blob, /院子/);
  assert.match(blob, /村边/);
  assert.match(blob, /回家在底栏/);
  assert.match(blob, /找我」旁边也有「回家/);
  assert.match(blob, /告别廉价/);
  assert.match(blob, /影子轻了一点/);
  assert.match(blob, /不再像贴上去的纸片/);
  assert.match(blob, /路上的石子/);
  assert.match(blob, /眼睛先落在田上/);
  assert.match(blob, /窄屏先看见田/);
  assert.match(blob, /下半截不再空着一块深蓝色/);
  assert.match(blob, /按下去都暖一下/);
  assert.match(blob, /名字牌的字拉开了一点/);
  assert.match(blob, /灯笼会慢慢呼吸/);
  assert.match(blob, /慢慢住下/);
  assert.match(blob, /隔天再来/);
  assert.match(blob, /露水/);
  assert.match(blob, /自己的屋顶/);
  assert.match(blob, /木牌会亮一会儿/);
  assert.match(blob, /湖上的星/);
  assert.match(blob, /送别/);
  assert.match(blob, /夜里认得出村子/);
  assert.match(blob, /田、屋子和人/);
  assert.match(blob, /蓝色方块/);
  assert.match(blob, /更新日志可以自己滑动/);
  assert.match(blob, /名册不会跟着卷走/);
  assert.match(blob, /还想点一下/);
  assert.match(blob, /又见面了/);
  assert.match(blob, /淡脚印/);
  assert.match(blob, /今日摸一下村里/);
  assert.match(blob, /轻轻坐下/);
  assert.match(blob, /路上慢点/);
  assert.match(blob, /屋檐的小钉/);
  assert.match(blob, /很轻的落叶/);

  assert.equal(releaseNotesScrollable(), true);
  assert.equal(releaseNotesScrollable(false), false);
  assert.equal(releaseWheelShouldCapture(true), true);
  assert.equal(releaseWheelShouldCapture(false), false);
  assert.equal(releaseWheelShouldCapture(true, false), false);
  const page = releaseScrollDelta("PageDown", 400);
  assert.equal(page > 300, true);
  assert.equal(releaseScrollDelta("PageUp", 400), -page);
  assert.equal(releaseScrollDelta("ArrowDown", 400), 48);
  assert.equal(releaseScrollDelta("ArrowUp", 400), -48);
  assert.equal(releaseScrollDelta(" ", 400), 0);
  assert.equal(releaseScrollDelta("PageDown", 400, false), 0);

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  assert.equal(pkg.version, APP_VERSION);
});
