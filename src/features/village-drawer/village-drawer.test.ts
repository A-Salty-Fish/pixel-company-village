import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  VILLAGE_DRAWER_ENABLED,
  VILLAGE_DRAWER_LABEL,
  drawerCopy,
  drawerStartsOpen,
  drawerWrapsPanels,
} from "@/features/village-drawer/village-drawer";

test("PV-PM-039 keeps the village drawer closed until someone opens it", () => {
  assert.equal(VILLAGE_DRAWER_ENABLED, true);
  assert.equal(VILLAGE_DRAWER_LABEL, "村里");
  assert.equal(drawerStartsOpen(), false);
  assert.equal(drawerStartsOpen(false), false);
  assert.equal(drawerWrapsPanels(), true);
  assert.equal(drawerWrapsPanels(false), false);
  assert.equal(copyIsClean(drawerCopy()), true);
});
