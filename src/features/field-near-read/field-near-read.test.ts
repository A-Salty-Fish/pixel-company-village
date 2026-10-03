import assert from "node:assert/strict";
import test from "node:test";
import {
  FIELD_NEAR_CHARS,
  FIELD_NEAR_COUNT,
  FIELD_NEAR_READ_ENABLED,
  fieldNearReadMark,
  fieldNearReadOn,
  inCameraFrame,
  lampPorchAfterSelf,
  nearFieldLabel,
  nearestFieldMates,
  plateTextReads,
} from "@/features/field-near-read/field-near-read";

test("PV-PM-118 reads two characters for the nearest people in frame", () => {
  assert.equal(FIELD_NEAR_READ_ENABLED, true);
  assert.equal(fieldNearReadOn(), true);
  assert.equal(fieldNearReadOn(false), false);
  assert.equal(fieldNearReadMark(), "1");
  assert.equal(fieldNearReadMark(false), "0");
  assert.equal(FIELD_NEAR_COUNT, 2);
  assert.equal(FIELD_NEAR_CHARS, 2);
  assert.equal(nearFieldLabel("林小满"), "林小");
  assert.equal([...nearFieldLabel("江澄")].length, 2);
  assert.equal(nearFieldLabel("江"), "江");
  assert.equal(plateTextReads("林小满", "林小"), true);
  assert.equal(plateTextReads("林小满", "林"), false);
  assert.equal(plateTextReads("林小满", "林小满"), true);
  assert.equal(plateTextReads("江澄", "周晚"), false);

  const self = { name: "林小满", x: 100, y: 100 };
  const people = [
    self,
    { name: "贴身甲", x: 108, y: 104 },
    { name: "周晚风", x: 180, y: 130 },
    { name: "苏星河", x: 210, y: 150 },
    { name: "江澄", x: 260, y: 200 },
  ];
  const frame = { camX: 150, camY: 80, spanW: 180, spanH: 200 };
  assert.equal(inCameraFrame(people[1], frame.camX, frame.camY, frame.spanW, frame.spanH), false);
  assert.equal(inCameraFrame(people[2], frame.camX, frame.camY, frame.spanW, frame.spanH), true);
  const mates = nearestFieldMates({ people, self, ...frame });
  assert.deepEqual(
    mates.map((person) => person.name),
    ["周晚风", "苏星河"],
  );
  assert.equal(mates.every((person) => plateTextReads(person.name, nearFieldLabel(person.name))), true);
  assert.deepEqual(nearestFieldMates({ people, self, ...frame, showAll: true }), []);
  assert.deepEqual(nearestFieldMates({ people, self, ...frame, enabled: false }), []);
  assert.deepEqual(nearestFieldMates({ people, self: null, ...frame }), []);

  assert.equal(lampPorchAfterSelf({ id: "lamp", seen: false, hasRoof: false }), "arm");
  assert.equal(lampPorchAfterSelf({ id: "lamp", seen: true, hasRoof: true }), "follow");
  assert.equal(lampPorchAfterSelf({ id: "dew", seen: true, hasRoof: true }), "keep");
  assert.equal(lampPorchAfterSelf({ id: "lamp", seen: true, hasRoof: false }), "keep");
  assert.equal(lampPorchAfterSelf({ id: "lamp", seen: true, hasRoof: true, enabled: false }), "keep");
});
