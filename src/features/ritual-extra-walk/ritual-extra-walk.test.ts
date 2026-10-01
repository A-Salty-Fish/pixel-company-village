import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  EXTRA_WALK_DONE,
  RITUAL_EXTRA_WALK_ENABLED,
  extraWalkCopy,
  extraWalkKey,
  extraWalkOffer,
  pickExtraWalk,
} from "@/features/ritual-extra-walk/ritual-extra-walk";

test("PV-PM-055 offers one walk after today's ritual, and yields to stay-awhile", () => {
  assert.equal(RITUAL_EXTRA_WALK_ENABLED, true);
  assert.equal(extraWalkKey("王满"), "village:extra-walk-v1:王满");
  assert.equal(
    extraWalkOffer({ ritualToday: true, walkedYmd: null, today: "2026-10-01", stayAwhile: false }),
    true,
  );
  assert.equal(
    extraWalkOffer({ ritualToday: false, walkedYmd: null, today: "2026-10-01", stayAwhile: false }),
    false,
  );
  assert.equal(
    extraWalkOffer({ ritualToday: true, walkedYmd: "2026-10-01", today: "2026-10-01", stayAwhile: false }),
    false,
  );
  assert.equal(
    extraWalkOffer({ ritualToday: true, walkedYmd: "2026-09-30", today: "2026-10-01", stayAwhile: false }),
    true,
  );
  assert.equal(
    extraWalkOffer({ ritualToday: true, walkedYmd: null, today: "2026-10-01", stayAwhile: true }),
    false,
  );
  assert.equal(
    extraWalkOffer({
      ritualToday: true,
      walkedYmd: null,
      today: "2026-10-01",
      stayAwhile: false,
      enabled: false,
    }),
    false,
  );
  const spot = pickExtraWalk({ name: "王满", ymd: "2026-10-01", roof: { homeX: 100, homeY: 80 } });
  assert.equal(["bench", "lake", "roof"].includes(spot.id), true);
  assert.equal(pickExtraWalk({ name: "王满", ymd: "2026-10-01", roof: { homeX: 100, homeY: 80 } }).id, spot.id);
  const roof = pickExtraWalk({ name: "屋顶", ymd: "2026-01-02", roof: { homeX: 10, homeY: 20 } });
  if (roof.id === "roof") assert.deepEqual({ x: roof.x, y: roof.y }, { x: 58, y: 44 });
  const noRoof = pickExtraWalk({ name: "王满", ymd: "2026-10-01", roof: null });
  assert.notEqual(noRoof.id, "roof");
  assert.equal(copyIsClean(extraWalkCopy()), true);
  assert.equal(EXTRA_WALK_DONE.length <= 24, true);
});
