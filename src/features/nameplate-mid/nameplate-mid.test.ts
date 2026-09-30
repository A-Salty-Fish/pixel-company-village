import assert from "node:assert/strict";
import test from "node:test";
import {
  MID_ZOOM,
  NAMEPLATE_MID_ENABLED,
  QUIET_SHORT_CAP,
  SHORT_CAP,
  plateGlyph,
  shortPlateNames,
} from "@/features/nameplate-mid/nameplate-mid";

test("PV-PM-018 mid zoom adds short glyphs without a wall of names", () => {
  assert.equal(NAMEPLATE_MID_ENABLED, true);
  assert.equal(plateGlyph("阿盐"), "阿");
  assert.equal([...plateGlyph("阿盐")].length, 1);
  const people = [
    { name: "自", x: 0, y: 0 },
    ...Array.from({ length: 24 }, (_, index) => ({ name: `邻${index}`, x: 10 + index, y: index })),
  ];
  const full = ["自", "邻0", "邻1"];
  const base = {
    showAll: false,
    quiet: false,
    full,
    people,
    self: { x: 0, y: 0 },
  };
  assert.deepEqual(shortPlateNames({ ...base, zoom: 1 }), []);
  assert.deepEqual(shortPlateNames({ ...base, zoom: 3 }), []);
  assert.deepEqual(shortPlateNames({ ...base, zoom: MID_ZOOM, showAll: true }), []);
  assert.deepEqual(shortPlateNames({ ...base, zoom: MID_ZOOM, enabled: false }), []);
  const open = shortPlateNames({ ...base, zoom: MID_ZOOM });
  assert.equal(open.length, SHORT_CAP);
  assert.equal(open.includes("自"), false);
  assert.equal(open.includes("邻0"), false);
  assert.equal(open[0], "邻2");
  assert.equal(open.every((name) => plateGlyph(name).length === 1), true);
  const quiet = shortPlateNames({ ...base, zoom: MID_ZOOM, quiet: true });
  assert.equal(quiet.length, QUIET_SHORT_CAP);
});
