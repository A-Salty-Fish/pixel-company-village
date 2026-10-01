import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAZA,
  PLAZA_IDLE_MS,
  PLAZA_SIT_ENABLED,
  plazaInView,
  plazaSitMark,
  plazaSitSprite,
} from "@/features/plaza-sit/plaza-sit";

test("PV-PM-064 sits lightly at the plaza after a short idle, and stands still when motion is reduced", () => {
  assert.equal(PLAZA_SIT_ENABLED, true);
  assert.equal(PLAZA_IDLE_MS, 6_000);
  assert.equal(plazaInView({ x: 0, y: 0, w: 1216, h: 1120 }), true);
  assert.equal(plazaInView({ x: 0, y: 0, w: 200, h: 200 }), false);
  assert.equal(plazaSitMark({ idleMs: PLAZA_IDLE_MS - 1, near: true, reduced: false }), "off");
  assert.equal(plazaSitMark({ idleMs: PLAZA_IDLE_MS, near: true, reduced: false }), "sit");
  assert.equal(plazaSitMark({ idleMs: PLAZA_IDLE_MS, near: true, reduced: true }), "stand");
  assert.equal(plazaSitMark({ idleMs: PLAZA_IDLE_MS, near: false, reduced: false }), "off");
  assert.equal(plazaSitMark({ idleMs: PLAZA_IDLE_MS, near: true, reduced: false, enabled: false }), "off");
  assert.equal(plazaSitSprite("stand", 0), plazaSitSprite("stand", 3));
  assert.notEqual(plazaSitSprite("sit", 0), plazaSitSprite("sit", 1));
  assert.match(plazaSitSprite("sit", 0.1), /^cat_lbeige_down_sit_\d$/);
  assert.equal(PLAZA.x > 400 && PLAZA.y > 400, true);
});
