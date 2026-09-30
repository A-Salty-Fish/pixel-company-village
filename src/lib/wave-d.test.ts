import assert from "node:assert/strict";
import test from "node:test";
import { AXIS_MARK } from "./interactions";
import { placeVillagers } from "./pixel-scene";
import { HISTORY_DAYS, festivalOf, shanghaiClock } from "./village-life";
import {
  CANNED_DIARY,
  EMPTY_WAVE,
  PIN_CAP,
  acceptTap,
  atlasRatio,
  buildDecor,
  bumpChronicle,
  copyIsClean,
  critterKind,
  decorParticleCount,
  diaryLine,
  duskActive,
  nightWash,
  giftNames,
  historyTicks,
  homeReady,
  isolatePeople,
  layoutBudget,
  LEGACY_WAVE_KEY,
  millAngle,
  migrateWaveKey,
  nodTargets,
  particleAllowance,
  pinResult,
  postcardMeta,
  seasonDecorLayer,
  publicCopyLines,
  pushFootprint,
  sanitizeWave,
  setDiary,
  setToggle,
  sitDown,
  starBudget,
  storageSweepPlan,
  strollPoints,
  togglePin,
  togglePorch,
  touchWaveDay,
  footprintMarks,
  visibleFootprints,
  SPLIT_CARD,
  SPLIT_MAP,
  clampSplit,
  stepSplit,
  undoSecondsLeft,
  undoStillOpen,
  visitorCopy,
  waterOnce,
  waveStorageKey,
  weatherFor,
  weekBoard,
  weekChores,
  choreAction,
  choreButtonCopy,
  choreStatusCopy,
  strollStepLine,
  weekTally,
  emptyViewerChores,
  rememberViewerChores,
  WEEK_DONE_LINE,
  WEEK_KEPT_LINE,
  noteWeekChore,
  readWeekMarks,
  addStrollStep,
  wreathColor,
} from "./wave-d";

test("weather is seeded by the date and ignores scores", () => {
  const first = weatherFor("2026-09-24");
  assert.equal(weatherFor("2026-09-24").id, first.id);
  assert.notEqual(weatherFor("2026-09-24").label.length, 0);
});

