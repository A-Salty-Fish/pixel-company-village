import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import { comfortFromStorage, DEFAULT_COMFORT } from "@/lib/village-life";
import {
  AMBIENT_EFFECTS,
  DAILY_MAGICS,
  DEFAULT_MAGIC_LEVEL,
  KIND_SPELLS,
  LANDMARKS,
  MAGIC_LEVELS,
  PERSON_SPELLS,
  auraFor,
  dailyMagic,
  dailyMagicLine,
  groundSpell,
  hitLandmark,
  magicBudget,
  strainedBudget,
  magicLevelFrom,
  magicOn,
  pickAuras,
  pickSpell,
  sparkTier,
  triggerEffects,
  weatherBand,
  weatherPlan,
} from "./magic-town";

test("magic level defaults to many and survives junk in storage", () => {
  assert.equal(DEFAULT_MAGIC_LEVEL, "many");
  assert.equal(DEFAULT_COMFORT.magic, "many");
  assert.equal(magicLevelFrom("few"), "few");
  assert.equal(magicLevelFrom("off"), "off");
  assert.equal(magicLevelFrom("lots"), "many");
  assert.equal(magicLevelFrom(undefined), "many");
  assert.equal(comfortFromStorage(JSON.stringify({ magic: "off" })).magic, "off");
  assert.equal(comfortFromStorage("{}").magic, "many");
  assert.deepEqual(MAGIC_LEVELS.map((level) => level.label), ["多", "少", "关"]);
  assert.equal(magicOn("off"), false);
  assert.equal(magicOn("many", false), false);
});

test("budgets cap effects, shrink on phones and freeze for reduced motion", () => {
  const many = magicBudget("many", { reduceMotion: false, narrow: false });
  const phone = magicBudget("many", { reduceMotion: false, narrow: true });
  const few = magicBudget("few", { reduceMotion: false, narrow: false });
  const still = magicBudget("many", { reduceMotion: true, narrow: false });
  const off = magicBudget("off", { reduceMotion: false, narrow: false });
  assert.ok(many.on && many.animate);
  assert.ok(phone.auras < many.auras && phone.spells < many.spells && phone.weatherFps <= many.weatherFps);
  assert.ok(few.auras < many.auras && few.weather < many.weather && few.spells < many.spells);
  assert.equal(still.animate, false);
  assert.equal(still.spells, 0);
  assert.equal(still.weather, 0);
  assert.equal(off.on, false);
  for (const budget of [many, phone, few]) assert.ok(budget.auras <= 18 && budget.spells <= 10 && budget.weather <= 2);
  const slow = strainedBudget(phone);
  assert.ok(slow.weather <= 1 && slow.weatherFps <= 8 && slow.auras <= 6 && slow.spells <= 4 && slow.landmarks === phone.landmarks);
  assert.deepEqual(strainedBudget(still), still);
  assert.deepEqual(strainedBudget(off), off);
});

test("auras come only from numbers", () => {
  assert.equal(auraFor({ scored: false })?.kind, "sleepy");
  assert.equal(auraFor({ scored: true, work: 4, fish: 1, on_task: 0.5, msgs: 10 })?.kind, "arcane");
  assert.equal(auraFor({ scored: true, work: 1, fish: 1, on_task: 0.95, msgs: 10 })?.kind, "holy");
  assert.equal(auraFor({ scored: true, work: 1, fish: 4, on_task: 0.2, msgs: 10 })?.kind, "fish");
  assert.equal(auraFor({ scored: true, work: 1, fish: 1, on_task: 0.3, msgs: 10 }), null);
  assert.equal(sparkTier(0), 0);
  assert.equal(sparkTier(40), 1);
  assert.equal(sparkTier(500), 2);
  const list = Array.from({ length: 40 }, (_, i) => ({ aura: auraFor({ scored: true, work: (i % 5) + 1, fish: 0, on_task: 0, msgs: i }) }));
  assert.ok(pickAuras(list, 6).length <= 6);
});

test("spells, landmarks and the ground give something to tap", () => {
  assert.ok(PERSON_SPELLS.length >= 12);
  assert.ok(KIND_SPELLS.length >= 3);
  assert.notEqual(pickSpell(PERSON_SPELLS, 0, PERSON_SPELLS[0]), PERSON_SPELLS[0]);
  for (const landmark of LANDMARKS) assert.equal(hitLandmark(landmark.x, landmark.y)?.id, landmark.id);
  assert.equal(hitLandmark(-500, -500), null);
  const pond = LANDMARKS.find((landmark) => landmark.id === "pond");
  assert.ok(pond);
  assert.equal(groundSpell(pond.x, pond.y), "water/splash");
  assert.equal(groundSpell(900, 900), "village/ground-glint");
});

test("at least twenty effects can be triggered", () => {
  const all = triggerEffects();
  assert.ok(all.length >= 20, `only ${all.length}`);
  assert.equal(new Set(all).size, all.length);
  assert.ok(AMBIENT_EFFECTS.length >= 20);
});

test("daily magic is stable per day and the copy stays clean", () => {
  assert.equal(dailyMagic("2026-11-01").id, dailyMagic("2026-11-01").id);
  const seen = new Set(Array.from({ length: 60 }, (_, i) => dailyMagic(`2026-11-${String((i % 30) + 1).padStart(2, "0")}-${i}`).id));
  assert.ok(seen.size >= 4);
  assert.match(dailyMagicLine("2026-11-01"), /^今日魔法：/);
  assert.equal(dailyMagicLine("2026-11-01", false), "");
  const copy = [
    ...DAILY_MAGICS.flatMap((day) => [day.title, day.line, dailyMagicLine("2026-11-01")]),
    ...LANDMARKS.map((landmark) => landmark.title),
    ...MAGIC_LEVELS.map((level) => level.label),
  ];
  assert.ok(copyIsClean(copy));
  for (const line of copy) assert.doesNotMatch(line, /聊天|消息内容|飞书|原文|说了/);
});

test("weather follows night, season and the daily pick", () => {
  const night = weatherPlan({ night: true, seasonId: "autumn", hour: 23, daily: null });
  assert.equal(night[0], "weather/fireflies");
  assert.ok(night.includes("weather/aurora"));
  const day = weatherPlan({ night: false, seasonId: "spring", hour: 12, daily: null });
  assert.equal(day[0], "weather/cherry-blossoms");
  assert.ok(!day.includes("weather/aurora"));
  const snowDay = weatherPlan({ night: false, seasonId: "autumn", hour: 12, daily: DAILY_MAGICS.find((d) => d.id === "snowglobe") ?? null });
  assert.equal(snowDay[0], "weather/snow");
  assert.deepEqual(weatherBand("weather/aurora"), { top: 0, bottom: 0.5 });
});
