import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_LANDMARK,
  gateFlowers,
  handToolPixels,
  homesteadPixels,
  homesteadProps,
  landmarkPixels,
  nightHour,
  nightSky,
  pondFish,
  seasonBedPixels,
  seasonMark,
  seasonWindowTint,
  weatherGround,
  yardDetailPixels,
} from "./season-craft";

const spot = { x: 40, y: 80, stage: 3 };

test("season beds change color and summer shimmer stops when reduced", () => {
  const spring = seasonBedPixels([spot], "spring", 1, true);
  const autumn = seasonBedPixels([spot], "autumn", 1, true);
  const winter = seasonBedPixels([spot], "winter", 1, true);
  assert.equal(spring.some((pixel) => pixel.color === "#f4b4c4"), true);
  assert.equal(autumn.some((pixel) => pixel.color === "#d46a32"), true);
  assert.equal(winter.some((pixel) => pixel.color === "#d5e4ef"), true);
  assert.notDeepEqual(spring, autumn);
  assert.deepEqual(seasonBedPixels([spot], "summer", 0, true), seasonBedPixels([spot], "summer", 4, true));
  assert.notDeepEqual(seasonBedPixels([spot], "summer", 0, false), seasonBedPixels([spot], "summer", 1, false));
});

test("drizzle wets the path and stays put when motion is reduced", () => {
  const wet = {
    id: "drizzle" as const,
    cols: 76,
    rows: 70,
    reduced: true,
    quiet: false,
  };
  assert.deepEqual(weatherGround({ ...wet, t: 0 }), weatherGround({ ...wet, t: 5 }));
  assert.notDeepEqual(weatherGround({ ...wet, reduced: false, t: 0 }), weatherGround({ ...wet, reduced: false, t: 1 }));
  const quiet = weatherGround({ ...wet, quiet: true, t: 0 });
  const busy = weatherGround({ ...wet, t: 0 });
  assert.equal(quiet.length < busy.length, true);
  assert.equal(quiet.length > 0, true);
  assert.equal(weatherGround({ ...wet, id: "clear", t: 0 }).length, 0);
  const breeze = weatherGround({ ...wet, id: "breeze", t: 2 });
  assert.equal(breeze.some((pixel) => pixel.color.includes("232, 216, 150")), true);
});

test("pond fish, homestead, and gate flowers stay on the map", () => {
  const pond = { c0: 2, r0: 2, c1: 13, r1: 7 };
  assert.deepEqual(pondFish(pond, 0, true), pondFish(pond, 3, true));
  assert.notDeepEqual(pondFish(pond, 0, false), pondFish(pond, 2, false));
  const plots = Array.from({ length: 30 }, (_, index) => ({
    index,
    x: index * 20,
    y: 40,
    orchard: index % 7 === 0,
  }));
  const homes = homesteadProps(plots);
  assert.equal(homes.some((prop) => prop.kind === "mailbox"), true);
  assert.equal(homes.some((prop) => prop.kind === "line"), true);
  assert.equal(homes.some((prop) => prop.kind === "compost"), true);
  assert.equal(homes.some((prop) => prop.kind === "well"), true);
  const mail = homes.find((prop) => prop.kind === "mailbox");
  assert.ok(mail);
  assert.equal(homesteadPixels(mail).some((pixel) => pixel.color === "#c44b3a"), true);
  const flowers = gateFlowers([
    { gate: true, x: 10, y: 20 },
    { gate: false, x: 30, y: 20 },
  ]);
  assert.equal(flowers.length, 2);
  assert.equal(flowers.every((flower) => /^flower_[0-7]$/.test(flower.sprite)), true);
});

test("far tools and season windows are readable stamps", () => {
  const hoe = handToolPixels("hoe", 10, 40);
  const can = handToolPixels("can", 10, 40);
  assert.equal(hoe.some((pixel) => pixel.color === "#c4a060"), true);
  assert.equal(can.some((pixel) => pixel.color === "#3a8fbc"), true);
  assert.notDeepEqual(hoe, can);
  const spring = seasonWindowTint("spring", [{ x: 4, y: 8 }]);
  const winter = seasonWindowTint("winter", [{ x: 4, y: 8 }]);
  assert.equal(spring[0]?.color, "#e7f3c8");
  assert.equal(winter[0]?.color, "#d5e4ef");
  const marks = ["spring", "summer", "autumn", "winter"].map((id) => seasonMark(id, 200, 160)[2]?.color);
  assert.equal(new Set(marks).size, 4);
});

test("night sky and yard details freeze when motion is reduced", () => {
  assert.equal(nightHour(20), true);
  assert.equal(nightHour(4), true);
  assert.equal(nightHour(12), false);
  assert.deepEqual(nightSky(320, 200, 0, true), nightSky(320, 200, 4, true));
  assert.notDeepEqual(nightSky(320, 200, 0, false), nightSky(320, 200, 1, false));
  const yard = {
    hen: true,
    laundry: true,
    pepper: true,
    grain: 2,
    stove: true,
    bowl: true,
    shutters: true,
    bell: 1,
    sway: false,
    t: 0,
  };
  assert.deepEqual(yardDetailPixels(yard), yardDetailPixels({ ...yard, t: 5 }));
  assert.notDeepEqual(yardDetailPixels({ ...yard, sway: true, t: 0 }), yardDetailPixels({ ...yard, sway: true, t: 1 }));
  assert.equal(
    yardDetailPixels({
      ...yard,
      hen: false,
      laundry: false,
      pepper: false,
      grain: 0,
      stove: false,
      bowl: false,
      shutters: false,
      bell: 0,
    }).length,
    0,
  );
});

test("yard-edge landmarks stay still when motion is reduced", () => {
  const live = {
    ...EMPTY_LANDMARK,
    lantern: "pulse" as const,
    laundry: "sway" as const,
    shutter: "swing" as const,
    kettle: true,
    cat: true,
  };
  assert.deepEqual(landmarkPixels({ ...live, reduced: true }, 0), landmarkPixels({ ...live, reduced: true }, 4));
  assert.notDeepEqual(landmarkPixels(live, 0), landmarkPixels(live, 1));
  const dark = landmarkPixels({ ...EMPTY_LANDMARK, lantern: "off" }, 1);
  const lit = landmarkPixels({ ...EMPTY_LANDMARK, lantern: "still", reduced: true }, 1);
  assert.equal(lit.length > dark.length, true);
  assert.equal(landmarkPixels({ ...EMPTY_LANDMARK, wood: 3 }, 0).length > landmarkPixels({ ...EMPTY_LANDMARK, wood: 1 }, 0).length, true);
});
