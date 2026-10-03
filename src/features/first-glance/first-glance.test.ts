import assert from "node:assert/strict";
import test from "node:test";
import { PLAY_FIRST_TIP } from "@/features/play-first-tip/play-first-tip";
import { APP_VERSION } from "@/features/village-release/changelog";
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
