import assert from "node:assert/strict";
import test from "node:test";
import {
  YARD_TOY_FOCUS_ENABLED,
  toyAnchor,
  toyFocusPixels,
  toyPulseMark,
  toyWorldPixels,
} from "@/features/yard-toy-focus/yard-toy-focus";

test("PV-PM-027 toy pixels follow lantern, scarecrow, and pebble counts", () => {
  assert.equal(YARD_TOY_FOCUS_ENABLED, true);
  assert.equal(toyPulseMark(null), "off");
  assert.equal(toyPulseMark("lantern"), "lantern");
  assert.equal(toyPulseMark("nope"), "off");
  assert.equal(toyPulseMark("pebble", false), "off");
  const dark = toyWorldPixels({ lantern: false, scare: 0, pebbles: 0 });
  const lit = toyWorldPixels({ lantern: true, scare: 1, pebbles: 2 });
  assert.equal(dark.some((pixel) => pixel.color === "#fff6d8"), false);
  assert.equal(lit.some((pixel) => pixel.color === "#fff6d8"), true);
  assert.equal(lit.filter((pixel) => pixel.color === "#d5e4ef").length, 2);
  const lean0 = dark.find((pixel) => pixel.h === 18);
  const lean1 = lit.find((pixel) => pixel.h === 18);
  assert.equal(lean0 && lean1 && lean0.x !== lean1.x, true);
  assert.equal(toyWorldPixels({ lantern: true, scare: 1, pebbles: 3 }, false).length, 0);
  const ring = toyFocusPixels(toyAnchor("scarecrow").x, toyAnchor("scarecrow").y);
  assert.equal(ring.length, 4);
  assert.equal(JSON.stringify(lit).includes("说"), false);
});
