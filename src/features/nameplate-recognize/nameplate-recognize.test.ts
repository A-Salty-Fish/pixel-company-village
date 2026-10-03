import assert from "node:assert/strict";
import test from "node:test";
import { nearestFieldMates } from "@/features/field-near-read/field-near-read";
import { shortPlateNames } from "@/features/nameplate-mid/nameplate-mid";
import {
  NAMEPLATE_RECOGNIZE_ENABLED,
  frameHasLonePlate,
  nameplateRecognizeMark,
  nameplateRecognizeOn,
  nearPlateFollowBox,
  nearPlatePeerScale,
  plateNoticeablyLarger,
  plateParkedInCenter,
  plateTextIsLone,
  recognizePlateText,
} from "@/features/nameplate-recognize/nameplate-recognize";

test("v1.16.1 plates in one frame keep two glyphs and leave with the person", () => {
  assert.equal(NAMEPLATE_RECOGNIZE_ENABLED, true);
  assert.equal(nameplateRecognizeOn(), true);
  assert.equal(nameplateRecognizeOn(false), false);
  assert.equal(nameplateRecognizeMark(), "1");
  assert.equal(nameplateRecognizeMark(false), "0");

  assert.equal(recognizePlateText("林小满"), "林小");
  assert.equal(recognizePlateText("周晚"), "周晚");
  assert.equal(recognizePlateText("江"), "江");
  assert.equal(recognizePlateText("林小满", false), "林");
  assert.equal(plateTextIsLone("林小满", "林"), true);
  assert.equal(plateTextIsLone("江", "江"), false);
  assert.equal(plateTextIsLone("周晚", "周晚"), false);

  const people = [
    { name: "林小满", x: 100, y: 100 },
    { name: "周晚", x: 140, y: 120 },
    { name: "苏星河", x: 190, y: 150 },
    { name: "江", x: 240, y: 180 },
    { name: "白露", x: 280, y: 200 },
    { name: "郑南星", x: 320, y: 220 },
  ];
  const self = people[0];
  const full = ["林小满"];
  const frame = { camX: 80, camY: 40, spanW: 420, spanH: 320 };
  const shorts = shortPlateNames({
    zoom: 2,
    showAll: false,
    quiet: false,
    full,
    people,
    self: { x: self.x, y: self.y },
  });
  const mates = nearestFieldMates({ people, self, ...frame });
  const mateNames = new Set(mates.map((person) => person.name));
  const plates = [
    ...full.map((name) => ({ name, text: name })),
    ...shorts
      .filter((name) => !mateNames.has(name) && !full.includes(name))
      .map((name) => ({ name, text: recognizePlateText(name) })),
    ...mates.map((person) => ({ name: person.name, text: recognizePlateText(person.name) })),
  ];
  assert.equal(shorts.length > 0, true);
  assert.equal(mates.length > 0, true);
  assert.equal(frameHasLonePlate(plates), false);
  assert.equal(
    plates.every((plate) => [...plate.name].length < 2 || [...plate.text].length >= 2),
    true,
  );
  assert.equal(plates.some((plate) => plate.name === "江" && plate.text === "江"), true);
  const legacy = shorts.map((name) => ({ name, text: recognizePlateText(name, false) }));
  assert.equal(frameHasLonePlate(legacy), true);

  const showAll = people.map((person) => ({ name: person.name, text: person.name }));
  assert.equal(frameHasLonePlate(showAll), false);
  assert.equal(showAll.find((plate) => plate.name === "郑南星")?.text, "郑南星");

  const peer = nearPlatePeerScale([3, 1]);
  assert.equal(peer, 1);
  assert.equal(plateNoticeablyLarger(peer, [1]), false);
  assert.equal(plateNoticeablyLarger(3, [1]), true);
  assert.equal(nearPlatePeerScale([3, 1], false), 3);

  const view = { viewW: 390, viewH: 520, spanW: 608, spanH: 560, spriteW: 40, spriteH: 20, scale: peer };
  const beside = nearPlateFollowBox({ personX: 90, personY: 220, camX: 0, camY: 0, ...view });
  assert.ok(beside);
  assert.equal(beside.w, 40);
  assert.equal(beside.w < 40 * 3, true);
  const personSx = ((90 - 0) / 608) * 390;
  const personSy = ((220 - 28 - 0) / 560) * 520;
  assert.equal(plateParkedInCenter(beside, personSx, personSy, view.viewW, view.viewH), false);
  assert.equal(beside.x + beside.w / 2 < view.viewW * 0.35, true);

  const followed = nearPlateFollowBox({ personX: 90, personY: 220, camX: 30, camY: 0, ...view });
  assert.ok(followed);
  assert.notEqual(Math.round(followed.x), Math.round(beside.x));

  const left = nearPlateFollowBox({ personX: 40, personY: 220, camX: 400, camY: 280, ...view });
  assert.equal(left, null);
  assert.equal(plateParkedInCenter(left, personSx, personSy, view.viewW, view.viewH), false);
  assert.equal(plateParkedInCenter({ x: 140, y: 230, w: 110, h: 48 }, 24, 40, 390, 520), true);
});
