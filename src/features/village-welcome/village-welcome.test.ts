import assert from "node:assert/strict";
import test from "node:test";
import {
  VILLAGE_WELCOME_ENABLED,
  WELCOME_DELAY_MS,
  WELCOME_HOLD_MS,
  WELCOME_MAX_CHARS,
  welcomeCopy,
  welcomeLine,
  welcomeOn,
  welcomeVisible,
} from "@/features/village-welcome/village-welcome";

test("PV-PM-079 shows one short map line by time of day", () => {
  assert.equal(VILLAGE_WELCOME_ENABLED, true);
  assert.equal(welcomeOn(), true);
  assert.equal(welcomeOn(false), false);
  assert.equal(WELCOME_DELAY_MS <= 2_000, true);
  assert.equal(WELCOME_HOLD_MS > 0, true);

  const seasons = ["", "spring", "summer", "autumn", "winter"];
  const hours = [6, 12, 18, 22];
  const seen = new Set<string>();
  for (const hour of hours) {
    for (const season of seasons) {
      const line = welcomeLine(hour, season);
      assert.equal(line.length > 0 && line.length <= WELCOME_MAX_CHARS, true);
      assert.equal(/分|消息|他说|原文/.test(line), false);
      seen.add(line);
    }
  }
  assert.equal(seen.size >= 8, true);
  assert.notEqual(welcomeLine(6, "spring"), welcomeLine(22, "winter"));
  assert.equal(welcomeLine(12, "autumn", false), "");

  assert.equal(welcomeVisible({ elapsedMs: 0, dismissed: false }), false);
  assert.equal(welcomeVisible({ elapsedMs: WELCOME_DELAY_MS, dismissed: false }), true);
  assert.equal(welcomeVisible({ elapsedMs: 1_500, dismissed: false }), true);
  assert.equal(welcomeVisible({ elapsedMs: WELCOME_DELAY_MS + WELCOME_HOLD_MS, dismissed: false }), false);
  assert.equal(welcomeVisible({ elapsedMs: 1_000, dismissed: true }), false);
  assert.equal(welcomeVisible({ elapsedMs: 1_000, dismissed: false, enabled: false }), false);

  const copy = welcomeCopy();
  assert.equal(copy.every((line) => line.length <= WELCOME_MAX_CHARS), true);
  assert.equal(copy.some((line) => line.includes("分")), false);
});
