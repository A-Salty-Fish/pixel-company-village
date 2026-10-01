import assert from "node:assert/strict";
import test from "node:test";
import {
  IDLE_BREEZE_ENABLED,
  idleBreezeCount,
  idleBreezeMark,
  idleGrassFrame,
  idleLanternFrame,
} from "@/features/idle-breeze/idle-breeze";

test("grass leans and the lantern breathes, then both hold still", () => {
  assert.equal(IDLE_BREEZE_ENABLED, true);
  assert.equal(idleBreezeMark(false, false), "sway");
  assert.equal(idleBreezeMark(true, false), "still");
  assert.equal(idleBreezeMark(false, true), "still");
  assert.equal(idleBreezeMark(false, false, false), "off");
  assert.equal(idleBreezeCount(), 4);
  assert.equal(idleBreezeCount(false), 0);

  const grass = idleGrassFrame(false, false, 0);
  const later = idleGrassFrame(false, false, 2);
  assert.equal(grass.length, 12);
  assert.notDeepEqual(grass, later);
  assert.deepEqual(idleGrassFrame(true, false, 0), idleGrassFrame(true, false, 3));
  assert.deepEqual(idleGrassFrame(false, true, 0), idleGrassFrame(false, true, 4));
  assert.equal(idleGrassFrame(false, false, 0, false).length, 0);

  const lamp = idleLanternFrame(false, false, 0);
  const lampLater = idleLanternFrame(false, false, 0.5);
  assert.equal(lamp.length, 2);
  assert.notDeepEqual(lamp, lampLater);
  assert.deepEqual(idleLanternFrame(true, false, 0), idleLanternFrame(true, false, 2));
  assert.deepEqual(idleLanternFrame(false, true, 0.2), idleLanternFrame(false, true, 5));
  assert.equal(idleLanternFrame(false, false, 0, false).length, 0);
  assert.equal(lamp.every((pixel) => pixel.x >= 848 && pixel.x <= 854 && pixel.y >= 322 && pixel.y <= 328), true);
});