test("weekly chores check off from local actions and ignore unknown labels", () => {
  const quiet = {
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
  const board = weekBoard("2026-W39");
  assert.equal(weekChores("2026-W39", quiet).every((item) => item.done === false), true);
  assert.deepEqual(
    weekChores("2026-W39", quiet).map((item) => item.label),
    board.items,
  );
  const done = weekChores("2026-W39", {
    wateredToday: true,
    cardOpen: true,
    visitedGate: true,
    porchOn: true,
    diaryToday: true,
    steps: 3,
    pinned: true,
    resting: true,
    noticedSeason: true,
  });
  assert.equal(done.every((item) => item.done), true);
  assert.equal(weekChores("not-a-real-label", { ...quiet, wateredToday: true }).some((item) => item.label === "聊天原文"), false);
  assert.equal(choreAction("浇自己的田"), "water");
  assert.equal(choreAction("沿着小路走三步"), "steps");
  assert.equal(choreAction("聊天原文"), null);
  let stepped = addStrollStep(EMPTY_WAVE, 1);
  stepped = addStrollStep(stepped, 2);
  stepped = addStrollStep(stepped, 3);
  const held = addStrollStep(stepped, 4);
  assert.equal(held.footprints.length, 3);
  assert.equal(JSON.stringify(held).includes("聊天"), false);
  assert.equal(weekTally(weekChores("2026-W39", quiet)).complete, false);
  assert.equal(weekTally(done).complete, true);
  assert.equal(weekTally(done).done, 3);
  assert.equal(choreButtonCopy("沿着小路走三步", false, 0), "去做 · 沿着小路走三步");
  assert.equal(choreButtonCopy("沿着小路走三步", false, 2), "去做 · 沿着小路走三步 · 2/3");
  assert.equal(choreButtonCopy("浇自己的田", true, 0), "已做 · 浇自己的田");
  assert.equal(choreStatusCopy("沿着小路走三步", false, 1), "还没 · 沿着小路走三步 · 1/3");
  assert.equal(strollStepLine(0, 1), "沿小路走了一步。已走 1/3。");
  assert.equal(strollStepLine(2, 3), "沿小路走满三步了。");
  assert.equal(strollStepLine(0, 0), "脚印关着，这一步没记下。");
  assert.equal(WEEK_DONE_LINE.includes("聊天"), false);
  assert.equal(copyIsClean([WEEK_DONE_LINE, strollStepLine(0, 1)]), true);
  let book = rememberViewerChores(new Map(), "甲", { season: true, gate: true, porch: true });
  book = rememberViewerChores(book, "乙", { card: true });
  const again = rememberViewerChores(book, "甲", { season: true });
  assert.equal(again, book);
  assert.equal(book.get("甲")?.season, true);
  assert.equal(book.get("甲")?.gate, true);
  assert.equal(book.get("乙")?.season, false);
  assert.equal(book.get("乙")?.card, true);
  assert.equal(book.get("甲")?.card, false);
  assert.deepEqual(emptyViewerChores(), { card: false, porch: false, pin: false, sat: false, season: false, gate: false });
  assert.equal(rememberViewerChores(book, "", { season: true }), book);
  assert.equal(JSON.stringify([...book.values()]).includes("聊天"), false);
});

test("pins stay private and cap at three", () => {
  let pins: string[] = [];
  pins = togglePin(pins, "林小满");
  pins = togglePin(pins, "周晚风");
  pins = togglePin(pins, "苏星河");
  const blocked = pinResult(pins, "第四人");
  pins = blocked.pins;
  assert.equal(pins.length, PIN_CAP);
  assert.equal(blocked.hint.includes("最多钉三枚"), true);
  assert.equal(pins.includes("第四人"), false);
  pins = togglePin(pins, "林小满");
  assert.equal(pins.includes("林小满"), false);
});

test("diary stores a canned index and rejects free text", () => {
  const saved = setDiary(EMPTY_WAVE, "2026-09-30", 2);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.blob.diaryIndex, 2);
  assert.equal(diaryLine(saved.blob), CANNED_DIARY[2]);
  assert.equal(JSON.stringify(saved.blob).includes("聊天"), false);
  const bad = setDiary(EMPTY_WAVE, "2026-09-30", 99);
  assert.equal(bad.ok, false);
});

test("two viewers do not share wave keys", () => {
  assert.notEqual(waveStorageKey("林小满"), waveStorageKey("周晚风"));
  assert.match(waveStorageKey("林小满"), /^village:viewer:林小满:wave-d$/);
});

test("watering is once per day and quiet critters stay off", () => {
  const once = waterOnce(EMPTY_WAVE, "2026-09-30");
  assert.equal(once.ok, true);
  if (!once.ok) return;
  assert.equal(waterOnce(once.blob, "2026-09-30").ok, false);
  assert.equal(critterKind("summer", 12, true, true), "none");
  assert.equal(critterKind("summer", 21, false, true), "firefly");
  assert.equal(critterKind("summer", 12, false, true), "butterfly");
  assert.equal(critterKind("summer", 7, false, true), "sparrow");
  assert.equal(critterKind("summer", 23, false, true), "moth");
  assert.equal(critterKind("winter", 7, false, true), "none");
  assert.equal(nightWash(21, true), true);
  assert.equal(nightWash(12, true), false);
  assert.equal(nightWash(21, false), false);
  assert.equal(decorParticleCount(20, true), 0);
  assert.equal(decorParticleCount(20, false), 8);
});

test("chronicle counts events and never stores a sentence", () => {
  let blob = touchWaveDay(EMPTY_WAVE, "2026-09-30");
  blob = bumpChronicle(blob, "2026-09-30", "kindness");
  blob = bumpChronicle(blob, "2026-09-30", "kindness");
  const kindness = blob.chronicle.find((event) => event.kind === "kindness");
  assert.equal(kindness?.n, 2);
  assert.equal(JSON.stringify(blob.chronicle).includes("说"), false);
});

