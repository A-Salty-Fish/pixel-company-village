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
export const APP_VERSION = "1.14.0";

/** The open log captures wheel, touch, and PageDown. Set false to leave page scroll alone. */
export const RELEASE_SCROLL_ENABLED = true;

export function releaseNotesScrollable(enabled = RELEASE_SCROLL_ENABLED) {
  return enabled;
}

/** While the plaque is open, wheel and touch stay on the log. */
export function releaseWheelShouldCapture(open: boolean, enabled = RELEASE_SCROLL_ENABLED) {
  return enabled && open;
}

/**
 * PageDown / PageUp / arrows move the log by a viewport chunk.
 * Returns 0 for keys that should stay with buttons and fields.
 */
export function releaseScrollDelta(key: string, viewportPx: number, enabled = RELEASE_SCROLL_ENABLED) {
  if (!enabled) return 0;
  const view = Math.max(1, Math.round(viewportPx));
  if (key === "PageDown") return Math.round(view * 0.85);
  if (key === "PageUp") return -Math.round(view * 0.85);
  if (key === "ArrowDown") return 48;
  if (key === "ArrowUp") return -48;
  return 0;
}

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
    version: "1.14.0",
    date: "2026-10-03",
    title: "一句就够",
    notes: [
      "选定自己之后，田上只留一句接下来要做的话。做完或关掉，下一句才来。",
      "页头不再另写一句同样的邀请。",
      "第一次的提示跟着页面走，不挡住分栏，也不盖住村里。",
      "已经选定自己，这句提示就不再说先选定。",
      "减少动作那一句停在体贴设置上。",
    ],
  },
  {
    version: "1.13.0",
    date: "2026-10-02",
    title: "走进田",
    notes: [
      "第一次进村，那一句提示停在底栏上面，留出一点空。点「知道了」，底栏还在。",
      "点「我是谁」，名字就落在眼前。选定之后，镜头回到这个人。",
      "还没选定自己时，地图上只留一句邀请。",
      "名册先收成自己、有分的人，和还有几人。展开仍能看见还没分。",
      "页头的更多只留刷新和出村。",
      "页脚改成一句人话。",
      "地图上的更多只多出图例、院子和名牌。",
    ],
  },
  {
    version: "1.12.0",
    date: "2026-10-02",
    title: "名册安静点",
    notes: [
      "没打分的人，名册上「未评分」只写一次。按钮改成「还没分」。",
      "「回家」只留在底下的大按钮。地图上改成「屋」。",
      "第一次进村，先选定我是谁，再去找我或看村口。减动在体贴设置里。",
      "地图还没铺好时，先看见「田还在」，不是一块空板。",
      "本周还空着时，页头有一句邀请。点两下就能做一件小事。",
      "手机上名册抬到设置和日志前面。抽屉先合着。",
      "看过更新日志，或第二次进村，页头只留村子的名字。",
      "选定自己之后，挥手和相伴收成一颗「招呼」。",
    ],
  },
  {
    version: "1.11.3",
    date: "2026-10-02",
    title: "轻轻一下",
    notes: [
      "点开一个人，卡片边上轻轻扁一下，很快就回来。安静村子里这一下没有。",
      "挥手按下去能看出来。邻里应的那一句像递来的小礼物，不是弹出来的提示。安静时就停着。",
      "去看村口、湖边或长椅，镜头慢慢停稳。窄的手机上也不抖。安静时直接就到。",
    ],
  },
  {
    version: "1.11.2",
    date: "2026-10-02",
    title: "看得清楚一点",
    notes: [
      "人站在草地上，边上多了一点深色。还是同一个人，不是方框。",
      "路上的石子都暖了，一块一块颜色更齐。",
      "傍晚再沉一点，夜里也再沉一点。黑的地方还留着。",
      "傍晚安静的时候，窗子还是亮的。",
      "木牌边上多了一道亮、一道暗，木纹细一点。大小还是原来的。",
      "田边多了一根篱笆桩和一小簇野花。不挡路，也不挡点人。",
    ],
  },
  {
    version: "1.11.1",
    date: "2026-10-02",
    title: "提示还在",
    notes: [
      "还没选定「我是谁」时，第一条提示会出来。点「知道了」就收起。",
    ],
  },
  {
    version: "1.11.0",
    date: "2026-10-02",
    title: "认得自己",
    notes: [
      "选定「我是谁」之后，自己的名牌和脚下马上暖一下。不用先点「找我」。安静时也不闪。",
      "自己名牌底下不再垫着一圈黄括号。旁边的人名牌还是原来的样子。",
      "点「找我」，路上留两三颗暖石，旁边短短一句。安静时石子停着。",
      "点「回家」，会说「灶还温着。」可以收起。安静时这句话还在，也不闪。",
      "夜里十点之后，自己和近处的名牌清楚一点。远处的还是淡的。",
      "第一次进村，一次只看见一条提示。点「知道了」就收起，刷新也不再出现。不挡住地图。",
    ],
  },
  {
    version: "1.10.0",
    date: "2026-10-02",
    title: "窄屏先看清",
    notes: [
      "手机上打开分享时，别的牌子先收起来。只留分享卡片和底下的栏。",
      "手机上的提示改成拖动和双指捏合。去下一处的按钮就在第一屏，不用先做完本周。",
      "挥手和相伴在第一屏。挥一下，旁边会应一小会儿。相伴开着还是关着，一眼能看出来。",
      "点了去下一处，路上的暖点更清楚。做完可以收起下一句。安静时暖点停着。",
    ],
  },
  {
    version: "1.9.2",
    date: "2026-10-02",
    title: "窗子还暖着",
    notes: [
      "夜里有几扇窗子会慢慢亮一亮。减少动作时停在暖光上，不闪。",
      "分数小牌和地图按钮更像暖木头。大小还是原来的。",
      "田的空角有几簇草和石子。不挡路，也不挡点人。",
    ],
  },
  {
    version: "1.9.1",
    date: "2026-10-02",
    title: "挥手也亮一下",
    notes: [
      "相伴开着时，从人的卡片上挥手，旁边也会亮一小会儿，脚下留一圈。",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-10-02",
    title: "还想回村",
    notes: [
      "点一个人，脚下轻轻弹一下，很快就停。",
      "清晨、白天、傍晚和夜里，天边的颜色不一样。夜里的路还认得出。",
      "减少动作时，路口的暖石停着，不闪。",
      "往下一处走，路上留两三颗暖点。安静时也不闪。",
      "进村时，地图边上轻轻说一句。可以收起。",
      "手机上先看见的还是田。图例和设置收着，不把地图挤扁。",
      "相伴开着能看出来。挥手之后，旁边亮一小会儿。",
      "可以分享村子。只带日期、人数和名字，不带说过的话。",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-10-01",
    title: "还想多看一眼",
    notes: [
      "小路边上多了草和花，路口留着空。",
      "屋顶多一条亮边，墙的一边暗一点。屋子不再平平一片。",
      "人脚下的影子更软，轮廓清楚一点。",
      "木牌和按钮换成暖木头，看着不像表格。",
      "夜里窗子还是暖的。手机下半截仍是田，不是深蓝空地。",
      "进村头半分钟，眼睛先被路口拉过去。减少动作时停着。",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-10-01",
    title: "还想点一下",
    notes: [
      "同一天再进村，页头轻轻写着「又见面了」，很快就淡掉。只记日期。",
      "点过「找我」，脚下留几枚淡脚印，慢慢消失。减少动作时只留一枚。",
      "选定「我是谁」之后，页头有一条「今日摸一下村里」。",
      "找我、回家，或今日仪式，做了一样就打勾，然后收起。不公示。",
      "在广场附近停一会儿，会有人轻轻坐下。减少动作时就站着。",
      "夜里出村，会轻轻说一句「路上慢点」。这一晚只一次，可以先走。",
      "自家屋檐的小钉会慢慢亮一亮。点「回家」时再亮一下。",
      "十月里有几片很轻的落叶，别的月份更淡。安静村子里不飘。减少动作时叶子停住。",
    ],
  },
  {
    version: "1.6.4",
    date: "2026-10-02",
    title: "窄屏先看见田",
    notes: [
      "手机上的地图下半截不再空着一块深蓝色。先看见的是田、路和屋子。",
    ],
  },
  {
    version: "1.6.3",
    date: "2026-10-01",
    title: "告别廉价",
    notes: [
      "木牌和按钮的影子轻了一点，字还是看得清。按下去都暖一下。",
      "名字牌的字拉开了一点。草会轻轻歪，灯笼会慢慢呼吸。",
      "减少动作时，草和灯笼停住。",
      "田里多了屋檐、脚下的影子和路上的石子。点人还是点得到。",
      "人会轻轻动一下，不再像贴上去的纸片。",
      "手机第一眼先看见村子。眼睛先落在田上。",
    ],
  },
  {
    version: "1.6.2",
    date: "2026-10-01",
    title: "夜里认得出村子",
    notes: [
      "夜里在手机上也能看见田、屋子和人。冷色还在，不再是一整块黑。",
      "地图左上角不再多出一块蓝色方块。",
      "更新日志可以自己滑动。后面的名册不会跟着卷走。",
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
