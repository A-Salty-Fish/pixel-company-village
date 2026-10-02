import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  DRAWER_HOME_SWITCH,
  MAP_HOME_ARIA,
  MAP_HOME_MARK,
  ONE_HOME_WORD_ENABLED,
  SPOKEN_HOME,
  countsSpokenHome,
  drawerHomeSwitch,
  mapHomeAria,
  mapHomeFace,
  oneHomeWordOn,
} from "@/features/one-home-word/one-home-word";

test("PV-PM-102 keeps the spoken 回家 off the map mark", () => {
  assert.equal(ONE_HOME_WORD_ENABLED, true);
  assert.equal(oneHomeWordOn(false), false);
  assert.equal(mapHomeFace(), MAP_HOME_MARK);
  assert.equal(mapHomeFace(false), SPOKEN_HOME);
  assert.equal(mapHomeFace().includes(SPOKEN_HOME), false);
  assert.equal(mapHomeAria(), MAP_HOME_ARIA);
  assert.equal(mapHomeAria().includes(SPOKEN_HOME), false);
  assert.equal(drawerHomeSwitch(), DRAWER_HOME_SWITCH);
  assert.equal(drawerHomeSwitch(false), SPOKEN_HOME);
  assert.equal(drawerHomeSwitch().includes(SPOKEN_HOME), false);
  assert.equal(countsSpokenHome(SPOKEN_HOME), 1);
  assert.equal(countsSpokenHome(mapHomeFace()), 0);
  assert.equal(copyIsClean([mapHomeFace(), mapHomeAria(), drawerHomeSwitch(), SPOKEN_HOME]), true);
});
