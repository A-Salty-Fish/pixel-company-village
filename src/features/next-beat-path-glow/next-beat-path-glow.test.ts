import assert from "node:assert/strict";
import test from "node:test";
import { copyIsClean } from "@/lib/wave-d";
import {
  NEXT_BEAT_GLOW_MS,
  NEXT_BEAT_GLOW_TILES,
  NEXT_BEAT_PATH_GLOW_ENABLED,
  isNextBeatAim,
  nextBeatGlowColorsAreWarm,
  nextBeatGlowCopy,
  nextBeatGlowMark,
  nextBeatGlowOn,
  nextBeatGlowPixels,
  nextBeatGlowTiles,
  nextBeatSuggestReady,
  nextBeatSuggestion,
} from "@/features/next-beat-path-glow/next-beat-path-glow";

test("PV-PM-088 breathes warm path stones and then offers a dismissible next line", () => {
  assert.equal(NEXT_BEAT_PATH_GLOW_ENABLED, true);
  assert.equal(nextBeatGlowOn(), true);
  assert.equal(nextBeatGlowOn(false), false);
  assert.equal(NEXT_BEAT_GLOW_MS >= 2_000 && NEXT_BEAT_GLOW_MS <= 3_000, true);
  assert.equal(NEXT_BEAT_GLOW_TILES >= 2 && NEXT_BEAT_GLOW_TILES <= 3, true);

  assert.equal(isNextBeatAim("gate"), true);
  assert.equal(isNextBeatAim("pond"), true);
  assert.equal(isNextBeatAim("bench"), true);
  assert.equal(isNextBeatAim("lantern"), false);
  assert.equal(isNextBeatAim("gate", false), false);

  assert.equal(nextBeatGlowMark({ elapsedMs: 0, reduced: false, quiet: false }), "pulse");
  assert.equal(nextBeatGlowMark({ elapsedMs: 900, reduced: false, quiet: false }), "pulse");
  assert.equal(nextBeatGlowMark({ elapsedMs: 400, reduced: true, quiet: false }), "still");
  assert.equal(nextBeatGlowMark({ elapsedMs: 400, reduced: false, quiet: true }), "still");
  assert.equal(nextBeatGlowMark({ elapsedMs: NEXT_BEAT_GLOW_MS, reduced: false, quiet: false }), "off");
  assert.equal(nextBeatGlowMark({ elapsedMs: 10, reduced: false, quiet: false, enabled: false }), "off");

  const from = { x: 80, y: 200 };
  const to = { x: 320, y: 80 };
  const tiles = nextBeatGlowTiles(from, to);
  assert.equal(tiles.length, 3);
  for (const tile of tiles) {
    const t = (tile.x - from.x) / (to.x - from.x);
    assert.equal(t > 0 && t < 1, true);
  }

  const still = nextBeatGlowPixels(from, to, "still", 0);
  const later = nextBeatGlowPixels(from, to, "still", 4);
  assert.deepEqual(still, later);
  assert.equal(still.length, 6);
  assert.equal(nextBeatGlowColorsAreWarm(still), true);
  assert.equal(still.every((pixel) => pixel.color !== "#ffffff"), true);
  assert.equal(nextBeatGlowPixels(from, to, "off", 0).length, 0);
  assert.equal(nextBeatGlowPixels(from, to, "pulse", 0, false).length, 0);

  const pulse = nextBeatGlowPixels(from, to, "pulse", 0);
  const flipped = nextBeatGlowPixels(from, to, "pulse", 2);
  assert.equal(nextBeatGlowColorsAreWarm(pulse), true);
  assert.equal(nextBeatGlowColorsAreWarm(flipped), true);
  assert.notDeepEqual(pulse.map((pixel) => pixel.color), flipped.map((pixel) => pixel.color));

  assert.equal(nextBeatSuggestion("gate")?.line, "也可以去看湖边");
  assert.equal(nextBeatSuggestion("pond")?.id, "bench");
  assert.equal(nextBeatSuggestion("bench")?.line, "也可以去看村口");
  assert.equal(nextBeatSuggestion("lantern"), null);
  assert.equal(nextBeatSuggestion("gate", false), null);
  assert.equal(nextBeatSuggestReady(NEXT_BEAT_GLOW_MS - 1, false), false);
  assert.equal(nextBeatSuggestReady(NEXT_BEAT_GLOW_MS, false), true);
  assert.equal(nextBeatSuggestReady(NEXT_BEAT_GLOW_MS + 400, true), false);
  assert.equal(nextBeatSuggestReady(NEXT_BEAT_GLOW_MS, false, false), false);
  assert.equal(copyIsClean(nextBeatGlowCopy()), true);
});
