import assert from "node:assert/strict";
import test from "node:test";
import { PATH_CLEAR } from "@/features/path-meadow/path-meadow";
import {
  NIGHT_WINDOW_PULSE_ENABLED,
  NIGHT_WINDOWS,
  PATH_LANTERN,
  nightWindowLamp,
  nightWindowLevel,
  nightWindowPixels,
  nightWindowPulseMark,
  nightWindowPulseOn,
} from "@/features/night-window-pulse/night-window-pulse";

test("PV-PM-084 breathes one to three night windows and leaves path lamps alone", () => {
  assert.equal(NIGHT_WINDOW_PULSE_ENABLED, true);
  assert.equal(nightWindowPulseOn(), true);
  assert.equal(nightWindowPulseOn(false), false);
  assert.equal(NIGHT_WINDOWS.length >= 1 && NIGHT_WINDOWS.length <= 3, true);
  for (const pane of NIGHT_WINDOWS) {
    assert.equal(pane.cycleS >= 2.5 && pane.cycleS <= 4, true);
    assert.equal(pane.w <= 6 && pane.h <= 6, true);
  }

  assert.equal(nightWindowLamp(true), "lit");
  assert.equal(nightWindowLamp(false), "dead");
  assert.equal(nightWindowLamp(true, false), "dead");
  assert.equal(nightWindowPulseMark(true, false), "breathe");
  assert.equal(nightWindowPulseMark(true, true), "warm");
  assert.equal(nightWindowPulseMark(false, false), "dead");
  assert.equal(nightWindowPulseMark(true, false, false), "dead");

  assert.equal(nightWindowPixels(false, false, 0).length, 0);
  assert.equal(nightWindowPixels(true, false, 0, false).length, 0);

  const warm = nightWindowPixels(true, true, 0);
  const warmLater = nightWindowPixels(true, true, 9);
  assert.equal(warm.length, NIGHT_WINDOWS.length);
  assert.deepEqual(warm, warmLater);
  assert.equal(warm.every((pixel) => pixel.color === "#fff6d8"), true);

  const cycle = NIGHT_WINDOWS[0]?.cycleS ?? 3;
  let previous = nightWindowLevel(0, cycle, false);
  let low = previous;
  let high = previous;
  for (let step = 1; step <= 80; step += 1) {
    const level = nightWindowLevel(step * 0.05, cycle, false);
    assert.equal(Math.abs(level - previous) < 0.15, true);
    low = Math.min(low, level);
    high = Math.max(high, level);
    previous = level;
  }
  assert.equal(high - low > 0.4, true);
  assert.equal(nightWindowLevel(0.2, cycle, true), 1);

  const breathe = nightWindowPixels(true, false, 0);
  const later = nightWindowPixels(true, false, cycle / 4);
  assert.notDeepEqual(
    breathe.map((pixel) => pixel.color),
    later.map((pixel) => pixel.color),
  );

  for (const pixel of breathe) {
    const inClear =
      pixel.x >= PATH_CLEAR.x0 &&
      pixel.x <= PATH_CLEAR.x1 &&
      pixel.y >= PATH_CLEAR.y0 &&
      pixel.y <= PATH_CLEAR.y1;
    assert.equal(inClear, false);
    const dx = pixel.x - PATH_LANTERN.x;
    const dy = pixel.y - PATH_LANTERN.y;
    assert.equal(Math.hypot(dx, dy) > 80, true);
  }
});
