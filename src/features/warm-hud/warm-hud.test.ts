import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MAP_ROOM_MIN_PX } from "@/features/map-room/map-room";
import { WARM_HUD_ENABLED, warmHudLayoutSafe, warmHudMark, warmHudOn } from "@/features/warm-hud/warm-hud";

test("PV-PM-078 warms score chips and controls without growing the chrome", () => {
  assert.equal(WARM_HUD_ENABLED, true);
  assert.equal(warmHudOn(), true);
  assert.equal(warmHudOn(false), false);
  assert.equal(warmHudMark(), "warm");
  assert.equal(warmHudMark(false), "flat");

  const css = readFileSync("src/app/globals.css", "utf8");
  const start = css.indexOf("/* PV-PM-078");
  const end = css.indexOf("/* PV-PM-078 end */");
  assert.equal(start >= 0 && end > start, true);
  const block = css.slice(start, end);
  assert.equal(warmHudLayoutSafe(block), true);
  assert.match(block, /data-warm-hud="warm"/);
  assert.match(block, /\.hud-chip/);
  assert.match(block, /border-radius:\s*2px/);
  assert.match(block, /#8a5528/);
  assert.match(block, /#2a1a10/);
  assert.match(block, /#fff6d8/);
  assert.match(block, /:not\(\.map-more-toggle\)/);
  assert.match(block, /\.ring-track/);
  assert.equal(block.includes("min-height"), false);
  assert.equal(block.includes("village-map-slot"), false);
  assert.equal(block.includes("@media"), false);

  assert.match(css, /min-height:\s*280px/);
  assert.equal(MAP_ROOM_MIN_PX, 280);

  const page = readFileSync("src/components/village-page.tsx", "utf8");
  assert.match(page, /data-testid="exit-village"/);
  assert.match(page, /data-warm-hud=\{warmHudMark\(\)\}/);
});
