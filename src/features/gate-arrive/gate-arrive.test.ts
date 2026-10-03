import assert from "node:assert/strict";
import test from "node:test";
import { cameraFocus, placeVillagers, viewSpan, clampCamera, WORLD_W, WORLD_H } from "@/lib/pixel-scene";
import { GATE_POST } from "@/lib/worldcraft";
import { copyIsClean } from "@/lib/wave-d";
import { NEXT_BEAT_DONE, NEXT_BEATS } from "@/features/week-next-beat/next-beat";
import {
  GATE_ARRIVE_ENABLED,
  GATE_ARRIVE_ZOOM,
  GATE_FRAME_BOTTOM,
  frameContains,
  gateArriveCamera,
  gateArriveFor,
  gateArriveHolds,
  gateArriveMark,
} from "@/features/gate-arrive/gate-arrive";

test("PV-PM-124 去看村口 leaves the home field and the viewer's nameplate", () => {
  assert.equal(GATE_ARRIVE_ENABLED, true);
  assert.equal(gateArriveMark(), "1");
  assert.equal(gateArriveMark(false), "0");
  assert.equal(NEXT_BEAT_DONE, "镜头到了。");
  assert.equal(NEXT_BEATS.find((beat) => beat.id === "gate")?.label, "村口");

  const frame = gateArriveFor("gate");
  assert.ok(frame);
  assert.equal(frame.zoom, GATE_ARRIVE_ZOOM);
  assert.equal(frame.y + frame.spanH, GATE_FRAME_BOTTOM);
  assert.equal(gateArriveCamera(false), null);
  assert.equal(gateArriveFor("lantern-frame"), null);
  assert.equal(gateArriveFor("pond"), null);
  assert.equal(gateArriveFor("bench"), null);
  assert.equal(gateArriveHolds("gate"), true);
  assert.equal(gateArriveHolds("lantern-frame"), false);
  assert.equal(gateArriveHolds("gate", false), false);

  assert.equal(frameContains(frame, GATE_POST.x, GATE_POST.y), true);
  assert.equal(frameContains(frame, GATE_POST.x - 8, GATE_POST.y), true);
  assert.equal(frameContains(frame, GATE_POST.x + 14, GATE_POST.y + 16), true);

  const [self] = placeVillagers([{ name: "林小满", scored: false, plot: 0, state: "default", speed: 1 }]);
  const roof = { x: self.homeX + 48 + 4, y: self.homeY + 24 - 18 };
  const field = { x: self.homeX + 36, y: self.homeY + 40 };
  const plate = { x: self.x, y: self.y - 28 };
  assert.equal(frameContains(frame, self.x, self.y), false);
  assert.equal(frameContains(frame, roof.x, roof.y), false);
  assert.equal(frameContains(frame, field.x, field.y), false);
  assert.equal(frameContains(frame, plate.x, plate.y), false);
  assert.ok(plate.y >= frame.y + frame.spanH + 48);

  const homeCam = cameraFocus(self, 2);
  const moved = Math.hypot(frame.x - homeCam.x, frame.y - homeCam.y);
  assert.ok(moved > 24, `camera only moved ${moved}`);

  const oldZoom = 3;
  const old = clampCamera(88 - WORLD_W / oldZoom / 2, 120 - WORLD_H / oldZoom / 2, oldZoom);
  const oldSpan = viewSpan(oldZoom);
  assert.equal(old.x, 0);
  assert.equal(old.y, 0);
  assert.ok(roof.y < old.y + oldSpan.h);
  assert.ok(self.y < old.y + oldSpan.h);

  assert.equal(copyIsClean(["点「去看村口」，镜头离开自己的田和屋顶，停在村口。", "到了仍说「镜头到了。」自己的名牌不在这一帧。"]), true);
});
