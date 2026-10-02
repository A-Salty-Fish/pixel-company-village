import assert from "node:assert/strict";
import test from "node:test";
import { farmStillReads, nightField } from "@/features/night-wash-v2/night-wash-v2";
import {
  SKY_WASH_BAND,
  SKY_WASH_ENABLED,
  paintSkyWash,
  skyBandHeight,
  skyWashBand,
  skyWashCovers,
  skyWashInk,
  skyWashMark,
  skyWashOn,
} from "@/features/sky-wash/sky-wash";

test("PV-PM-075 tints only the sky band and leaves the night path alone", () => {
  assert.equal(SKY_WASH_ENABLED, true);
  assert.equal(skyWashOn(), true);
  assert.equal(skyWashOn(false), false);
  assert.equal(skyWashBand(5), "dawn");
  assert.equal(skyWashBand(9), "dawn");
  assert.equal(skyWashBand(12), "day");
  assert.equal(skyWashBand(17), "dusk");
  assert.equal(skyWashBand(19), "dusk");
  assert.equal(skyWashBand(21), "night");
  assert.equal(skyWashBand(3), "night");
  assert.equal(skyWashMark(6), "dawn");
  assert.equal(skyWashMark(6, false), "off");

  const inks = ["dawn", "day", "dusk", "night"].map((band) => skyWashInk(band as "dawn"));
  const keys = inks.map((ink) => `${ink.r},${ink.g},${ink.b},${ink.a}`);
  assert.equal(new Set(keys).size, 4);
  assert.equal(skyWashInk("night").a <= 0.2, true);
  assert.equal(SKY_WASH_BAND <= 0.2, true);

  const viewH = 600;
  assert.equal(skyWashCovers(0, viewH), true);
  assert.equal(skyWashCovers(skyBandHeight(viewH) - 1, viewH), true);
  assert.equal(skyWashCovers(viewH * 0.5, viewH), false);
  assert.equal(skyBandHeight(viewH) < viewH * 0.25, true);

  const field = nightField();
  assert.equal(farmStillReads(field), true);

  const calls: string[] = [];
  const ctx = {
    save() {},
    restore() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push(`${x},${y},${w},${h}`);
    },
    fillStyle: "",
  } as unknown as CanvasRenderingContext2D;
  assert.equal(paintSkyWash(ctx, 390, viewH, 22), "night");
  assert.equal(calls.length, 1);
  assert.equal(calls[0], `0,0,390,${skyBandHeight(viewH)}`);
  assert.equal(paintSkyWash(ctx, 390, viewH, 22, false), "off");
});