test("a bad villager is dropped without emptying the rest", () => {
  const isolated = isolatePeople([
    { name: "林小满", scored: true, work: 1, fish: 0, on_task: 0.5, msgs: 3 },
    { name: "坏\n名", scored: true, work: 1, fish: 1, on_task: 1 },
    null,
    { name: "周晚风", scored: false },
  ]);
  assert.equal(isolated.people.length, 2);
  assert.equal(isolated.dropped, 2);
  assert.equal(isolated.people[1]?.scored, false);
});

test("canned copy stays on the allowlist", () => {
  assert.equal(copyIsClean(publicCopyLines()), true);
  const board = weekBoard("2026-W39");
  assert.equal(board.items.length, 3);
  assert.match(board.note, /不公示/);
  assert.equal(postcardMeta("林小满", "2026-09-30").upload, false);
});

test("visitor, home, dusk, nods, and stars follow their switches", () => {
  assert.equal(visitorCopy(null, true)?.includes("访客"), true);
  assert.equal(visitorCopy("林小满", true), null);
  assert.equal(homeReady("林小满", true), true);
  assert.equal(homeReady(null, true), false);
  assert.equal(duskActive(18, true), true);
  assert.equal(duskActive(12, true), false);
  assert.deepEqual(nodTargets({ 林小满: 2, 周晚风: 1 }, true), ["林小满"]);
  assert.equal(starBudget(true, true, true), 0);
  assert.equal(starBudget(true, false, true) > 0, true);
});

test("footprints, stroll, bench, wreath, atlas, and layout stay bounded", () => {
  let steps = pushFootprint([], { x: 10.4, y: 20.2 }, 1_000);
  for (let i = 0; i < 20; i += 1) steps = pushFootprint(steps, { x: i, y: i }, 1_000 + i);
  assert.equal(steps.length <= 8, true);
  assert.equal(strollPoints("2026-09-30").length, 3);
  const sitting = sitDown(EMPTY_WAVE, 12.2, 40.8);
  assert.deepEqual(sitting.sit, { x: 12, y: 41 });
  assert.equal(sitDown(sitting, 1, 1).sit, null);
  assert.equal(wreathColor("autumn"), "#d46a32");
  assert.equal(atlasRatio(3, 6), 0.5);
  assert.equal(layoutBudget(60).labels, "stable");
  assert.equal(millAngle(10, true), 0);
  assert.equal(giftNames(["林小满"], "林小满", true).length, 1);
  assert.equal(acceptTap(0, 100), false);
  assert.equal(acceptTap(0, 400), true);
  assert.equal(undoStillOpen(500, 400), true);
  assert.equal(undoStillOpen(500, 500), false);
  const until = 10_000;
  assert.equal(undoSecondsLeft(until, until - 3_000), 3);
  assert.equal(undoSecondsLeft(until, until - 2_500), 3);
  assert.equal(undoSecondsLeft(until, until - 2_000), 2);
  assert.equal(undoSecondsLeft(until, until - 1_000), 1);
  assert.equal(undoSecondsLeft(until, until - 1), 1);
  assert.equal(undoSecondsLeft(until, until - 4_000), 3);
  assert.equal(undoSecondsLeft(until, until), 0);
  assert.equal(undoStillOpen(until, until - 2_500), true);
  assert.equal(clampSplit(0.1), 0.28);
  assert.equal(clampSplit(0.9), SPLIT_MAP);
  assert.equal(clampSplit(Number.NaN), 0.46);
  assert.equal(stepSplit(0.46, 0.04), 0.5);
  assert.equal(stepSplit(SPLIT_CARD, -0.04), 0.28);
  assert.equal(stepSplit(SPLIT_MAP, 0.04), SPLIT_MAP);
});

