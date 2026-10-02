import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  HOME_VILLAGE_LINE,
  HOME_VILLAGE_LINE_ENABLED,
  HOME_VILLAGE_MS,
  homeVillageCopy,
  homeVillageFlashes,
  homeVillageOn,
  homeVillageVisible,
} from "@/features/home-village-line/home-village-line";

test("PV-PM-093 home answers with a short line and no flash", () => {
  assert.equal(HOME_VILLAGE_LINE_ENABLED, true);
  assert.equal(homeVillageOn(), true);
  assert.equal(homeVillageOn(false), false);
  assert.equal(HOME_VILLAGE_LINE, "灶还温着。");
  assert.equal(HOME_VILLAGE_MS <= 2200, true);
  assert.equal(HOME_VILLAGE_MS >= 1800, true);
  assert.equal(homeVillageVisible({ quiet: true }), true);
  assert.equal(homeVillageVisible({ quiet: false }), true);
  assert.equal(homeVillageVisible({ quiet: true, enabled: false }), false);
  assert.equal(homeVillageFlashes(), false);
  assert.equal(copyIsClean(homeVillageCopy()), true);
  assert.equal(/他说|原文/.test(HOME_VILLAGE_LINE), false);
});
