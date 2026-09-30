import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  STAY_AWHILE_ENABLED,
  STAY_COOLDOWN_MS,
  STAY_SLOT_MAX,
  STAY_SLOT_MIN,
  advanceStay,
  buildStayPool,
  sampleStaySlots,
  stayCopy,
  stayVisible,
} from "@/features/stay-awhile/stay-awhile";

const people = [
  { name: "甲", x: 400, y: 400 },
  { name: "乙", x: 140, y: 90 },
  { name: "丙", x: 500, y: 420 },
];

test("PV-PM-029 corner steps appear only after the week and the one beat", () => {
  assert.equal(STAY_AWHILE_ENABLED, true);
  assert.equal(stayVisible(false, true), false);
  assert.equal(stayVisible(true, false), false);
  assert.equal(stayVisible(true, true), true);
  assert.equal(stayVisible(true, true, false), false);
  assert.equal(copyIsClean(stayCopy()), true);
});

test("PV-PM-029 samples two or three nearby steps and swaps on complete", () => {
  const pool = buildStayPool({
    self: { x: 420, y: 380, homeX: 400, homeY: 360 },
    people,
    selfName: "甲",
  });
  assert.equal(pool.some((item) => item.kind === "toy"), true);
  assert.equal(pool.some((item) => item.kind === "neighbor"), true);
  assert.equal(pool.some((item) => item.kind === "lamp"), true);
  assert.equal(pool.some((item) => item.label.includes("乙")), false);

  const slots = sampleStaySlots({ pool, now: 1_000, origin: { x: 420, y: 380 } });
  assert.equal(slots.length >= STAY_SLOT_MIN && slots.length <= STAY_SLOT_MAX, true);
  const kinds = new Set(slots.map((item) => item.kind));
  assert.equal(kinds.has("toy"), true);
  assert.equal(kinds.has("neighbor"), true);
  assert.equal(kinds.has("lamp"), true);

  const first = slots[0];
  assert.ok(first);
  const next = advanceStay(first.id, 1_000, {});
  assert.equal(next.swapped, true);
  const again = sampleStaySlots({
    pool,
    now: 1_000,
    cooled: next.cooled,
    held: slots.map((item) => item.id),
    origin: { x: 420, y: 380 },
  });
  assert.equal(again.some((item) => item.id === first.id), false);
  assert.equal(again.length >= STAY_SLOT_MIN, true);

  const cooledClick = advanceStay(first.id, 1_000, next.cooled);
  assert.equal(cooledClick.swapped, false);

  const later = sampleStaySlots({
    pool,
    now: 1_000 + STAY_COOLDOWN_MS,
    cooled: next.cooled,
    origin: { x: 420, y: 380 },
  });
  assert.equal(later.some((item) => item.id === first.id), true);
  assert.equal(sampleStaySlots({ pool, now: 1, enabled: false }).length, 0);
});
