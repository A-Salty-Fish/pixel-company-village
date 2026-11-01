import assert from "node:assert/strict";
import test from "node:test";
import {
  BADGES,
  CHAIN_SPELLS,
  FULL_CHARGE_MS,
  LONG_PRESS_MS,
  PLAY_HOWTO,
  QUESTS,
  RUNE_GOAL,
  SUMMON_CAP,
  TRAIL_MAX,
  ULTIMATES,
  WISH_GOAL,
  bumpProgress,
  chainKind,
  chainStep,
  chargeLevel,
  chargeTier,
  countStep,
  dailyQuest,
  isDoubleTap,
  portalOther,
  questLine,
  readBadges,
  readProgress,
  streakStep,
  summonFor,
  trailLength,
  trailPush,
  unlockBadge,
  writeBadges,
  writeProgress,
} from "./magic-play";
import { PlayController, TRAIL_QUEST_PX, type PlayHost } from "./play-controller";
import { MAGIC_SFX_SPEC, magicSfxSpec } from "@/features/gesture-sfx/gesture-sfx";
import { copyIsClean } from "@/lib/wave-d";
import fs from "node:fs";
import path from "node:path";

function memoryStore() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

function fakeHost() {
  const casts: string[] = [];
  const marks: string[] = [];
  const host: PlayHost = {
    cast: (id) => void casts.push(id),
    castOn: (id) => void casts.push(`on:${id}`),
    transition: (id) => void marks.push(`transition:${id}`),
    play: {
      beam: (_a, _b, _c, _d, kind) => void marks.push(`beam:${kind}`),
      chorus: () => void marks.push("chorus"),
      chargeStart: () => void marks.push("charge"),
      chargeMove: () => void marks.push("move"),
      chargeEnd: () => [
        { x: 0, y: 0, at: 0 },
        { x: 40, y: 0, at: 0.1 },
        { x: 80, y: 0, at: 0.2 },
      ],
      summon: (summon) => void marks.push(`summon:${summon.id}`),
      showPips: (kind, n) => void marks.push(`pips:${kind}:${n}`),
    },
  };
  return { host, casts, marks };
}

test("every effect id the play rules cast is in the bundled pixelfx set", () => {
  const ids = [
    ...Object.values(CHAIN_SPELLS).flatMap((spell) => [spell.a, spell.b, spell.m]).filter(Boolean),
    ...Object.values(ULTIMATES).flat(),
    "spawn/coin-drop", "water/geyser", "holy/sunburst", "ui/quest-complete", "arcane/magic-circle-cast", "holy/holy-pillar",
    "pickups/collect-burst", "scifi/warp-out", "scifi/warp-in", "spawn/poof", "nature/healing-bloom", "holy/blessing", "status/charmed",
    "critters/frog", "critters/butterfly", "critters/slime", "critters/wisp", "critters/bird", "nature/thorns",
  ] as string[];
  for (const id of ids) assert.ok(fs.existsSync(path.join("src/vendor/pixelfx/fx", `${id}.js`)), id);
});

test("a chain links two different people inside the window and cycles link, swap, fuse", () => {
  const first = chainStep(null, { name: "a", x: 0, y: 0, at: 0 });
  assert.equal(first.from, null);
  const same = chainStep(first.mark, { name: "a", x: 0, y: 0, at: 100 });
  assert.equal(same.from, null);
  const linked = chainStep(first.mark, { name: "b", x: 9, y: 9, at: 4000 });
  assert.equal(linked.from?.name, "a");
  assert.equal(linked.mark, null);
  assert.equal(chainStep(first.mark, { name: "b", x: 0, y: 0, at: 6000 }).from, null);
  assert.deepEqual([0, 1, 2, 3].map(chainKind), ["link", "swap", "fuse", "link"]);
});

test("charge levels, tiers, double taps and trails", () => {
  assert.equal(chargeLevel(LONG_PRESS_MS), 0);
  assert.equal(chargeLevel(FULL_CHARGE_MS + 500), 1);
  assert.deepEqual([chargeTier(0), chargeTier(0.5), chargeTier(0.9)], [1, 2, 3]);
  assert.ok(ULTIMATES[3].length > ULTIMATES[1].length);
  assert.ok(isDoubleTap({ x: 0, y: 0, at: 0 }, { x: 5, y: 5, at: 200 }));
  assert.ok(!isDoubleTap({ x: 0, y: 0, at: 0 }, { x: 80, y: 0, at: 200 }));
  assert.ok(!isDoubleTap({ x: 0, y: 0, at: 0 }, { x: 0, y: 0, at: 900 }));
  let trail = trailPush([], { x: 0, y: 0, at: 0 });
  trail = trailPush(trail, { x: 1, y: 0, at: 0.01 });
  assert.equal(trail.length, 1, "tiny moves are skipped");
  for (let i = 1; i < 200; i += 1) trail = trailPush(trail, { x: i * 4, y: 0, at: i * 0.001 });
  assert.equal(trail.length, TRAIL_MAX);
  assert.ok(trailLength(trail) > 100);
  assert.equal(trailPush(trail, { x: 9999, y: 0, at: 99 }).length, 1, "old points fade out");
});

