import assert from "node:assert/strict";
import test from "node:test";
import {
  ZOOM_PLATE_LIFT_ENABLED,
  liftPlateBox,
  plateClearBottom,
  plateNeedsLift,
  zoomPlateLiftMark,
  zoomPlateLiftOn,
} from "@/features/zoom-plate-lift/zoom-plate-lift";

test("PV-PM-122 lifts the nearest plates above the first-run strip", () => {
  assert.equal(ZOOM_PLATE_LIFT_ENABLED, true);
  assert.equal(zoomPlateLiftOn(), true);
  assert.equal(zoomPlateLiftOn(false), false);
  assert.equal(zoomPlateLiftMark(), "1");
  assert.equal(zoomPlateLiftMark(false), "0");

  const clear = plateClearBottom({
    canvasTop: 100,
    canvasHeight: 400,
    canvasBitmapH: 800,
    guideTop: 420,
    guideHeight: 40,
  });
  assert.equal(clear, Math.floor(((420 - 100 - 2) / 400) * 800));
  assert.equal(
    plateClearBottom({
      canvasTop: 100,
      canvasHeight: 400,
      canvasBitmapH: 800,
      guideTop: 420,
      guideHeight: 40,
      enabled: false,
    }),
    null,
  );
  assert.equal(
    plateClearBottom({
      canvasTop: 100,
      canvasHeight: 400,
      canvasBitmapH: 800,
      guideTop: 520,
      guideHeight: 40,
    }),
    null,
  );

  const low = { x: 10, y: 700, w: 40, h: 24 };
  const lifted = liftPlateBox(low, clear);
  assert.equal(lifted.y + lifted.h <= (clear ?? 0), true);
  assert.equal(lifted.w, low.w);
  assert.equal(lifted.h, low.h);
  const high = { x: 10, y: 40, w: 40, h: 24 };
  assert.deepEqual(liftPlateBox(high, clear), high);

  const neighbor = liftPlateBox({ x: 10, y: 700, w: 48, h: 24 }, clear, [lifted]);
  assert.equal(neighbor.y + neighbor.h <= (clear ?? 0), true);
  assert.equal(neighbor.y + neighbor.h <= lifted.y, true);

  assert.equal(
    plateNeedsLift({ name: "周晚风", selfName: "林小满", nearNames: ["周晚风", "苏星河"], showAll: false, clearBottom: clear }),
    true,
  );
  assert.equal(
    plateNeedsLift({ name: "林小满", selfName: "林小满", nearNames: ["周晚风"], showAll: false, clearBottom: clear }),
    true,
  );
  assert.equal(
    plateNeedsLift({ name: "周晚风", selfName: "林小满", nearNames: ["周晚风"], showAll: true, clearBottom: clear }),
    false,
  );
  assert.equal(
    plateNeedsLift({ name: "江澄", selfName: "林小满", nearNames: ["周晚风"], showAll: false, clearBottom: clear }),
    false,
  );
  assert.equal(plateNeedsLift({ name: "周晚风", selfName: "林小满", nearNames: ["周晚风"], showAll: false, clearBottom: null }), false);
});
