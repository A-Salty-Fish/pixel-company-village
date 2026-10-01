import assert from "node:assert/strict";
import test from "node:test";
import { viewSpan } from "@/lib/pixel-scene";
import {
  NARROW_MAP_FILL_ENABLED,
  fillZoom,
  narrowFillCamera,
  narrowMapFillMark,
  portraitMap,
  settledBounds,
} from "@/features/narrow-map-fill/narrow-map-fill";

function plotPeople(count: number) {
  const people = [];
  for (let index = 0; index < count; index += 1) {
    const col = index % 10;
    const row = Math.floor(index / 10) % 10;
    people.push({
      x: 32 + col * 112 + (col >= 5 ? 32 : 0) + 64,
      y: 240 + row * 80 + (row >= 5 ? 32 : 0) + 58,
    });
  }
  return people;
}

test("PV-D-017 a tall phone frames the settled plots instead of the empty lower meadow", () => {
  assert.equal(NARROW_MAP_FILL_ENABLED, true);
  assert.equal(portraitMap(378, 584), true);
  assert.equal(portraitMap(1112, 614), false);
  assert.equal(portraitMap(768, 776), false);

  const people = plotPeople(18);
  const bounds = settledBounds(people);
  assert.equal(fillZoom(bounds.y1 - bounds.y0), 3);

  const cam = narrowFillCamera({ people, cssW: 378, cssH: 584 });
  assert.ok(cam);
  assert.equal(cam.zoom, 3);
  assert.equal(narrowMapFillMark(cam.zoom), "village");
  const span = viewSpan(cam.zoom);
  assert.ok(cam.y <= bounds.y0);
  assert.ok(cam.y + span.h >= bounds.y1);
  assert.ok(cam.y + span.h < 700);
  assert.equal(narrowFillCamera({ people, cssW: 1112, cssH: 614 }), null);
  assert.equal(narrowFillCamera({ people, cssW: 378, cssH: 584, enabled: false }), null);
  assert.equal(narrowMapFillMark(1, false), "world");
});

test("a spread roster on a phone opens on the upper village, not the lower meadow", () => {
  const people = [];
  const count = 18;
  for (let index = 0; index < count; index += 1) {
    const plot = Math.round((index * 99) / (count - 1));
    const col = plot % 10;
    const row = Math.floor(plot / 10);
    people.push({
      x: 32 + col * 112 + (col >= 5 ? 32 : 0) + 64,
      y: 240 + row * 80 + (row >= 5 ? 32 : 0) + 58,
    });
  }
  const cam = narrowFillCamera({ people, cssW: 390, cssH: 596 });
  assert.ok(cam);
  assert.ok(cam.zoom >= 2);
  const span = viewSpan(cam.zoom);
  assert.ok(cam.y + span.h < 980);
  assert.equal(narrowMapFillMark(cam.zoom), "village");

  const full = narrowFillCamera({ people: plotPeople(100), cssW: 390, cssH: 596 });
  assert.ok(full);
  assert.equal(full.zoom, 2);
  assert.ok(full.y + viewSpan(2).h < 1120);
});
