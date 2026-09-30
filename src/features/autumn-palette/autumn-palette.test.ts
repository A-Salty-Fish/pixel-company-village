import assert from "node:assert/strict";
import test from "node:test";
import { DAY_GRASS, nightField } from "@/features/night-wash-v2/night-wash-v2";
import { groundPropMark } from "@/features/season-ground-props/season-ground-props";
import {
  AUTUMN_PALETTE_ENABLED,
  autumnEdge,
  autumnPaletteMark,
} from "@/features/autumn-palette/autumn-palette";

test("PV-PM-020 autumn bands warm the edges and still take a night wash", () => {
  assert.equal(AUTUMN_PALETTE_ENABLED, true);
  assert.equal(autumnPaletteMark("autumn"), "warm");
  assert.equal(autumnPaletteMark("winter"), "off");
  assert.equal(autumnPaletteMark("summer"), "off");
  assert.equal(autumnPaletteMark("autumn", false), "off");

  const sky = autumnEdge(DAY_GRASS, "sky");
  const ground = autumnEdge(DAY_GRASS, "ground");
  assert.equal(sky.r > DAY_GRASS.r, true);
  assert.equal(ground.r > DAY_GRASS.r, true);
  assert.equal(ground.g > ground.r, true);
  assert.equal(sky.g > sky.r, true);

  const night = nightField(ground);
  assert.equal(night.b > night.g, true);
  assert.equal(night.g < ground.g - 40, true);

  assert.equal(groundPropMark("autumn", false), "leaf");
  assert.equal(autumnPaletteMark("autumn"), "warm");
  assert.equal(groundPropMark("autumn", true), "off");
  assert.equal(autumnPaletteMark("autumn"), "warm");
});
