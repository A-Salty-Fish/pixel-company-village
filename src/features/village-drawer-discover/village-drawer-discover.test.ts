import assert from "node:assert/strict";
import test from "node:test";
import { NARROW_CHROME_MAX_PX } from "@/features/narrow-chrome/narrow-chrome";
import {
  VILLAGE_DRAWER_DISCOVER_ENABLED,
  VILLAGE_DRAWER_DISCOVER_KEY,
  VILLAGE_DRAWER_DISCOVER_MS,
  drawerDiscoverMode,
  drawerDiscoverRemember,
  moreDiscoverBlocksDrawer,
} from "@/features/village-drawer-discover/village-drawer-discover";

const fresh = {
  active: true,
  stored: null,
  opened: false,
  elapsedMs: 0,
  reduceMotion: false,
  morePulse: false,
};

test("PV-PM-058 lights the whole drawer sign once, and waits out a 更多 pulse", () => {
  assert.equal(VILLAGE_DRAWER_DISCOVER_ENABLED, true);
  assert.equal(VILLAGE_DRAWER_DISCOVER_KEY, "village:drawer-discover-v1");
  assert.equal(VILLAGE_DRAWER_DISCOVER_MS, 8_000);
  assert.equal(drawerDiscoverMode(fresh), "pulse");
  assert.equal(drawerDiscoverMode({ ...fresh, reduceMotion: true }), "still");
  assert.equal(drawerDiscoverMode({ ...fresh, elapsedMs: VILLAGE_DRAWER_DISCOVER_MS - 1 }), "pulse");
  assert.equal(drawerDiscoverMode({ ...fresh, elapsedMs: VILLAGE_DRAWER_DISCOVER_MS }), "off");
  assert.equal(drawerDiscoverMode({ ...fresh, opened: true }), "off");
  assert.equal(drawerDiscoverMode({ ...fresh, active: false }), "off");
  assert.equal(drawerDiscoverMode({ ...fresh, stored: "1" }), "off");
  assert.equal(drawerDiscoverMode({ ...fresh, morePulse: true }), "defer");
  assert.equal(drawerDiscoverMode({ ...fresh, deferred: true }), "defer");
  assert.equal(drawerDiscoverMode({ ...fresh, enabled: false }), "off");
  assert.equal(
    drawerDiscoverRemember({ active: true, opened: true, deferred: false, elapsedMs: 0, stored: null }),
    true,
  );
  assert.equal(
    drawerDiscoverRemember({ active: true, opened: false, deferred: false, elapsedMs: VILLAGE_DRAWER_DISCOVER_MS, stored: null }),
    true,
  );
  assert.equal(
    drawerDiscoverRemember({ active: true, opened: true, deferred: true, elapsedMs: 0, stored: null }),
    false,
  );
  assert.equal(
    moreDiscoverBlocksDrawer({
      stored: null,
      width: NARROW_CHROME_MAX_PX,
      mapReady: true,
      opened: false,
      reduceMotion: false,
    }),
    true,
  );
  assert.equal(
    moreDiscoverBlocksDrawer({
      stored: "1",
      width: NARROW_CHROME_MAX_PX,
      mapReady: true,
      opened: false,
      reduceMotion: false,
    }),
    false,
  );
  assert.equal(
    moreDiscoverBlocksDrawer({
      stored: null,
      width: NARROW_CHROME_MAX_PX,
      mapReady: true,
      opened: false,
      reduceMotion: true,
    }),
    false,
  );
});
