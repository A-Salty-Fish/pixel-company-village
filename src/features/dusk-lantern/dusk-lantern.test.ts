import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  DUSK_LANTERN_ENABLED,
  DUSK_LANTERN_LINE,
  duskLanternCopy,
  duskLanternOffer,
} from "@/features/dusk-lantern/dusk-lantern";

test("dusk offers the lantern line once, and day and night stay quiet", () => {
  assert.equal(DUSK_LANTERN_ENABLED, true);
  assert.equal(DUSK_LANTERN_LINE, "灯笼该亮了");
  assert.equal(duskLanternOffer({ hour: 17, alreadyShown: false }), true);
  assert.equal(duskLanternOffer({ hour: 19, alreadyShown: false }), true);
  assert.equal(duskLanternOffer({ hour: 19, alreadyShown: true }), false);
  assert.equal(duskLanternOffer({ hour: 12, alreadyShown: false }), false);
  assert.equal(duskLanternOffer({ hour: 16, alreadyShown: false }), false);
  assert.equal(duskLanternOffer({ hour: 20, alreadyShown: false }), false);
  assert.equal(duskLanternOffer({ hour: 2, alreadyShown: false }), false);
  assert.equal(duskLanternOffer({ hour: 18, alreadyShown: false, enabled: false }), false);
  assert.equal(copyIsClean(duskLanternCopy()), true);
});