test("sanitize drops chat-shaped storage and keeps toggles", () => {
  const dirty = sanitizeWave({
    toggles: { weather: false, diary: true },
    diaryIndex: 1,
    pins: ["林小满", "太长的名字太长的名字太长的名字太长的名字太长的名字"],
    chronicle: [{ date: "2026-09-30", kind: "visit", n: 1 }, { date: "x", kind: "chat", n: 1 }],
    instrument: "flute",
  });
  assert.equal(dirty.toggles.weather, false);
  assert.equal(dirty.diaryIndex, 1);
  assert.deepEqual(dirty.pins, ["林小满"]);
  assert.equal(dirty.chronicle.length, 1);
  assert.equal(dirty.instrument, "flute");
  assert.equal(dirty.yard.henDay, null);
  const yardKept = sanitizeWave({
    yard: { henDay: "2026-09-30", bell: 2, laundry: true, text: "聊天原文", message: "他说" },
  });
  assert.equal(yardKept.yard.henDay, "2026-09-30");
  assert.equal(yardKept.yard.bell, 2);
  assert.equal(yardKept.yard.laundry, true);
  assert.equal(JSON.stringify(yardKept.yard).includes("原文"), false);
  const laneKept = sanitizeWave({
    lane: { wellDay: "2026-09-30", ducks: 2, lantern: true, text: "聊天原文" },
  });
  assert.equal(laneKept.lane.wellDay, "2026-09-30");
  assert.equal(laneKept.lane.ducks, 2);
  assert.equal(laneKept.lane.lantern, true);
  assert.equal(JSON.stringify(laneKept.lane).includes("原文"), false);
  assert.deepEqual(storageSweepPlan(["village:score-history-v1", "chat-transcript", "village:viewer:林:wave-d"]), [
    "chat-transcript",
  ]);
});

