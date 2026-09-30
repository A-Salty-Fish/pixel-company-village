import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  WEEK_NEXT_BEAT_ENABLED,
  nextBeatCopy,
  nextBeatLabel,
  nextBeatOffer,
  pickNextBeat,
} from "@/features/week-next-beat/next-beat";

test("PV-PM-024 offers one nearby beat only after the week is complete", () => {
  assert.equal(WEEK_NEXT_BEAT_ENABLED, true);
  assert.equal(nextBeatOffer(false), false);
  assert.equal(nextBeatOffer(true), true);
  assert.equal(nextBeatOffer(true, false), false);
  const gate = pickNextBeat(null);
  assert.equal(gate?.id, "gate");
  const bench = pickNextBeat({ x: 600, y: 400 });
  assert.equal(bench?.id, "bench");
  const pond = pickNextBeat({ x: 100, y: 90 });
  assert.equal(pond?.id, "pond");
  assert.equal(pickNextBeat({ x: 1, y: 1 }, false), null);
  assert.equal(nextBeatLabel(bench!), "去看长椅");
  assert.equal(copyIsClean(nextBeatCopy()), true);
});
