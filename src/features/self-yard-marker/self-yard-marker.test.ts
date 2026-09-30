import assert from "node:assert/strict";
import test from "node:test";
import { pixelArea, selfYardMark, selfYardPixels, YARD_PIN_COLOR } from "@/features/self-yard-marker/self-yard-marker";
import { findMeRing } from "@/lib/worldcraft";

test("self-yard-marker is a still roof pin, smaller than the find-me pulse", () => {
  const roof = { x: 400, y: 240 };
  assert.equal(selfYardMark(false), "off");
  assert.equal(selfYardMark(true), "pin");
  assert.equal(selfYardMark(true, false), "off");
  assert.deepEqual(selfYardPixels(null), []);
  assert.deepEqual(selfYardPixels(roof, false), []);

  const pin = selfYardPixels(roof);
  assert.deepEqual(selfYardPixels(roof), pin);
  assert.equal(pin.some((pixel) => pixel.color === YARD_PIN_COLOR), true);
  assert.equal(pin.some((pixel) => pixel.color === "#fff6d8"), false);
  assert.equal(pin.every((pixel) => pixel.y < roof.y), true);
  assert.equal(pin.every((pixel) => pixel.x < roof.x), true);

  const still = findMeRing(120, 300, false, 0);
  const pulsed = findMeRing(120, 300, false, 1);
  assert.notDeepEqual(still, pulsed);
  assert.equal(pixelArea(pin) < pixelArea(still), true);
  assert.equal(pin.some((pixel) => still.some((ring) => ring.color === pixel.color && ring.w === pixel.w)), false);
});