test("kept weekly chores stay on one week and drop free text", () => {
  const quiet = {
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
  const week = "2026-W40";
  const label = weekBoard(week).items[0];
  const noted = noteWeekChore(EMPTY_WAVE, week, label);
  assert.deepEqual(noted.weekMarks, { week, labels: [label] });
  assert.equal(noteWeekChore(noted, week, label), noted);
  assert.equal(noteWeekChore(EMPTY_WAVE, week, "聊天原文"), EMPTY_WAVE);
  assert.equal(noteWeekChore(EMPTY_WAVE, "not-a-week", label), EMPTY_WAVE);
  assert.equal(weekChores(week, quiet, noted.weekMarks).find((item) => item.label === label)?.done, true);
  assert.equal(weekChores("2026-W01", quiet, noted.weekMarks).some((item) => item.done), false);
  const nextLabel = weekBoard("2026-W41").items[0];
  const moved = noteWeekChore(noted, "2026-W41", nextLabel);
  assert.deepEqual(moved.weekMarks, { week: "2026-W41", labels: [nextLabel] });
  const cleaned = sanitizeWave({
    weekMarks: { week, labels: [label, "聊天原文", "自己写的一句"] },
  });
  assert.deepEqual(cleaned.weekMarks, { week, labels: [label] });
  assert.equal(readWeekMarks({ week: "2026-W40", labels: ["聊天原文"] }), null);
  assert.equal(copyIsClean([WEEK_KEPT_LINE]), true);
});

test("history ticks include the first and last day", () => {
  const dates = Array.from({ length: 30 }, (_, index) => `2026-09-${String(index + 1).padStart(2, "0")}`);
  const ticks = historyTicks(dates);
  assert.equal(ticks[0], dates[0]);
  assert.equal(ticks.at(-1), dates.at(-1));
});

test("four festival clocks resolve without throwing", () => {
  for (const iso of ["2026-02-04T02:00:00.000Z", "2026-05-05T02:00:00.000Z", "2026-08-07T02:00:00.000Z", "2026-11-07T02:00:00.000Z"]) {
    const clock = shanghaiClock(new Date(iso));
    const festival = festivalOf(clock);
    assert.ok(festival);
    const decor = buildDecor({
      blob: setToggle(EMPTY_WAVE, "stars", true),
      ymd: clock.ymd,
      hour: clock.hour,
      seasonId: "spring",
      quiet: true,
      reduced: false,
      festival: true,
      familiarity: {},
      selfName: null,
      fedNames: [],
      now: 0,
    });
    assert.equal(decor.stars, 0);
    assert.equal(decor.showWeather, true);
  }
});

test("acceptance helpers: fade, water day, migration, seasons, particles, shapes", () => {
  const steps = pushFootprint([], { x: 3, y: 4 }, 1_000);
  assert.equal(visibleFootprints(steps, 1_000 + 9_000).length, 0);
  assert.equal(visibleFootprints(steps, 1_500).length, 1);
  const fresh = footprintMarks(steps, 1_000);
  const faded = footprintMarks(steps, 1_000 + 6_000);
  assert.equal(fresh[0].alpha > faded[0].alpha, true);
  const spinning = buildDecor({
    blob: EMPTY_WAVE,
    ymd: "2026-09-30",
    hour: 12,
    seasonId: "summer",
    quiet: false,
    reduced: false,
    festival: false,
    familiarity: {},
    selfName: null,
    fedNames: [],
    now: 0,
  });
  assert.equal(spinning.mill, true);
  assert.equal(spinning.millSpin, true);
  assert.equal(spinning.critters, "butterfly");
  assert.equal(spinning.night, false);
  assert.equal(spinning.yard.on, true);
  assert.equal(spinning.yard.wear, true);
  assert.equal(spinning.yard.hen, false);
  assert.equal(spinning.lane.on, true);
  assert.equal(spinning.lane.bob, true);
  assert.equal(spinning.lane.well, false);
  assert.equal(spinning.weekRibbon, false);
  assert.equal(
    buildDecor({
      blob: EMPTY_WAVE,
      ymd: "2026-09-30",
      hour: 12,
      seasonId: "summer",
      quiet: false,
      reduced: false,
      festival: false,
      familiarity: {},
      selfName: null,
      fedNames: [],
      now: 0,
      weekDone: true,
    }).weekRibbon,
    true,
  );
  assert.equal(
    buildDecor({
      blob: setToggle(EMPTY_WAVE, "weekBoard", false),
      ymd: "2026-09-30",
      hour: 12,
      seasonId: "summer",
      quiet: false,
      reduced: false,
      festival: false,
      familiarity: {},
      selfName: null,
      fedNames: [],
      now: 0,
      weekDone: true,
    }).weekRibbon,
    false,
  );
  const watered = waterOnce(EMPTY_WAVE, "2026-09-30");
  assert.equal(watered.ok, true);
  if (!watered.ok) return;
  assert.equal(waterOnce(watered.blob, "2026-09-30").ok, false);
  assert.equal(waterOnce(watered.blob, "2026-10-01").ok, true);
  const store = new Map<string, string>([[LEGACY_WAVE_KEY, "{\"porch\":true}"]]);
  assert.equal(
    migrateWaveKey(
      "林小满",
      (key) => store.get(key) ?? null,
      (key, value) => {
        if (value === null) store.delete(key);
        else store.set(key, value);
      },
    ),
    true,
  );
  assert.equal(store.has(LEGACY_WAVE_KEY), false);
  assert.equal(store.get(waveStorageKey("林小满"))?.includes("porch"), true);
  assert.equal(migrateWaveKey("林小满", (key) => store.get(key) ?? null, () => {}), false);
  assert.deepEqual(
    ["spring", "summer", "autumn", "winter"].map((id) => seasonDecorLayer(id)),
    ["flower", "leaf", "fruit", "snow"],
  );
  assert.equal(particleAllowance(true, true), 0);
  assert.equal(particleAllowance(false, true) <= 8, true);
  assert.equal(new Set(Object.values(AXIS_MARK)).size, 3);
  assert.equal(HISTORY_DAYS, 30);
  assert.equal(weekBoard("2026-W40").items.length, 3);
  assert.equal(togglePorch(togglePorch(EMPTY_WAVE)).porch, false);
  const crowd = placeVillagers(
    Array.from({ length: 60 }, (_, index) => ({
      name: `村民${index}`,
      scored: false as const,
      state: "wander" as const,
      speed: 1,
      plot: index,
    })),
  );
  assert.equal(crowd.length, 60);
  assert.equal(layoutBudget(crowd.length).labels, "stable");
});
