import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  CO_LINES,
  CO_PRESENCE_COOLDOWN_MS,
  CO_PRESENCE_ENABLED,
  CO_PRESENCE_FIRST_MS,
  CO_PRESENCE_IDLE_MS,
  coPresenceCopy,
  pickCoPresence,
} from "@/features/co-presence/co-presence";

const base = {
  toggle: true,
  sinceLastMs: Number.POSITIVE_INFINITY,
  nearby: [{ name: "乙", x: 140, y: 100 }],
  self: { x: 120, y: 110 },
  lamp: { x: 400, y: 360 },
  lake: { x: 128, y: 80 },
  salt: 0,
  reduced: false,
};

test("PV-PM-032 a quiet minute can brush, sit, or look without chat", () => {
  assert.equal(CO_PRESENCE_ENABLED, true);
  assert.equal(pickCoPresence({ ...base, idleMs: CO_PRESENCE_FIRST_MS - 1 }), null);
  assert.equal(pickCoPresence({ ...base, idleMs: 10_000, toggle: false }), null);
  assert.equal(pickCoPresence({ ...base, idleMs: CO_PRESENCE_IDLE_MS, enabled: false }), null);
  assert.equal(
    pickCoPresence({ ...base, idleMs: CO_PRESENCE_IDLE_MS, sinceLastMs: CO_PRESENCE_COOLDOWN_MS - 1 }),
    null,
  );

  const atTen = pickCoPresence({ ...base, idleMs: CO_PRESENCE_IDLE_MS, salt: 1 });
  assert.ok(atTen);
  assert.equal(atTen.line, CO_LINES.sit);
  assert.equal(atTen.partner, "乙");
  assert.equal(/他说|原文|chat/i.test(atTen.line), false);

  const early = pickCoPresence({ ...base, idleMs: CO_PRESENCE_FIRST_MS, salt: 0 });
  assert.equal(early?.id, "brush");
  assert.equal(early?.anim, true);

  const still = pickCoPresence({ ...base, idleMs: CO_PRESENCE_FIRST_MS, salt: 2, reduced: true });
  assert.equal(still?.id, "look");
  assert.equal(still?.anim, false);

  const alone = pickCoPresence({ ...base, nearby: [], idleMs: CO_PRESENCE_IDLE_MS, salt: 3 });
  assert.equal(alone?.id, "look");
  assert.equal(alone?.partner, null);
  assert.equal(copyIsClean(coPresenceCopy()), true);
});
