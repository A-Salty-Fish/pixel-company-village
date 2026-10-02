import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CARD_OPEN_SQUASH_ENABLED, CARD_SQUASH_MS, cardEdgeScale, cardSquashMark } from "@/features/card-open-squash/card-open-squash";

test("CARD_OPEN_SQUASH squashes the card edge for 40–80ms and is still when quiet", () => {
  assert.equal(CARD_OPEN_SQUASH_ENABLED, true);
  assert.equal(CARD_SQUASH_MS >= 40 && CARD_SQUASH_MS <= 80, true);
  assert.equal(cardSquashMark({ elapsedMs: 0, quiet: false }), "squash");
  assert.equal(cardSquashMark({ elapsedMs: CARD_SQUASH_MS - 1, quiet: false }), "squash");
  assert.equal(cardSquashMark({ elapsedMs: CARD_SQUASH_MS, quiet: false }), "off");
  assert.equal(cardSquashMark({ elapsedMs: 0, quiet: true }), "still");
  assert.equal(cardSquashMark({ elapsedMs: 10, quiet: false, reduced: true }), "still");
  assert.equal(cardSquashMark({ elapsedMs: 10, quiet: false, enabled: false }), "off");
  assert.equal(cardSquashMark({ elapsedMs: Number.NaN, quiet: false }), "off");

  const dipped = cardEdgeScale(CARD_SQUASH_MS * 0.25, false);
  const bounced = cardEdgeScale(CARD_SQUASH_MS * 0.75, false);
  assert.equal(dipped < 1, true);
  assert.equal(bounced > 1, true);
  assert.equal(cardEdgeScale(0, true), 1);
  assert.equal(cardEdgeScale(10, false, true), 1);
  assert.equal(cardEdgeScale(CARD_SQUASH_MS, false), 1);
  assert.equal(cardEdgeScale(20, false, false, false), 1);

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /data-card-squash="squash"/);
  assert.match(css, /card-edge-squash 64ms/);
  assert.match(css, /data-card-squash="still"/);
  const card = readFileSync("src/components/signal-card.tsx", "utf8");
  assert.match(card, /data-card-squash/);
  assert.match(card, /cardSquashMark/);
});
