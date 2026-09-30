import assert from "node:assert/strict";
import test from "node:test";
import {
  DISCOVER_KEY,
  DISCOVER_TIP,
  discoverShouldShow,
  discoverStoredValue,
} from "@/features/compact-settings-discover/discover";

test("compact-settings-discover shows one canned tip until this browser dismisses it", () => {
  assert.equal(discoverShouldShow(null), true);
  assert.equal(discoverShouldShow(""), true);
  assert.equal(discoverShouldShow(discoverStoredValue()), false);
  assert.equal(discoverShouldShow(null, false), false);
  assert.equal(discoverStoredValue(), "1");
  assert.equal(discoverStoredValue().length, 1);
  assert.equal(DISCOVER_TIP.includes("\n"), false);
  assert.equal(DISCOVER_TIP.includes("减少动作"), true);
  assert.equal(DISCOVER_TIP.includes("安静村子"), true);
  assert.equal(DISCOVER_KEY.startsWith("village:"), true);
  assert.equal(/message|chat|text/i.test(DISCOVER_KEY), false);
});
