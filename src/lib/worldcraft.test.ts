import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "./wave-d";
import {
  FIND_ME_LABEL,
  PLATE_LOUD_LINE,
  PLATE_QUIET_LINE,
  benchFrame,
  benchPose,
  chorePixels,
  findMeRing,
  landmarkPixels,
  nearPorch,
  FIND_ME_HOLD_MS,
  PLATE_CAP,
  PLATE_QUIET_CAP,
  plateLegend,
  porchPixels,
  proximityNods,
  selectPanoramaPlates,
  showNameplate,
} from "./worldcraft";

test("panorama plates stay with self, neighbors, and pins until 全显", () => {
  assert.equal(showNameplate(1, false, false, true), false);
  assert.equal(showNameplate(3, false, false, true), false);
  assert.equal(showNameplate(2, false, false, false), false);
  assert.equal(showNameplate(1, true, false, true), true);
  assert.equal(showNameplate(1, false, true, true), true);
  const people = [
    { name: "自", x: 0, y: 0 },
    { name: "近", x: 40, y: 0 },
    { name: "次", x: 70, y: 10 },
    { name: "远", x: 400, y: 400 },
    ...Array.from({ length: 8 }, (_, index) => ({ name: `邻${index}`, x: 20, y: 10 + index })),
  ];
  const quiet = selectPanoramaPlates({
    people,
    selfName: "自",
    pins: ["远"],
    hot: [],
    showAll: false,
    quiet: true,
  });
  assert.equal(quiet.includes("自"), true);
  assert.equal(quiet.includes("远"), true);
  assert.equal(quiet.includes("近"), false);
  assert.equal(quiet.length <= PLATE_QUIET_CAP, true);
  const open = selectPanoramaPlates({
    people,
    selfName: "自",
    pins: ["远"],
    hot: ["次"],
    showAll: false,
    quiet: false,
  });
  assert.equal(open[0], "自");
  assert.equal(open.includes("远"), true);
  assert.equal(open.includes("次"), true);
  assert.equal(open.includes("邻0"), true);
  assert.equal(open.length, PLATE_CAP);
  assert.equal(open.includes("近"), false);
  const all = selectPanoramaPlates({
    people,
    selfName: "自",
    pins: [],
    hot: [],
    showAll: true,
    quiet: true,
  });
  assert.equal(all.length, people.length);
  assert.equal(FIND_ME_HOLD_MS >= 1500, true);
  assert.equal(plateLegend(true), PLATE_QUIET_LINE);
  assert.equal(plateLegend(false), PLATE_LOUD_LINE);
  assert.equal(copyIsClean([PLATE_QUIET_LINE, PLATE_LOUD_LINE, FIND_ME_LABEL]), true);
});

test("finished chores leave footprints, a tool, and a ribbon", () => {
  assert.equal(chorePixels({ steps: 0, watered: false, ribbon: false }).length, 0);
  const walked = chorePixels({ steps: 2, watered: false, ribbon: false });
  const watered = chorePixels({ steps: 2, watered: true, ribbon: false });
  const done = chorePixels({ steps: 3, watered: true, ribbon: true });
  assert.equal(walked.some((pixel) => pixel.color === "#3a2412"), true);
  assert.equal(watered.length > walked.length, true);
  assert.equal(watered.some((pixel) => pixel.color === "#3a8fbc"), true);
  assert.equal(done.some((pixel) => pixel.color === "#c44b3a"), true);
  assert.equal(done.length > watered.length, true);
});

test("proximity nods, porch, and bench tuck into the frame", () => {
  const self = { name: "自", x: 100, y: 100 };
  const near = proximityNods(self, [
    self,
    { name: "邻", x: 140, y: 120 },
    { name: "远", x: 400, y: 400 },
  ]);
  assert.deepEqual(near, ["邻"]);
  assert.equal(nearPorch({ x: 40, y: 50 }, { x: 20, y: 30 }), true);
  assert.equal(nearPorch({ x: 400, y: 400 }, { x: 20, y: 30 }), false);
  const pose = benchPose({ x: 10, y: 20 });
  assert.equal(pose.y > 20, true);
  const frame = benchFrame({ x: 10, y: 20 });
  assert.equal(frame.back[0].y < 20, true);
  assert.equal(frame.seat[0].y > 20, true);
  const dim = porchPixels(true, false, true, 0);
  const lit = porchPixels(true, true, false, 0);
  const later = porchPixels(true, true, false, 3);
  assert.equal(dim.length > 0, true);
  assert.equal(porchPixels(false, false, false, 0).length, 0);
  assert.notDeepEqual(lit, later);
  assert.deepEqual(porchPixels(true, true, true, 0), porchPixels(true, true, true, 4));
});

test("landmarks and the find-me ring stay readable and still", () => {
  const marks = landmarkPixels({ x: 200, y: 300 });
  assert.equal(marks.some((pixel) => pixel.color === "#3a8fbc"), true);
  assert.equal(marks.some((pixel) => pixel.color === "#c44b3a"), true);
  assert.equal(marks.some((pixel) => pixel.color === "#f4d7a1"), true);
  assert.equal(landmarkPixels(null).some((pixel) => pixel.color === "#c44b3a"), false);
  assert.deepEqual(findMeRing(10, 40, true, 0), findMeRing(10, 40, true, 3));
  assert.notDeepEqual(findMeRing(10, 40, false, 0), findMeRing(10, 40, false, 1));
});
