import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  APP_VERSION,
  RELEASE_NOTES_ENABLED,
  RELEASES,
  currentRelease,
  playerFacingLines,
  releaseDateLabel,
  releaseUiVisible,
  releasesAreNewestFirst,
  versionLabel,
} from "@/features/village-release/changelog";

test("1.0.0 is the player-facing baseline", () => {
  assert.equal(RELEASE_NOTES_ENABLED, true);
  assert.equal(APP_VERSION, "1.0.0");
  assert.equal(versionLabel(), "v1.0.0");
  assert.equal(releaseUiVisible(), true);
  assert.equal(releaseUiVisible(false), false);
  assert.equal(RELEASES[0]?.version, APP_VERSION);
  assert.equal(releasesAreNewestFirst(RELEASES), true);
  assert.equal(releasesAreNewestFirst([]), false);
  assert.equal(releasesAreNewestFirst([{ ...RELEASES[0], version: "nope" }]), false);
  assert.equal(currentRelease()?.title, "村里开张");
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

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  assert.equal(pkg.version, APP_VERSION);
});
