import assert from "node:assert/strict";
import test from "node:test";
import { POND_SLAB_ENABLED } from "@/features/night-readability/night-readability";
import { NARROW_MAP_FILL_ENABLED, narrowFillCamera, narrowMapFillMark } from "@/features/narrow-map-fill/narrow-map-fill";
import { viewSpan } from "@/lib/pixel-scene";
import {
  HEARTH_STONE_MIN_SHORT_CSS,
  NIGHT_HEARTH_ENABLED,
  hearthScreenBox,
  hearthStoneScreenBox,
  isHearthStone,
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

test("night hearth stones stay centered and at least 4 CSS px on a narrow zoom-2 map", () => {
  assert.equal(nightHearthPixels(false).length, 0);
  assert.equal(nightHearthMark(false), "off");

  const stones = nightHearthPixels(true).filter(isHearthStone);
  assert.deepEqual(
    stones.map((pixel) => [pixel.x, pixel.y, pixel.w, pixel.h, pixel.color]),
    [
      [248, 220, 3, 2, "#e7c48a"],
      [360, 226, 3, 2, "#e7c48a"],
      [760, 220, 3, 2, "#e7c48a"],
      [900, 226, 3, 2, "#e7c48a"],
      [1040, 220, 3, 2, "#e7c48a"],
    ],
  );

  const span = viewSpan(2);
  assert.equal(span.w, 608);
  const viewW = 380;
  const viewH = 700;
  const cam = { viewW, viewH, camX: 80, camY: 40, worldW: span.w, worldH: span.h, dpr: 1 };
  for (const stone of stones) {
    const box = hearthStoneScreenBox(stone, cam);
    const short = Math.min(box.sw, box.sh);
    assert.ok(short >= HEARTH_STONE_MIN_SHORT_CSS, `short side ${short}`);
    assert.ok(Math.abs(box.sw / box.sh - 3 / 2) < 0.001);
    const worldCx = stone.x + stone.w / 2;
    const worldCy = stone.y + stone.h / 2;
    const expectCx = ((worldCx - cam.camX) / cam.worldW) * viewW;
    const expectCy = ((worldCy - cam.camY) / cam.worldH) * viewH;
    assert.ok(Math.abs(box.sx + box.sw / 2 - expectCx) < 1e-6);
    assert.ok(Math.abs(box.sy + box.sh / 2 - expectCy) < 1e-6);
  }

  const retina = { ...cam, viewW: viewW * 3, viewH: viewH * 3, dpr: 3 };
  const retinaBox = hearthStoneScreenBox(stones[0], retina);
  assert.ok(Math.min(retinaBox.sw, retinaBox.sh) / retina.dpr >= HEARTH_STONE_MIN_SHORT_CSS);

  const windows = nightHearthPixels(true).filter((pixel) => !isHearthStone(pixel));
  assert.equal(windows.length, 4);
  for (const window of windows) {
    const drawn = hearthScreenBox(window, cam);
    const naturalW = Math.max(2, (window.w / cam.worldW) * viewW);
    const naturalH = Math.max(2, (window.h / cam.worldH) * viewH);
    assert.equal(drawn.sw, naturalW);
    assert.equal(drawn.sh, naturalH);
    assert.equal(drawn.sx, ((window.x - cam.camX) / cam.worldW) * viewW);
  }

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
  const day = paintNightHearth(ctx as unknown as CanvasRenderingContext2D, { ...cam, night: false, reduced: false });
  assert.equal(day.mode, "off");
  assert.equal(calls.length, 0);
  const night = paintNightHearth(ctx as unknown as CanvasRenderingContext2D, { ...cam, night: true, reduced: false });
  assert.equal(night.mode, "warm");
  const visible = stones.filter((stone) => {
    const box = hearthStoneScreenBox(stone, cam);
    return box.sx + box.sw >= 0 && box.sy + box.sh >= 0 && box.sx <= viewW && box.sy <= viewH;
  });
  assert.equal(visible.length >= 2 && visible.length < stones.length, true);
  const paintedStones = calls.filter((call) => call.color === "#e7c48a");
  assert.equal(paintedStones.length, visible.length);
  for (const call of paintedStones) {
    assert.ok(Math.min(call.w, call.h) >= 4);
    assert.ok(Math.abs(call.w / call.h - 1.5) < 0.001);
  }
});
