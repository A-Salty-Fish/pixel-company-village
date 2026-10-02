import assert from "node:assert/strict";
import test from "node:test";
import {
  QUIET_KEEPS_DUSK_ENABLED,
  duskSystemOn,
  duskWindowsLit,
  quietKeepsDuskOn,
} from "@/features/quiet-dusk-hearth/quiet-dusk-hearth";
import { EMPTY_WAVE, buildDecor } from "@/lib/wave-d";

const base = {
  blob: EMPTY_WAVE,
  ymd: "2026-10-02",
  seasonId: "autumn",
  festival: false,
  familiarity: {},
  selfName: null,
  fedNames: [],
  now: 0,
};

test("PV-PM-101 quiet keeps dusk windows and reduced motion does not put them out", () => {
  assert.equal(QUIET_KEEPS_DUSK_ENABLED, true);
  assert.equal(quietKeepsDuskOn(), true);
  assert.equal(quietKeepsDuskOn(false), false);
  assert.equal(duskSystemOn({ system: true, quiet: true }), true);
  assert.equal(duskSystemOn({ system: true, quiet: false }), true);
  assert.equal(duskSystemOn({ system: false, quiet: false }), false);
  assert.equal(duskSystemOn({ system: true, quiet: true }, false), false);
  assert.equal(duskWindowsLit({ hour: 18, system: true, quiet: true }), true);
  assert.equal(duskWindowsLit({ hour: 18, system: true, quiet: true }, false), false);
  assert.equal(duskWindowsLit({ hour: 12, system: true, quiet: true }), false);
  assert.equal(duskWindowsLit({ hour: 21, system: true, quiet: true }), false);

  const quietDusk = buildDecor({ ...base, hour: 18, quiet: true, reduced: true });
  assert.equal(quietDusk.dusk, true);
  assert.equal(quietDusk.critters, "none");
  assert.equal(quietDusk.night, false);

  const loudDusk = buildDecor({ ...base, hour: 18, quiet: false, reduced: false });
  assert.equal(loudDusk.dusk, true);
  assert.equal(loudDusk.critters !== "none", true);

  const quietDay = buildDecor({ ...base, hour: 10, quiet: true, reduced: false });
  assert.equal(quietDay.dusk, false);
});
