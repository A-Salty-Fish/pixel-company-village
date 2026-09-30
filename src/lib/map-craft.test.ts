import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_WAVE, buildDecor, copyIsClean, publicCopyLines } from "./wave-d";
import {
  WEATHER_NOTES,
  ambientMotes,
  bedCrops,
  buildPathGrid,
  cropAccents,
  distanceSilhouette,
  fencePosts,
  grassTufts,
  pathMarks,
  plateAlpha,
  pondLife,
  porchWindows,
  propPixels,
  seasonWash,
  showNameplate,
  smokePuffs,
  soilTiles,
  weatherMotes,
  yardFences,
  yardProps,
  type PlotRef,
} from "./map-craft";

function plot(index: number, extra: Partial<PlotRef> = {}): PlotRef {
  return {
    index,
    x: 32 + (index % 10) * 112,
    y: 240 + Math.floor(index / 10) * 80,
    col: index % 10,
    orchard: false,
    cropRow: index % 10,
    cropSide: index % 2,
    ...extra,
  };
}

test("path craft marks junctions, ruts, pebbles, and moss", () => {
  const grid = buildPathGrid(76, 70);
  assert.equal(grid[13][37], true);
  assert.equal(grid[12][37], false);
  assert.equal(grid[40][10], true);
  const marks = pathMarks(grid);
  const tones = new Set(marks.map((mark) => mark.color));
  assert.equal(tones.has("#d7c4a4"), true);
  assert.equal(tones.has("#c4a060"), true);
  assert.equal(tones.has("#efe0c0"), true);
  assert.equal(tones.has("#3a7d4a"), true);
  const junction = marks.find((mark) => mark.color === "#d7c4a4" && Math.floor(mark.x / 16) === 37);
  assert.ok(junction);
  assert.equal(junction.w >= 8, true);
});

test("yards grow fences, crops, soil, and tools without covering orchards", () => {
  const plots = Array.from({ length: 24 }, (_, index) => plot(index, { orchard: index % 7 === 2 }));
  const fences = yardFences(plots);
  assert.equal(fences.some((fence) => fence.sprite === "fence_0"), true);
  assert.equal(fences.some((fence) => fence.sprite === "fence_1"), true);
  assert.equal(fences.some((fence) => fence.gate), true);
  assert.equal(fences.every((fence) => fence.posts.length === 2), true);
  const posts = fencePosts(fences);
  assert.equal(posts.some((pixel) => pixel.color === "#6a3d18"), true);
  const bed = bedCrops(plot(1));
  assert.equal(bed.length >= 6, true);
  assert.equal(bed.every((spot) => /^crop_\d_\d_[0-3]$/.test(spot.sprite)), true);
  assert.equal(bedCrops(plot(2, { orchard: true })).length, 0);
  const accents = cropAccents(bed);
  assert.equal(accents.some((pixel) => pixel.color === "#c44b3a" || pixel.color === "#7dba6a"), true);
  const soil = soilTiles(plot(3));
  assert.equal(soil.some((tile) => tile.name === "soil_edge"), true);
  assert.equal(soil.some((tile) => tile.name === "soil_wet"), true);
  assert.equal(soil.some((tile) => tile.name === "soil_dry"), true);
  const props = yardProps(plots);
  assert.equal(props.some((prop) => prop.kind === "lantern"), true);
  assert.equal(props.some((prop) => prop.kind === "scarecrow" || prop.kind === "hoe" || prop.kind === "can"), true);
  const crow = props.find((prop) => prop.kind === "scarecrow");
  assert.ok(crow);
  assert.equal(propPixels(crow, false).some((pixel) => pixel.color === "#c44b3a"), true);
  const lantern = props.find((prop) => prop.kind === "lantern");
  assert.ok(lantern);
  const dark = propPixels(lantern, false).map((pixel) => pixel.color).join(",");
  const lit = propPixels(lantern, true).map((pixel) => pixel.color).join(",");
  assert.notEqual(dark, lit);
});

test("porch and dusk windows stay still when motion is reduced", () => {
  assert.equal(porchWindows(false, false, false, 1).length, 0);
  const dusk = porchWindows(true, false, true, 0);
  assert.equal(dusk.some((pixel) => pixel.color === "#f2d15c"), true);
  assert.deepEqual(porchWindows(true, true, true, 0), porchWindows(true, true, true, 4.5));
  assert.notDeepEqual(porchWindows(true, true, false, 0), porchWindows(true, true, false, 1));
  const porch = porchWindows(false, true, true, 0);
  assert.equal(porch.some((pixel) => pixel.w === 8), true);
});

