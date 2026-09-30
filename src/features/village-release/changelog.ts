/**
 * Player-facing version and changelog. The village UI reads only this file.
 *
 * Keep package.json "version" equal to APP_VERSION.
 * Before merging a ship:
 * - minor bump for a feature round (1.0.0 → 1.1.0)
 * - patch bump for a fix (1.0.0 → 1.0.1)
 * - prepend one RELEASES entry in Chinese a player can feel
 * Do not paste commit dumps, chat text, or secrets.
 * Full steps: CHANGELOG.md
 *
 * Set RELEASE_NOTES_ENABLED to false to hide the header chip and the board.
 */

export const RELEASE_NOTES_ENABLED = true;

/** Current production baseline. Everything already on main counts as this release. */
export const APP_VERSION = "1.0.0";

export const RELEASE_BOARD_TITLE = "更新日志";

export const RELEASE_BOARD_INTRO = "村里新事记在这块木牌上。只写进村能感到的变化，不写谁说过什么。";

export type ReleaseNote = {
  version: string;
  /** ISO date, shown as 2026年9月30日. */
  date: string;
  title: string;
  notes: string[];
};

/** Newest first. Prepend the next ship; do not rewrite older notes. */
export const RELEASES: ReleaseNote[] = [
  {
    version: "1.0.0",
    date: "2026-09-30",
    title: "村里开张",
    notes: [
      "村里是一块俯视农庄。每人一只猫，站在自己的田边。",
      "点开一个人，能看见干活、摸鱼、在任务上三枚分数环。",
      "消息只计条数。这里不出现说过的话。",
      "挥一下，对方会挥回来；关照久了，脚下多一枚小桩。",
      "夜里罩一层冷色，屋子还留着暖窗。",
      "秋天的天和地会换成暖一点的颜色。",
      "页头有今日仪式：早上点门灯，中午田边站一会儿，傍晚点头收工。",
      "轻声默认关着。想听按钮轻点，到体贴设置里去掉静音。",
      "天气、浇水、本周小事都在这台电脑上，可以关掉。",
      "分数是玩乐雷达，不是绩效。",
    ],
  },
];

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function versionLabel(version = APP_VERSION) {
  return `v${version}`;
}

export function releaseDateLabel(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

export function currentRelease(releases = RELEASES, version = APP_VERSION) {
  return releases.find((item) => item.version === version) ?? null;
}

export function releaseUiVisible(enabled = RELEASE_NOTES_ENABLED) {
  return enabled && currentRelease() !== null;
}

export function semverParts(version: string): [number, number, number] | null {
  const match = SEMVER.exec(version);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** True when versions are unique, valid, and strictly newest-first. */
export function releasesAreNewestFirst(releases: ReleaseNote[]) {
  const parts = releases.map((item) => semverParts(item.version));
  if (parts.some((item) => item === null)) return false;
  const parsed = parts as [number, number, number][];
  for (let i = 1; i < parsed.length; i += 1) {
    const prev = parsed[i - 1];
    const next = parsed[i];
    if (!prev || !next) return false;
    for (let slot = 0; slot < 3; slot += 1) {
      if (prev[slot] > next[slot]) break;
      if (prev[slot] < next[slot]) return false;
      if (slot === 2) return false;
    }
  }
  return releases.length > 0;
}

/** Every string the board and the version chip can show. */
export function playerFacingLines(releases = RELEASES) {
  const lines = [RELEASE_BOARD_TITLE, RELEASE_BOARD_INTRO, versionLabel()];
  for (const release of releases) {
    lines.push(versionLabel(release.version), release.title, releaseDateLabel(release.date), ...release.notes);
  }
  return lines;
}
