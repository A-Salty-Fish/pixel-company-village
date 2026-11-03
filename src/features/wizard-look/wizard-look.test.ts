import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMS,
  PLAIN_ROBE,
  ROBES,
  SWING_MS,
  WIZARD_FISH,
  WIZARD_LOOK_ENABLED,
  WIZARD_TASK_TOP,
  WIZARD_WORK,
  WIZARD_WORK_TOP,
  hatColors,
  robeColors,
  staffSide,
  wizardAnim,
  wizardPose,
  wizardProp,
  wizardStyle,
} from "./wizard-look";

const scored = (work: number, fish: number, on_task: number) => ({ scored: true as const, work, fish, on_task });

test("the wizard look is on and the robe palette is wide enough to tell people apart", () => {
  assert.equal(WIZARD_LOOK_ENABLED, true);
  assert.equal(ROBES.length, 10);
  assert.equal(new Set(ROBES.map((robe) => robe[0])).size, ROBES.length);
  assert.ok(GEMS.length >= 4);
});

test("the robe colour is fixed by the name, the same on every call", () => {
  const a = wizardStyle("小明", scored(3, 1, 0.7));
  const b = wizardStyle("小明", scored(1, 5, 0.1));
  assert.equal(a.robe, b.robe);
  assert.equal(a.hat, b.hat);
  assert.equal(a.phase, b.phase);
  const robes = new Set(Array.from({ length: 60 }, (_, i) => wizardStyle(`村民${i}`, scored(0, 0, 0)).robe));
  assert.ok(robes.size >= 8, `only ${robes.size} robes over 60 names`);
});

test("scores only add small marks: trim from work, stars from on_task, a drooping hat from fish", () => {
  assert.deepEqual(
    [wizardStyle("a", scored(WIZARD_WORK - 0.1, 0, 0)).trim, wizardStyle("a", scored(WIZARD_WORK, 0, 0)).trim, wizardStyle("a", scored(WIZARD_WORK_TOP, 0, 0)).trim],
    [0, 1, 2],
  );
  assert.equal(wizardStyle("a", scored(0, 0, WIZARD_TASK_TOP)).star, 2);
  assert.equal(wizardStyle("a", scored(0, WIZARD_FISH, 0)).droop, true);
  assert.equal(wizardStyle("a", scored(0, WIZARD_FISH - 1, 0)).droop, false);
});

test("people without scores are plainer wizards", () => {
  const plain = wizardStyle("b", { scored: false });
  assert.equal(plain.plain, true);
  assert.equal(plain.trim, 0);
  assert.equal(plain.star, 0);
  assert.equal(plain.droop, false);
  assert.deepEqual(robeColors(plain), PLAIN_ROBE);
  assert.notDeepEqual(hatColors(plain), hatColors(wizardStyle("b", scored(3, 1, 0.7))));
});

test("tool poses become a stand, and the free hand follows the state", () => {
  assert.equal(wizardAnim("chop"), "idle");
  assert.equal(wizardAnim("dig"), "idle");
  assert.equal(wizardAnim("walk"), "walk");
  assert.equal(wizardProp("hard_work", 0), "raise");
  assert.equal(wizardProp("focused", 0), "book");
  assert.equal(wizardProp("idle", 0), "none");
  assert.notEqual(wizardProp("mixed", 0), wizardProp("mixed", 3));
});

test("the staff sways at rest, swings on a tap, and holds still when motion is reduced", () => {
  const rest = wizardPose(1, 0.5, -1, false);
  assert.equal(rest.swing, 0);
  assert.ok(Math.abs(rest.sway) <= 1);
  const mid = wizardPose(1, 0.5, SWING_MS * 0.45, false);
  assert.ok(mid.swing > 0.5);
  assert.equal(wizardPose(1, 0.5, SWING_MS + 1, false).swing, 0);
  assert.deepEqual(wizardPose(1, 0.5, SWING_MS * 0.45, true), { sway: 0, swing: 0, flash: 0 });
  assert.deepEqual(wizardPose(1, 0.5, 100, false, false), { sway: 0, swing: 0, flash: 0 });
  assert.ok(staffSide("down") > 0 && staffSide("up") < 0);
});
