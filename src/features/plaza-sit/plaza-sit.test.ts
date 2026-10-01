import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAZA_IDLE_MS,
  PLAZA_SIT_ENABLED,
  pickPlazaSitter,
  plazaSitPlan,
  pointNearPlaza,
  villagerCanSit,
  PLAZA_CENTER,
} from "@/features/plaza-sit/plaza-sit";

test("PV-PM-064 sits after six still seconds near the plaza", () => {
  assert.equal(PLAZA_SIT_ENABLED, true);
  assert.equal(PLAZA_IDLE_MS, 6_000);
  assert.equal(pointNearPlaza(PLAZA_CENTER), true);
  assert.equal(pointNearPlaza({ x: PLAZA_CENTER.x + 400, y: PLAZA_CENTER.y }), false);
  assert.equal(plazaSitPlan({ near: true, idleMs: 5_999, reduced: false }), "off");
  assert.equal(plazaSitPlan({ near: true, idleMs: 6_000, reduced: false }), "sit");
  assert.equal(plazaSitPlan({ near: true, idleMs: 6_000, reduced: true }), "still");
  assert.equal(plazaSitPlan({ near: false, idleMs: 9_000, reduced: false }), "off");
  assert.equal(plazaSitPlan({ near: true, idleMs: 9_000, reduced: false, enabled: false }), "off");
  assert.equal(villagerCanSit("wander"), true);
  assert.equal(villagerCanSit("hard_work"), false);
  const people = [
    { name: "甲", x: PLAZA_CENTER.x + 20, y: PLAZA_CENTER.y, idle: true },
    { name: "乙", x: PLAZA_CENTER.x, y: PLAZA_CENTER.y + 10, idle: false },
    { name: "丙", x: 20, y: 20, idle: true },
  ];
  assert.equal(
    pickPlazaSitter({ plan: "sit", selfName: "乙", selectedName: null, people }),
    "乙",
  );
  assert.equal(
    pickPlazaSitter({ plan: "sit", selfName: "丙", selectedName: "甲", people }),
    "甲",
  );
  assert.equal(
    pickPlazaSitter({ plan: "sit", selfName: null, selectedName: null, people }),
    "甲",
  );
  assert.equal(pickPlazaSitter({ plan: "off", selfName: "甲", selectedName: null, people }), null);
  assert.equal(pickPlazaSitter({ plan: "still", selfName: null, selectedName: null, people }), "甲");
});
