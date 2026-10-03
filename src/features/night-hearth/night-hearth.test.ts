import assert from "node:assert/strict";
import test from "node:test";
import { POND_SLAB_ENABLED } from "@/features/night-readability/night-readability";
import { NARROW_MAP_FILL_ENABLED, narrowFillCamera, narrowMapFillMark } from "@/features/narrow-map-fill/narrow-map-fill";
import { viewSpan } from "@/lib/pixel-scene";
import { portraitMap } from "@/features/narrow-map-fill/narrow-map-fill";
import {
  NIGHT_HEARTH_ENABLED,
  NORTH_PATH_STONES,
  isNorthPathStone,
  nightHearthDrawPixels,
  nightHearthHidesStones,
  nightHearthMark,
  nightHearthOn,
  nightHearthPixels,
  paintNightHearth,
} from "@/features/night-hearth/night-hearth";

function plotPeople(count: number) {
  const people = [];
  for (let index = 0; index < count; index += 1) {
    const col = index % 10;
    const row = Math.floor(index / 10) % 10;
    people.push({
      x: 32 + col * 112 + (col >= 5 ? 32 : 0) + 64,
      y: 240 + row * 80 + (row >= 5 ? 32 : 0) + 58,
    });
  }
  return people;
}

test("PV-PM-072 warms a few night windows and does not paint a navy slab", () => {
  assert.equal(NIGHT_HEARTH_ENABLED, true);
  assert.equal(nightHearthOn(), true);
  assert.equal(nightHearthOn(false), false);
  assert.equal(nightHearthMark(true), "warm");
  assert.equal(nightHearthMark(false), "off");
  assert.equal(nightHearthMark(true, false), "off");
  assert.equal(nightHearthPixels(false).length, 0);

  assert.equal(NARROW_MAP_FILL_ENABLED, true);
  assert.equal(POND_SLAB_ENABLED, false);

  const pixels = nightHearthPixels(true);
  assert.equal(pixels.length >= 4 && pixels.length <= 12, true);
  let area = 0;
  for (const pixel of pixels) {
    assert.equal(pixel.w <= 8 && pixel.h <= 6, true);
    assert.equal(pixel.w * pixel.h <= 48, true);
    area += pixel.w * pixel.h;
    const pond = pixel.x >= 32 && pixel.x <= 224 && pixel.y >= 32 && pixel.y <= 128;
    assert.equal(pond, false);
    assert.equal(/#fff6d8|#f2d15c|#e7c48a/.test(pixel.color), true);
  }
  assert.equal(area < 200, true);

  const cam = narrowFillCamera({ people: plotPeople(18), cssW: 390, cssH: 596 });
  assert.ok(cam);
  assert.equal(cam.zoom > 1, true);
  assert.equal(narrowMapFillMark(cam.zoom), "village");
  const span = viewSpan(cam.zoom);
  assert.ok(cam.y + span.h < 700);
});

test("portrait night hides the five north-path stones and wide night keeps them", () => {
  assert.equal(portraitMap(390, 596), true);
  assert.equal(nightHearthHidesStones(390, 596), true);
  assert.equal(portraitMap(1280, 720), false);
  assert.equal(nightHearthHidesStones(1280, 720), false);

  const stones = nightHearthPixels(true).filter(isNorthPathStone);
  assert.deepEqual(
    stones.map((pixel) => [pixel.x, pixel.y, pixel.w, pixel.h, pixel.color]),
    NORTH_PATH_STONES.map((pixel) => [pixel.x, pixel.y, pixel.w, pixel.h, pixel.color]),
  );

  const narrowNight = nightHearthDrawPixels(true, 390, 596);
  assert.equal(narrowNight.some(isNorthPathStone), false);
  assert.equal(narrowNight.length, nightHearthPixels(true).length - NORTH_PATH_STONES.length);
  assert.equal(nightHearthDrawPixels(false, 390, 596).length, 0);

  const wideNight = nightHearthDrawPixels(true, 1280, 720);
  assert.equal(wideNight.filter(isNorthPathStone).length, NORTH_PATH_STONES.length);

  const worldW = 1216;
  const worldH = 1120;
  const cam = { viewW: worldW, viewH: worldH, camX: 0, camY: 0, worldW, worldH };
  const calls: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: "",
    save() {},
    restore() {},
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ x, y, w, h, color: this.fillStyle });
    },
  };
  const paint = (night: boolean, cssW: number, cssH: number) => {
    calls.length = 0;
    return paintNightHearth(ctx as unknown as CanvasRenderingContext2D, {
      ...cam,
      cssW,
      cssH,
      night,
      reduced: false,
    });
  };

  const narrowDay = paint(false, 390, 700);
  assert.equal(narrowDay.mode, "off");
  assert.equal(calls.length, 0);

  const narrow = paint(true, 390, 700);
  assert.equal(narrow.mode, "warm");
  assert.equal(calls.some((call) => call.color === "#e7c48a"), false);
  const windowColors = calls.map((call) => call.color);
  assert.equal(windowColors.includes("#fff6d8"), true);
  assert.equal(windowColors.includes("#f2d15c"), true);
  assert.equal(calls.length, 4);

  const wide = paint(true, 1280, 720);
  assert.equal(wide.mode, "warm");
  const painted = calls.filter((call) => call.color === "#e7c48a");
  assert.equal(painted.length, 5);
  for (const stone of NORTH_PATH_STONES) {
    const sx = ((stone.x - cam.camX) / worldW) * cam.viewW;
    const sy = ((stone.y - cam.camY) / worldH) * cam.viewH;
    const sw = Math.max(2, (stone.w / worldW) * cam.viewW);
    const sh = Math.max(2, (stone.h / worldH) * cam.viewH);
    assert.equal(sw, 3);
    assert.equal(sh, 2);
    const hit = painted.find((call) => call.x === sx && call.y === sy && call.w === sw && call.h === sh);
    assert.ok(hit, `missing stone ${stone.x},${stone.y}`);
  }
});
