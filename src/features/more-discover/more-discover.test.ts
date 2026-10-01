import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NARROW_CHROME_MAX_PX } from "@/features/narrow-chrome/narrow-chrome";
import {
  MORE_DISCOVER_ENABLED,
  MORE_DISCOVER_KEY,
  MORE_DISCOVER_MS,
  moreCueMode,
  moreDiscoverStored,
} from "@/features/more-discover/more-discover";

const fresh = {
  stored: null,
  width: 768,
  mapReady: true,
  opened: false,
  elapsedMs: 0,
  reduceMotion: false,
};

test("更多 shows one cue on the first narrow visit, then stays quiet", () => {
  assert.equal(MORE_DISCOVER_ENABLED, true);
  assert.equal(MORE_DISCOVER_KEY, "village:more-discover-v1");
  assert.equal(MORE_DISCOVER_MS, 8_000);
  assert.equal(moreDiscoverStored(), "1");
  assert.equal(moreCueMode(fresh), "pulse");
  assert.equal(moreCueMode({ ...fresh, width: 390 }), "pulse");
  assert.equal(moreCueMode({ ...fresh, width: NARROW_CHROME_MAX_PX }), "pulse");
  assert.equal(moreCueMode({ ...fresh, reduceMotion: true }), "dot");
  assert.equal(moreCueMode({ ...fresh, elapsedMs: MORE_DISCOVER_MS - 1 }), "pulse");
  assert.equal(moreCueMode({ ...fresh, elapsedMs: MORE_DISCOVER_MS }), "off");
  assert.equal(moreCueMode({ ...fresh, opened: true }), "off");
  assert.equal(moreCueMode({ ...fresh, mapReady: false }), "off");
  assert.equal(moreCueMode({ ...fresh, stored: "1" }), "off");
  assert.equal(moreCueMode({ ...fresh, width: NARROW_CHROME_MAX_PX + 1 }), "off");
  assert.equal(moreCueMode({ ...fresh, enabled: false }), "off");
  assert.equal(moreCueMode({ ...fresh, elapsedMs: Number.NaN }), "off");
});

test("更多 pulse is a whole-button rim, and reduced motion stays an 8px dot", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const pulse = css.match(/\.map-more-cue\[data-more-cue="pulse"\]\s*\{([^}]*)\}/);
  const dot = css.match(/\.map-more-cue\[data-more-cue="dot"\]\s*\{([^}]*)\}/);
  assert.ok(pulse, "pulse rule");
  assert.ok(dot, "dot rule");
  assert.match(pulse[1], /inset:\s*0/);
  assert.doesNotMatch(pulse[1], /width:\s*8px/);
  assert.match(pulse[1], /opacity:\s*1|more-cue-pulse/);
  assert.match(dot[1], /width:\s*8px/);
  assert.match(dot[1], /height:\s*8px/);
  assert.match(css, /\.map-more-toggle:has\(\[data-more-cue="pulse"\]\)\s*\{[^}]*more-cue-btn/);
  assert.match(css, /@keyframes more-cue-btn/);
  assert.doesNotMatch(css, /more-cue-pulse[\s\S]*opacity:\s*0\.45/);
});
