import assert from "node:assert/strict";
import test from "node:test";
import { waitingCueFor, waitingCueMark, waitingCuePixels, WAITING_CUE_ENABLED } from "@/features/waiting-cue/waiting-cue";

test("PV-PM-035 paints a lake or lamp silhouette and leaves the click path alone", () => {
  assert.equal(WAITING_CUE_ENABLED, true);
  const both = waitingCueFor([
    { kind: "toy", x: 1, y: 2 },
    { kind: "neighbor", x: 10, y: 20 },
    { kind: "lamp", x: 30, y: 40 },
  ]);
  assert.equal(both?.kind, "lake");
  assert.equal(both?.x, 26);
  assert.equal(waitingCueFor([{ kind: "lamp", x: 8, y: 9 }])?.kind, "lamp");
  assert.equal(waitingCueFor([{ kind: "toy", x: 1, y: 1 }]), null);
  assert.equal(waitingCueFor([{ kind: "cat", x: 4, y: 4 }]), null);
  assert.equal(waitingCueFor([{ kind: "neighbor", x: 1, y: 1 }], false), null);
  assert.equal(waitingCueMark(both), "lake");
  assert.equal(waitingCueMark(null), "off");

  const still = waitingCuePixels(40, 80, 0, true);
  const later = waitingCuePixels(40, 80, 2, true);
  assert.deepEqual(still, later);
  assert.equal(still.some((pixel) => pixel.color === "#3a2418"), true);
  assert.equal(waitingCuePixels(40, 80, 1, false, false).length, 0);
  const moving = waitingCuePixels(40, 80, 1.2, false);
  assert.equal(moving.length, still.length);
  assert.notDeepEqual(
    moving.map((pixel) => pixel.x),
    still.map((pixel) => pixel.x),
  );
});
