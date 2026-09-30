import assert from "node:assert/strict";
import test from "node:test";
import { plateViewport, viewportMode } from "@/features/nameplate-viewport/nameplate-viewport";

test("PV-PM-026 fades far labels and keeps neighbors clear when zoomed", () => {
  assert.equal(viewportMode(false, 1), "off");
  assert.equal(viewportMode(true, 1), "fade");
  assert.equal(viewportMode(true, 3), "near");
  assert.equal(viewportMode(true, 1, false), "off");

  const edge = plateViewport({
    showAll: true,
    zoom: 1,
    sx: 8,
    sy: 8,
    viewW: 400,
    viewH: 300,
    hot: false,
  });
  const mid = plateViewport({
    showAll: true,
    zoom: 1,
    sx: 200,
    sy: 150,
    viewW: 400,
    viewH: 300,
    hot: false,
  });
  assert.equal(edge.draw, true);
  assert.equal(edge.alpha < mid.alpha, true);
  assert.equal(mid.alpha, 1);

  const dropped = plateViewport({
    showAll: true,
    zoom: 3,
    sx: 8,
    sy: 8,
    viewW: 400,
    viewH: 300,
    hot: false,
  });
  const neighbor = plateViewport({
    showAll: true,
    zoom: 3,
    sx: 8,
    sy: 8,
    viewW: 400,
    viewH: 300,
    hot: true,
  });
  assert.equal(dropped.draw, false);
  assert.equal(neighbor.draw, true);
  assert.equal(neighbor.alpha, 1);

  const quiet = plateViewport({
    showAll: false,
    zoom: 3,
    sx: 8,
    sy: 8,
    viewW: 400,
    viewH: 300,
    hot: false,
  });
  assert.equal(quiet.mode, "off");
  assert.equal(quiet.draw, true);
  assert.equal(quiet.alpha, 1);
});