test("summons come every second ground tap, games count up and reset, portals pair up", () => {
  assert.equal(summonFor(1, 0), null);
  assert.ok(summonFor(2, 0));
  assert.ok(SUMMON_CAP <= 4);
  let wish = countStep(null, 0, WISH_GOAL);
  wish = countStep(wish.counter, 1000, WISH_GOAL);
  assert.equal(wish.counter.n, 2);
  assert.equal(countStep(wish.counter, 2000, WISH_GOAL).done, true);
  assert.equal(countStep(wish.counter, 60_000, WISH_GOAL).counter.n, 1, "a long pause starts over");
  assert.equal(RUNE_GOAL, 5);
  assert.equal(portalOther("gate-portal"), "warp-pad");
  assert.equal(portalOther("warp-pad"), "gate-portal");
  assert.equal(streakStep(streakStep(null, 0), 500).n, 2);
  assert.equal(streakStep(streakStep(null, 0), 5000).n, 1);
});

test("the daily quest is fixed by the date and progress only counts", () => {
  assert.equal(dailyQuest("2026-11-01").kind, dailyQuest("2026-11-01").kind);
  const kinds = new Set(Array.from({ length: 40 }, (_, i) => dailyQuest(`2026-12-${String(i + 1).padStart(2, "0")}`).kind));
  assert.ok(kinds.size >= 4);
  const quest = dailyQuest("2026-11-01");
  let progress = null;
  let finished = false;
  for (let i = 0; i < quest.goal; i += 1) ({ progress, finished } = bumpProgress(progress, "2026-11-01", quest.kind));
  assert.equal(finished, true);
  assert.match(questLine("2026-11-01", progress), /完成/);
  assert.match(questLine("2026-11-02", progress), /（0\//);
  assert.equal(questLine("2026-11-01", progress, false), "");
  const store = memoryStore();
  writeProgress(store, progress!);
  assert.deepEqual(readProgress(store, "2026-11-01").counts, progress!.counts);
  assert.deepEqual(readProgress(store, "2026-11-02").counts, {});
  const raw = store.data.get("village-magic-play-v1") ?? "";
  assert.doesNotMatch(raw, /name|text|message/i, "only counts are stored");
});

test("badges unlock once and store only ids", () => {
  const first = unlockBadge([], "first-chain");
  assert.equal(first.fresh, true);
  assert.equal(unlockBadge(first.have, "first-chain").fresh, false);
  assert.equal(unlockBadge([], "first-chain", false).fresh, false);
  const store = memoryStore();
  writeBadges(store, [...first.have, "not-a-badge"]);
  assert.deepEqual(readBadges(store), ["first-chain"]);
});

test("player-facing play copy is Chinese and clean", () => {
  const copy = [PLAY_HOWTO, ...QUESTS.flatMap((quest) => [quest.title, quest.hint]), ...Object.values(BADGES)];
  assert.ok(copyIsClean(copy));
  assert.match(PLAY_HOWTO, /长按/);
});

test("the controller turns gestures into casts, toasts and counted progress", () => {
  const store = memoryStore();
  const play = new PlayController(store, "2026-11-01");
  const { host, casts, marks } = fakeHost();
  assert.equal(play.tapPerson(host, { name: "a", x: 0, y: 0 }, 0), false);
  assert.equal(play.tapPerson(host, { name: "b", x: 40, y: 0 }, 1000), true);
  assert.ok(marks.includes("beam:link"));
  assert.ok(casts.includes("lightning/zap-hit"));
  let events = play.drain();
  assert.ok(events.some((event) => event.sfx === "chain"));
  assert.ok(events.some((event) => event.toast?.includes("初次连锁")));
  for (let i = 0; i < WISH_GOAL; i += 1) play.tapLandmark(host, "fountain", 2000 + i * 100);
  assert.ok(casts.includes("holy/sunburst"));
  assert.ok(marks.includes(`pips:wish:${WISH_GOAL}`));
  const go = play.tapLandmark(host, "gate-portal", 5000);
  assert.deepEqual(go.travel, { x: 34, y: 656 });
  play.tapLandmark(host, "warp-pad", 6000);
  assert.ok(play.snapshot.badges.includes("portal-trip"));
  assert.equal(play.tapLandmark(host, "pond", 7000).handled, false);
  assert.equal(play.tapGround(host, { x: 100, y: 100 }, 8000, 1), false);
  assert.equal(play.tapGround(host, { x: 300, y: 100 }, 9000, 1), true, "second ground tap summons");
  assert.ok(marks.some((mark) => mark.startsWith("summon:")));
  assert.equal(play.tapGround(host, { x: 302, y: 102 }, 9200, 1), true, "a double tap casts a small finisher");
  assert.ok(play.chargeStart(host, { x: 0, y: 0 }, 10_000));
  assert.equal(play.chargeRelease(host, { x: 0, y: 0 }, 10_000 + FULL_CHARGE_MS + 100), 3);
  assert.ok(casts.includes("arcane/time-stop"));
  assert.ok(play.snapshot.badges.includes("full-charge"));
  assert.ok(TRAIL_QUEST_PX <= 80);
  assert.equal(play.snapshot.progress.counts.trail, 1);
  assert.ok(play.chorus(host, { name: "a", x: 0, y: 0 }, { name: "b", x: 30, y: 0 }));
  assert.equal(play.chorus(host, { name: "a", x: 0, y: 0 }, { name: "a", x: 0, y: 0 }), false);
  for (let i = 0; i < 10; i += 1) play.streakTap(20_000 + i * 200);
  events = play.drain();
  assert.ok(events.some((event) => event.toast === "连击 ×10"));
  assert.ok(play.snapshot.badges.includes("streak-10"));
  for (const value of store.data.values()) assert.doesNotMatch(value, /"a"|"b"/, "no names in storage");
});

test("magic sounds stay quiet and obey mute", () => {
  for (const spec of Object.values(MAGIC_SFX_SPEC)) assert.ok(spec.gain <= 0.03);
  assert.equal(magicSfxSpec("badge", false), null);
  assert.ok(magicSfxSpec("badge", true));
});
