import assert from "node:assert/strict";
import test from "node:test";
import { PLAY_FIRST_TIP } from "@/features/play-first-tip/play-first-tip";
import { APP_VERSION } from "@/features/village-release/changelog";
import { narrowFillCamera } from "@/features/narrow-map-fill/narrow-map-fill";
import { viewSpan } from "@/lib/pixel-scene";
import {
  FIRST_GLANCE_ENABLED,
  GLANCE_FIND_LINE,
  GLANCE_FORBIDDEN_CLICKS,
  clickIsForbidden,
  findLineShows,
  firstGlanceOn,
  glanceChromeHidden,
  greetFloatHidden,
  greetOnPerson,
  drawnLandmark,
  landmarkInOpeningFrame,
  openingCoversGate,
  openingGate,
  openingGlanceCamera,
  pickGlancePlace,
  placeAim,
  todayBarHidden,
} from "@/features/first-glance/first-glance";

const gate = { id: "gate", x: 88, y: 120, label: "村口" };
const lantern = { x: 852, y: 336 };

test("first glance stays on and does not take 1.17.0", () => {
  assert.equal(FIRST_GLANCE_ENABLED, true);
  assert.equal(firstGlanceOn(), true);
  assert.equal(firstGlanceOn(false), false);
  assert.equal(APP_VERSION, "1.16.0");
  assert.equal(PLAY_FIRST_TIP.includes(GLANCE_FIND_LINE), true);
});

test("closed menu hides the header, today bar, and bottom tools", () => {
  assert.equal(glanceChromeHidden(false), true);
  assert.equal(glanceChromeHidden(true), false);
  assert.equal(glanceChromeHidden(false, false), false);
  assert.equal(todayBarHidden(false, false), true);
  assert.equal(todayBarHidden(false, true), false);
  assert.equal(todayBarHidden(true, false), false);
  assert.equal(greetFloatHidden(false), true);
  assert.equal(greetOnPerson(true, false), true);
  assert.equal(greetOnPerson(false, false), false);
  assert.equal(greetOnPerson(true, true), false);
});

test("the first click is not 去看村口, 知道了, or 拉近", () => {
  const place = pickGlancePlace({
    menuOpen: false,
    beat: gate,
    beatSpeaks: true,
    lantern,
    lanternSpeaks: true,
  });
  assert.ok(place);
  assert.equal(place?.label, "村口");
  assert.equal(clickIsForbidden(place?.label ?? ""), false);
  assert.equal(clickIsForbidden(GLANCE_FIND_LINE), false);
  for (const word of GLANCE_FORBIDDEN_CLICKS) {
    assert.equal(clickIsForbidden(word), true);
    assert.equal(place?.label.includes(word), false);
  }
  assert.equal(findLineShows(false, false), true);
  assert.equal(findLineShows(true, false), false);
  assert.equal(findLineShows(false, true), false);
});

test("a glowing place keeps the old aim and is not a floating sentence", () => {
  const both = pickGlancePlace({
    menuOpen: false,
    beat: gate,
    beatSpeaks: true,
    lantern,
    lanternSpeaks: true,
  });
  assert.equal(both?.kind, "beat");
  assert.deepEqual(placeAim(both!), { kind: "gate", x: 88, y: 120 });

  const lamp = pickGlancePlace({
    menuOpen: false,
    beat: gate,
    beatSpeaks: false,
    lantern,
    lanternSpeaks: true,
  });
  assert.equal(lamp?.kind, "lantern");
  assert.equal(lamp?.label, "灯笼");
  assert.deepEqual(placeAim(lamp!), { kind: "lantern", x: 852, y: 336 });

  assert.equal(
    pickGlancePlace({
      menuOpen: true,
      beat: gate,
      beatSpeaks: true,
      lantern,
      lanternSpeaks: false,
    }),
    null,
  );
  assert.equal(
    pickGlancePlace({
      menuOpen: false,
      beat: gate,
      beatSpeaks: true,
      lantern,
      lanternSpeaks: false,
      enabled: false,
    }),
    null,
  );
});

test("a cropped landmark is not drawn on the current field", () => {
  const gate = { x: 88, y: 120 };
  const field = { camX: 400, camY: 400, spanW: 200, spanH: 180 };
  assert.equal(landmarkInOpeningFrame({ ...gate, ...field }), false);
  assert.equal(drawnLandmark({ ...gate, ...field }), null);
  const standIn = { x: field.camX + field.spanW * 0.58, y: field.camY + field.spanH * 0.62 };
  assert.equal(standIn.x === gate.x && standIn.y === gate.y, false);

  const lantern = { x: 852, y: 336 };
  assert.equal(drawnLandmark({ ...lantern, ...field }), null);

  assert.deepEqual(
    drawnLandmark({ x: gate.x, y: gate.y, camX: 0, camY: 0, spanW: 1216, spanH: 1120 }),
    { x: 88, y: 120 },
  );
  assert.deepEqual(
    drawnLandmark({ x: lantern.x, y: lantern.y, camX: 700, camY: 200, spanW: 400, spanH: 400 }),
    { x: 852, y: 336 },
  );
});

test("opening camera already holds 村口, and a crop still draws nothing on the field", () => {
  const gate = openingGate();
  assert.equal(gate.label, "村口");
  assert.equal(gate.x, 88);
  assert.equal(gate.y, 120);
  assert.equal(openingCoversGate(false), true);
  assert.equal(openingCoversGate(true), false);
  assert.equal(openingCoversGate(false, false), false);

  const people = [];
  for (let index = 0; index < 12; index += 1) {
    const col = index % 6;
    const row = Math.floor(index / 6);
    people.push({ x: 400 + col * 80, y: 360 + row * 70 });
  }
  const field = narrowFillCamera({ people, cssW: 390, cssH: 700 });
  assert.ok(field);
  const span = viewSpan(field.zoom);
  assert.equal(
    landmarkInOpeningFrame({ x: gate.x, y: gate.y, camX: field.x, camY: field.y, spanW: span.w, spanH: span.h }),
    false,
  );
  assert.equal(drawnLandmark({ x: gate.x, y: gate.y, camX: field.x, camY: field.y, spanW: span.w, spanH: span.h }), null);
  const standIn = { x: field.x + span.w * 0.58, y: field.y + span.h * 0.62 };
  assert.equal(standIn.x === gate.x && standIn.y === gate.y, false);

  const opened = openingGlanceCamera({
    x: field.x,
    y: field.y,
    zoom: field.zoom,
    landmarkX: gate.x,
    landmarkY: gate.y,
  });
  assert.equal(opened.zoom, field.zoom);
  const openSpan = viewSpan(opened.zoom);
  assert.equal(
    landmarkInOpeningFrame({ x: gate.x, y: gate.y, camX: opened.x, camY: opened.y, spanW: openSpan.w, spanH: openSpan.h }),
    true,
  );
  assert.deepEqual(
    drawnLandmark({ x: gate.x, y: gate.y, camX: opened.x, camY: opened.y, spanW: openSpan.w, spanH: openSpan.h }),
    { x: gate.x, y: gate.y },
  );

  const held = openingGlanceCamera({
    x: opened.x,
    y: opened.y,
    zoom: opened.zoom,
    landmarkX: gate.x,
    landmarkY: gate.y,
  });
  assert.deepEqual(held, opened);
});
