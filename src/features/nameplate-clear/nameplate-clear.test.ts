import assert from "node:assert/strict";
import test from "node:test";
import {
  NAMEPLATE_CLEAR_ENABLED,
  NEAR_PLATE_CAP,
  layoutClearPlates,
  type ClearInput,
} from "@/features/nameplate-clear/nameplate-clear";

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test("PV-PM-031 quiet plates separate, fade, and stop at eight", () => {
  assert.equal(NAMEPLATE_CLEAR_ENABLED, true);
  assert.equal(NEAR_PLATE_CAP, 8);

  const stacked: ClearInput[] = [
    { id: "self", role: "self", x: 8, y: 8, w: 48, h: 16, dist: 0 },
    { id: "pin", role: "pinned", x: 10, y: 10, w: 48, h: 16, dist: 12 },
    { id: "near", role: "neighbor", x: 80, y: 40, w: 48, h: 16, dist: 40 },
    { id: "far", role: "scored", x: 180, y: 90, w: 48, h: 16, dist: 360 },
  ];
  const laid = layoutClearPlates(stacked, { cap: NEAR_PLATE_CAP, viewW: 320, viewH: 200 });
  const self = laid.get("self");
  const pin = laid.get("pin");
  assert.equal(self?.draw, true);
  assert.equal(pin?.draw, true);
  assert.ok(self && pin);
  assert.equal(overlaps(self, pin), false);
  assert.equal(self.alpha, 1);
  assert.ok((laid.get("far")?.alpha ?? 1) < (laid.get("near")?.alpha ?? 0));

  const clipped = layoutClearPlates(
    [{ id: "edge", role: "scored", x: -40, y: 8, w: 48, h: 16, dist: 10 }],
    { cap: NEAR_PLATE_CAP, viewW: 320, viewH: 200 },
  );
  assert.equal(clipped.get("edge")?.draw, false);

  const lip = layoutClearPlates(
    [{ id: "lip", role: "neighbor", x: -4, y: 20, w: 48, h: 16, dist: 20 }],
    { cap: NEAR_PLATE_CAP, viewW: 320, viewH: 200 },
  );
  assert.equal(lip.get("lip")?.draw, true);
  assert.ok((lip.get("lip")?.x ?? 0) >= 2);

  const many: ClearInput[] = Array.from({ length: 9 }, (_, index) => ({
    id: index === 0 ? "self" : `p${index}`,
    role: index === 0 ? "self" : "scored",
    x: 4,
    y: 4 + index * 18,
    w: 36,
    h: 14,
    dist: index * 20,
  }));
  const capped = layoutClearPlates(many, { cap: NEAR_PLATE_CAP, viewW: 200, viewH: 400 });
  const drawn = [...capped.values()].filter((item) => item.draw);
  assert.equal(drawn.length, NEAR_PLATE_CAP);
  assert.equal(capped.get("self")?.draw, true);
  assert.equal(capped.get("p8")?.draw, false);

  const off = layoutClearPlates(stacked, { enabled: false, viewW: 320, viewH: 200 });
  assert.equal(off.get("pin")?.x, 10);
  assert.equal(off.get("pin")?.alpha, 1);
});
