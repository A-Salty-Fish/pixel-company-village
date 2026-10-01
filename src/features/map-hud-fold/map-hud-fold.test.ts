import assert from "node:assert/strict";
import test from "node:test";
import { TOY_ANCHORS } from "@/features/yard-toy-focus/yard-toy-focus";
import {
  MAP_HUD_FOLD_ENABLED,
  hitToy,
  hudStaysOut,
  persistentHud,
  toyDockVisible,
  toyTapCopy,
} from "@/features/map-hud-fold/map-hud-fold";

test("narrow hud keeps only zoom, find, and mute", () => {
  assert.equal(MAP_HUD_FOLD_ENABLED, true);
  assert.deepEqual(persistentHud(), ["zoom", "find", "mute"]);
  assert.equal(hudStaysOut("zoom"), true);
  assert.equal(hudStaysOut("find"), true);
  assert.equal(hudStaysOut("mute"), true);
  for (const slot of ["legend", "today", "emote", "plates", "ambient", "company", "toys", "weather", "stay"] as const) {
    assert.equal(hudStaysOut(slot), false);
  }
  assert.equal(hudStaysOut("legend", false), true);
});

test("yard counts stay hidden until the yard or a toy tap", () => {
  assert.equal(toyDockVisible({ yard: false, toyPulse: false }), false);
  assert.equal(toyDockVisible({ yard: true, toyPulse: false }), true);
  assert.equal(toyDockVisible({ yard: false, toyPulse: true }), true);
  assert.equal(toyDockVisible({ yard: false, toyPulse: false }, false), true);
  assert.equal(hitToy(TOY_ANCHORS.lantern.x, TOY_ANCHORS.lantern.y), "lantern");
  assert.equal(hitToy(TOY_ANCHORS.scarecrow.x + 10, TOY_ANCHORS.scarecrow.y), "scarecrow");
  assert.equal(hitToy(0, 0), null);
  assert.deepEqual(toyTapCopy("lantern", { lantern: false, scare: 0, pebbles: 0 }), {
    toast: "灯笼灭着。",
    state: "灭",
  });
  assert.equal(toyTapCopy("pebble", { lantern: false, scare: 1, pebbles: 2 }).state, "2");
});