test("weather, smoke, pond, and pollen freeze under reduced motion", () => {
  const still = { id: "drizzle" as const, viewW: 320, viewH: 240, reduced: true, quiet: false };
  assert.deepEqual(weatherMotes({ ...still, t: 0.2 }), weatherMotes({ ...still, t: 9 }));
  const moving = weatherMotes({ ...still, reduced: false, t: 0 });
  const later = weatherMotes({ ...still, reduced: false, t: 3 });
  assert.notDeepEqual(moving, later);
  const quiet = weatherMotes({ ...still, quiet: true, t: 1 });
  assert.equal(quiet.length < moving.length, true);
  assert.equal(quiet.length > 0, true);
  assert.deepEqual(smokePuffs(0.2, true), smokePuffs(6, true));
  assert.notDeepEqual(smokePuffs(0, false), smokePuffs(1, false));
  const pond = { c0: 2, r0: 2, c1: 13, r1: 7 };
  assert.deepEqual(pondLife(pond, 0, true), pondLife(pond, 5, true));
  assert.notDeepEqual(pondLife(pond, 0, false), pondLife(pond, 4, false));
  assert.equal(pondLife(pond, 0, true).some((pixel) => pixel.color === "#7dba6a"), true);
  const pollen = { seasonId: "spring", viewW: 200, viewH: 120, reduced: true, quiet: false };
  assert.deepEqual(ambientMotes({ ...pollen, t: 0 }), ambientMotes({ ...pollen, t: 8 }));
  assert.equal(ambientMotes({ seasonId: "autumn", viewW: 200, viewH: 120, t: 1, reduced: false, quiet: true }).length, 0);
  const breeze = weatherMotes({ id: "breeze", viewW: 300, viewH: 200, t: 0, reduced: false, quiet: false });
  const blown = weatherMotes({ id: "breeze", viewW: 300, viewH: 200, t: 4, reduced: false, quiet: false });
  assert.notEqual(breeze[0]?.x, blown[0]?.x);
});

test("season washes differ and grass tufts avoid the path", () => {
  const seasons = ["spring", "summer", "autumn", "winter"].map((id) => seasonWash(id, 400, 300));
  assert.equal(new Set(seasons.map((wash) => wash[0]?.color)).size, 4);
  assert.equal(seasons.every((wash) => wash.length === 4), true);
  const grid = buildPathGrid(20, 20);
  const tufts = grassTufts(20, 20, grid, { c0: 2, r0: 2, c1: 6, r1: 5 }, [], 16);
  const bases = tufts.filter((pixel) => pixel.w === 3);
  assert.equal(bases.length > 0, true);
  assert.equal(
    bases.some((pixel) => {
      const c = Math.floor(pixel.x / 16);
      const r = Math.floor(pixel.y / 16);
      return Boolean(grid[r]?.[c]);
    }),
    false,
  );
});

test("far villagers stay readable while cold nameplates stay hidden", () => {
  assert.equal(showNameplate(1, false, false), false);
  assert.equal(showNameplate(1, true, false), true);
  assert.equal(showNameplate(1, false, true), true);
  assert.equal(showNameplate(2, false, false), true);
  assert.equal(plateAlpha("muted", 1) > plateAlpha("muted", 2), true);
  assert.equal(plateAlpha("hot", 1), 1);
  const far = distanceSilhouette(1, true);
  const near = distanceSilhouette(3, true);
  assert.equal(far.far, true);
  assert.equal(near.cap, null);
  assert.ok(far.cap);
  assert.equal(far.shadow.w > near.shadow.w, true);
  assert.equal(far.dot > near.dot, true);
  assert.equal(distanceSilhouette(1, false).pip?.color, "#8a8478");
  assert.equal(far.pip?.color, "#f2d15c");
});

test("weather notes stay canned and the decor carries a weather id", () => {
  assert.equal(copyIsClean(Object.values(WEATHER_NOTES)), true);
  assert.equal(copyIsClean(publicCopyLines()), true);
  const first = buildDecor({
    blob: EMPTY_WAVE,
    ymd: "2026-09-26",
    hour: 10,
    seasonId: "autumn",
    quiet: true,
    reduced: true,
    festival: false,
    familiarity: {},
    selfName: null,
    fedNames: [],
    now: 0,
  });
  const again = buildDecor({
    blob: EMPTY_WAVE,
    ymd: "2026-09-26",
    hour: 10,
    seasonId: "autumn",
    quiet: false,
    reduced: false,
    festival: false,
    familiarity: {},
    selfName: null,
    fedNames: [],
    now: 0,
  });
  assert.equal(first.weatherId, again.weatherId);
  assert.equal(WEATHER_NOTES[first.weatherId].length > 0, true);
  assert.equal(first.showWeather, true);
});
