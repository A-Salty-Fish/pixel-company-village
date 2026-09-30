import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  TOY_DOCK_ENABLED,
  mapNeedsRecall,
  toyDockCopy,
  toyDockItems,
  toyDockLocksScroll,
} from "@/features/toy-dock/toy-dock";

test("PV-PM-030 keeps the map when a toy would scroll it away", () => {
  assert.equal(TOY_DOCK_ENABLED, true);
  assert.equal(toyDockLocksScroll("lantern"), true);
  assert.equal(toyDockLocksScroll("scarecrow"), true);
  assert.equal(toyDockLocksScroll("pebble"), true);
  assert.equal(toyDockLocksScroll("well"), false);
  assert.equal(toyDockLocksScroll("lantern", false), false);

  assert.equal(mapNeedsRecall({ top: 900, bottom: 1600, height: 700 }, 800), true);
  assert.equal(mapNeedsRecall({ top: 40, bottom: 740, height: 700 }, 800), false);
  assert.equal(mapNeedsRecall({ top: 0, bottom: 0, height: 0 }, 800), false);
});

test("PV-PM-030 toy name and state follow the panel counts", () => {
  const items = toyDockItems({ lantern: true, scare: 2, pebbles: 1 });
  assert.deepEqual(
    items.map((item) => item.state),
    ["亮", "2", "1"],
  );
  assert.equal(toyDockItems({ lantern: false, scare: 0, pebbles: 0 })[0]?.state, "灭");
  assert.equal(copyIsClean(toyDockCopy({ lantern: true, scare: 1, pebbles: 3 })), true);
});
