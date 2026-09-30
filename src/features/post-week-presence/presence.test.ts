import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  GLANCE_ACT,
  POST_WEEK_PRESENCE_ENABLED,
  RESONANCE_RING,
  glanceCopyLines,
  glancePayload,
  glanceSpot,
  parseGlance,
  presencePhase,
  readsAsWave,
  resonancePixels,
  sanitizeGlance,
} from "@/features/post-week-presence/presence";

test("PV-PM-017 offers one glance after week 3/3 and leaves a ring, not a wave", () => {
  assert.equal(POST_WEEK_PRESENCE_ENABLED, true);
  assert.equal(presencePhase({ weekComplete: false, viewer: "甲", week: "2026-W40", savedWeek: null }), "hidden");
  assert.equal(presencePhase({ weekComplete: true, viewer: null, week: "2026-W40", savedWeek: null }), "hidden");
  assert.equal(presencePhase({ weekComplete: true, viewer: "甲", week: "2026-W40", savedWeek: null }), "ready");
  assert.equal(presencePhase({ weekComplete: true, viewer: "甲", week: "2026-W40", savedWeek: "2026-W40" }), "done");
  assert.equal(presencePhase({ weekComplete: true, viewer: "甲", week: "2026-W41", savedWeek: "2026-W40" }), "ready");
  assert.equal(
    presencePhase({ weekComplete: true, viewer: "甲", week: "2026-W40", savedWeek: "2026-W40", enabled: false }),
    "off",
  );

  const neighbor = glanceSpot(
    { name: "甲", x: 10, y: 10, homeX: 0, homeY: 0 },
    [
      { name: "甲", x: 10, y: 10 },
      { name: "乙", x: 40, y: 20 },
      { name: "丙", x: 400, y: 400 },
    ],
  );
  assert.equal(neighbor.kind, "neighbor");
  assert.equal(neighbor.x, 40);
  const yard = glanceSpot({ name: "甲", x: 10, y: 10, homeX: 80, homeY: 90 }, [{ name: "甲", x: 10, y: 10 }]);
  assert.equal(yard.kind, "yard");
  assert.equal(yard.x, 108);
  assert.equal(yard.y, 108);

  const ring = resonancePixels(20, 30);
  assert.equal(ring.some((pixel) => pixel.color === RESONANCE_RING), true);
  assert.equal(readsAsWave(ring), false);
  assert.deepEqual(resonancePixels(20, 30), resonancePixels(20, 30));
  assert.equal(copyIsClean(glanceCopyLines()), true);
  assert.equal(glanceCopyLines().some((line) => line.includes("挥手")), false);
  assert.equal(GLANCE_ACT.length > 0, true);

  assert.deepEqual(sanitizeGlance({ week: "2026-W40" }, "2026-W40"), { week: "2026-W40" });
  assert.equal(sanitizeGlance({ week: "2026-W40", text: "你好" }, "2026-W40"), null);
  assert.equal(sanitizeGlance({ week: "聊天原文" }, "聊天原文"), null);
  assert.equal(parseGlance(glancePayload({ week: "2026-W40" }), "2026-W40")?.week, "2026-W40");
  assert.equal(parseGlance(glancePayload({ week: "2026-W40" }), "2026-W41"), null);
});
