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

/** Displayed ship. Must match package.json and the first RELEASES entry. */
export const APP_VERSION = "1.6.2";

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
    version: "1.6.2",
    date: "2026-10-01",
    title: "手感再暖一点",
    notes: [
      "木牌和按钮的边、影子更软，字还是看得清。",
      "地图上的缩放、找我、回家，还有底下的按钮，点一下会轻轻一缩，闪一下暖金。",
      "和「更多」那一下是同一种暖。减少动作时不缩，只留暖色。",
      "名牌的字距松一点，灰名牌不那么挤。",
      "草叶会轻轻动，灯笼会轻轻闪。减少动作或安静村子里，它们停住。",
    ],
  },
  {
    version: "1.6.1",
    date: "2026-10-01",
    title: "回家在底栏",
    notes: [
      "选定「我是谁」之后，底下「找我」旁边也有「回家」。点一下，镜头慢慢送到屋顶。减少动作时只移动镜头。",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-10-01",
    title: "慢慢住下",
    notes: [
      "隔天再来，地图上有一句很短的欢迎。当天再进，就不说了。",
      "今日仪式做完，地图角上留一处：长椅、湖边，或自己的屋顶。",
      "点一下，镜头过去。本周已经安顿时，这一处就让开。",
      "清晨进村，地图上写着门灯或露水。点一下镜头过去。这一趟只一次。",
      "底下的「回家」会慢慢送到自己的屋顶，再暖一下。",
      "做过一件小事，或做过今日仪式，「村里」的木牌会亮一会儿。",
      "夜里仪式做完，可以再看暖窗、湖上的星，或长椅。一次只留一处。",
      "出村时有一句很短的送别，不用再确认。",
      "不写说过的话。",
    ],
  },
  {
    version: "1.5.1",
    date: "2026-10-01",
    title: "再来一趟",
    notes: [
      "第一次来，地图上的「更多」整颗按钮会亮一会儿。",
      "点开它，或过一会儿，就不再亮。",
      "减少动作时只留一个静止的点。",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-10-01",
    title: "再来一趟",
    notes: [
      "平板上也先看见地图。页头收成一行，今日仪式收进「今日」。",
      "第一次来，「更多」上会轻轻亮一下。点开，或过一会儿，就不再亮。",
      "挥一下手、打开今日，或选定我是谁，今日可做打一个轻勾，换成下一句。",
      "没有弹窗。",
      "傍晚来的时候，地图上写着「灯笼该亮了」。点一下就去看灯笼。这一趟只一次。",
      "选定「我是谁」之后，镜头马上找到自己，底下换成回家。",
      "村里溜达的人在每处站一会儿，再走向下一处。",
      "页头的版本可以点开。更新日志就在眼前。",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-10-01",
    title: "手机也想多待",
    notes: [
      "窄屏上，页头收成一行。今日仪式、本周和季节收进「今日」，点开才展开。",
      "先看见地图。",
      "地图上平时只留缩放、找我和静音。图例、伸懒腰和相伴收进「更多」。",
      "还没选定「我是谁」时，底下只有这一颗。选定之后才有「回家」。",
      "灯笼、稻草人和路石平时不挡在地图上。点到它们，或打开「院子」，才看见亮灭和颗数。地上会亮一圈。",
      "村里溜达的人在自己田边走走停停，不再绕着村边跑圈。",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-10-01",
    title: "还想回村",
    notes: [
      "进村头半分钟，地图上角写着今日可做，三行都在。",
      "点门灯、做一件小事，或找一个人，提示就收起。",
      "页头版本旁边写着这一版的名字。打开木牌也能看见。",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-10-01",
    title: "还想回村",
    notes: [
      "进村头半分钟，地图角写着今日可做：门灯、本周小事、找一个人。",
      "做了一件，或者过了那一会儿，提示就淡掉。没有整页弹窗。",
      "再待一会儿时，湖边或门灯旁有一个轻轻的人影。",
      "点原来的小事，回执不变。",
      "信号卡写出关照次数、熟识次数，和上次关照的日期。",
      "不写说过的话。",
      "关掉静音之后，有很轻的风声和水声，垫在原来的短音下面。",
      "静音仍然默认开着。",
      "秋日的小路上，有几片叶子慢慢飘过。",
      "村里新事、小玩和屋边收进「村里」，默认合上。先看见地图。",
      "今日仪式做完，地图边上一圈暖光，只亮一次，不再提醒。",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-09-30",
    title: "再待一会儿",
    notes: [
      "本周做完、看过村口之后，地图角上留着两三件小事。",
      "点一下，镜头过去。做完会换一件，不赶时间。",
      "灯笼、稻草人和路石点下去，地图还留在眼前。",
      "名字和亮灭跟面板是同一套。",
      "安静时，靠近的名牌不再贴边叠在一起。",
      "远处的会淡。近处连自己最多八张。",
      "待着的时候，旁边的人会走过、坐下，或一起望向灯和湖。",
      "只是一下，可以关掉。不写说过的话。",
      "挥手、点灯、找我、再走一处，都有一句短回执。",
      "地图上留一圈，状态也跟着变。",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-09-30",
    title: "夜里还能认路",
    notes: [
      "夜里仍然是冷色。小路、水面、屋影和人影能认出来。",
      "秋日在地图上留几个暖点，不靠页头那一句。灯还是最亮的。",
      "本周三件做完，木牌外面多一颗「去看村口 / 湖边 / 长椅」。",
      "点一下，镜头过去，地上留一圈。不用先打开本周小事。",
      "灯笼、稻草人和路石点下去，镜头对准那一件。亮灭、歪头和石子跟面板一致。",
      "点门灯、挥手、找我各有一声短音。地图角上有「静音」和「氛围」。",
      "静音默认开着。开着就完全没声音。",
      "全显名牌不再整张地图一样浓。远看边上变淡，拉近后远处的名字收起。",
      "靠近的人仍清楚。关掉全显就回到安静村子的名牌。",
      "地图上的挥手也会应一声。安静村子里三秒内有回执，不记说过的话。",
    ],
  },
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

/** Player-facing name of the current ship. Brand stays 「像素公司村」. */
export function shipTitle(releases = RELEASES, version = APP_VERSION) {
  return currentRelease(releases, version)?.title ?? "";
}

/** Document title. Brand stays, and the current ship name follows it. */
export function documentTitle(releases = RELEASES, version = APP_VERSION) {
  const title = shipTitle(releases, version);
  if (!RELEASE_NOTES_ENABLED || !title) return "像素公司村";
  return `像素公司村 · ${title}`;
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
