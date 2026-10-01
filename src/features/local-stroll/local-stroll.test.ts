import assert from "node:assert/strict";
import test from "node:test";
import { updateVillager, type PlacedVillager } from "@/lib/pixel-scene";
import {
  WANDER_WORLD_RING_ENABLED,
  localStrollPose,
  onWorldRing,
  wanderPose,
  worldRingPose,
} from "@/features/local-stroll/local-stroll";

function sample(baseX: number, baseY: number, phase: number, speed = 1) {
  let rest = 0;
  let ring = 0;
  let far = 0;
  const steps = 120;
  for (let i = 0; i < steps; i += 1) {
    const pose = localStrollPose(baseX, baseY, phase, i * 0.5, speed);
    if (pose.rest) rest += 1;
    if (onWorldRing(pose.x, pose.y, 20)) ring += 1;
    if (Math.hypot(pose.x - baseX, pose.y - baseY) > 64) far += 1;
  }
  return { rest, ring, far, steps };
}

test("the world ring is off and wander stays near home", () => {
  assert.equal(WANDER_WORLD_RING_ENABLED, false);
  const homes = [
    { baseX: 400, baseY: 420, phase: 1.7 },
    { baseX: 160, baseY: 310, phase: 0.4 },
    { baseX: 860, baseY: 980, phase: 4.2 },
  ];
  for (const home of homes) {
    const seen = sample(home.baseX, home.baseY, home.phase);
    assert.equal(seen.ring, 0);
    assert.equal(seen.far, 0);
    assert.ok(seen.rest > seen.steps * 0.45);
  }
});

test("turning the ring back on restores the outer lap", () => {
  const start = worldRingPose(0, 0, 1);
  assert.equal(start.x, 48);
  assert.equal(start.y, 216);
  assert.equal(start.rest, false);
  assert.equal(onWorldRing(start.x, start.y, 1), true);
  const lap = wanderPose({ baseX: 400, baseY: 420, wanderPhase: 0, speed: 1 }, 6.25, true);
  assert.equal(onWorldRing(lap.x, lap.y, 2), true);
  assert.equal(lap.rest, false);
});

test("a low work and fish villager no longer orbits the edge", () => {
  const person = {
    name: "王满",
    scored: true as const,
    msgs: 4,
    work: 0.22,
    fish: 0.4,
    on_task: 0.2,
    state: "wander" as const,
    speed: 1,
    plot: 3,
    id: 1,
    homeX: 336,
    homeY: 362,
    baseX: 400,
    baseY: 420,
    x: 0,
    y: 0,
    dir: "down" as const,
    identity: { base: "wilds" as const, palette: 1, tool: "hoe" as const },
    wanderPhase: 2.4,
    orchard: false,
  } satisfies PlacedVillager;
  let ring = 0;
  let rests = 0;
  for (let t = 0; t < 60; t += 0.5) {
    updateVillager(person, t);
    if (onWorldRing(person.x, person.y, 18)) ring += 1;
    if (person.wanderRest) rests += 1;
    assert.ok(Math.hypot(person.x - person.baseX, person.y - person.baseY) <= 64);
  }
  assert.equal(ring, 0);
  assert.ok(rests > 40);
});
