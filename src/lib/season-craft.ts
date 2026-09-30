/**
 * Round 8b/9 craft layered on the baked map. Motion offsets freeze when reduced.
 * Copy stays out of this module: these are pixels, not sentences.
 */

import { buildPathGrid, type CraftWeatherId, type Pixel } from "@/lib/map-craft";

export type BedSpot = { x: number; y: number; stage: number };

export function seasonBedPixels(spots: BedSpot[], seasonId: string, t: number, reduced: boolean): Pixel[] {
  const pixels: Pixel[] = [];
  const bob = reduced ? 0 : Math.floor(t) % 2;
  for (const spot of spots) {
    if (seasonId === "spring") {
      pixels.push({ x: spot.x - 2, y: spot.y - 12, w: 2, h: 2, color: "#f4b4c4" });
      if (spot.stage >= 2) pixels.push({ x: spot.x + 2, y: spot.y - 10, w: 2, h: 2, color: "#fff6d8" });
    } else if (seasonId === "summer") {
      pixels.push({ x: spot.x, y: spot.y - 13 - bob, w: 2, h: 2, color: "#ffe7a3" });
      pixels.push({ x: spot.x + 3, y: spot.y - 8, w: 2, h: 2, color: "#7dba6a" });
    } else if (seasonId === "autumn") {
      pixels.push({ x: spot.x - 1, y: spot.y - 12, w: 3, h: 3, color: "#d46a32" });
      if (spot.stage === 3) pixels.push({ x: spot.x + 3, y: spot.y - 9, w: 2, h: 2, color: "#c44b3a" });
    } else {
      pixels.push({ x: spot.x - 4, y: spot.y - 2, w: 8, h: 1, color: "rgba(255, 246, 216, 0.85)" });
      pixels.push({ x: spot.x - 1, y: spot.y - 6, w: 2, h: 2, color: "#d5e4ef" });
    }
  }
  return pixels;
}

export function weatherGround(input: {
  id: CraftWeatherId;
  cols: number;
  rows: number;
  t: number;
  reduced: boolean;
  quiet: boolean;
  tile?: number;
}): Pixel[] {
  if (input.id !== "drizzle" && input.id !== "breeze") return [];
  const grid = buildPathGrid(input.cols, input.rows);
  const tile = input.tile ?? 16;
  const shift = input.reduced || input.quiet ? 0 : Math.floor(input.t) % 4;
  const step = input.quiet ? 8 : 4;
  const pixels: Pixel[] = [];
  for (let r = 0; r < input.rows; r += 1) {
    for (let c = 0; c < input.cols; c += 1) {
      if (!grid[r]?.[c]) continue;
      if ((c + r + shift) % step !== 0) continue;
      const x = c * tile;
      const y = r * tile;
      if (input.id === "drizzle") {
        pixels.push({ x: x + 2, y: y + 5, w: 11, h: 3, color: "rgba(48, 78, 110, 0.38)" });
        pixels.push({ x: x + 4, y: y + 6, w: 4, h: 1, color: "rgba(213, 228, 239, 0.45)" });
      } else {
        pixels.push({ x: x + 1, y: y - 1, w: 7, h: 2, color: "rgba(232, 216, 150, 0.7)" });
        pixels.push({ x: x + 8, y: y, w: 3, h: 1, color: "rgba(255, 246, 216, 0.45)" });
      }
    }
  }
  return pixels;
}

export function pondFish(pond: { c0: number; r0: number; c1: number; r1: number }, t: number, reduced: boolean, tile = 16): Pixel[] {
  const fish = [
    { c: pond.c0 + 2, r: pond.r0 + 2, color: "#2a1a10" },
    { c: pond.c0 + 6, r: pond.r0 + 4, color: "#f2d15c" },
    { c: pond.c1 - 3, r: pond.r1 - 2, color: "#fff6d8" },
  ];
  return fish.flatMap((item, index) => {
    const swim = reduced ? 0 : Math.floor(t * 6 + index * 3) % 8;
    const x = item.c * tile + 3 + swim;
    const y = item.r * tile + 6;
    return [
      { x, y, w: 5, h: 2, color: item.color },
      { x: x + 5, y: y - 1, w: 2, h: 2, color: item.color },
      { x: x + 1, y, w: 1, h: 1, color: "#2a1a10" },
    ];
  });
}

export type HomeKind = "mailbox" | "line" | "compost" | "well";

export type HomeProp = { kind: HomeKind; x: number; y: number; sort: number };

export function homesteadProps(plots: { index: number; x: number; y: number; orchard: boolean }[]): HomeProp[] {
  const out: HomeProp[] = [];
  for (const plot of plots) {
    if (plot.index % 11 === 0) out.push({ kind: "mailbox", x: plot.x + 6, y: plot.y + 20, sort: plot.y + 24 });
    if (plot.index % 13 === 4) out.push({ kind: "line", x: plot.x + 88, y: plot.y + 14, sort: plot.y + 20 });
    if (plot.index % 9 === 5) out.push({ kind: "compost", x: plot.x + 84, y: plot.y + 56, sort: plot.y + 62 });
    if (plot.orchard && plot.index % 2 === 0) out.push({ kind: "well", x: plot.x + 36, y: plot.y + 22, sort: plot.y + 30 });
  }
  return out;
}

export function homesteadPixels(prop: HomeProp): Pixel[] {
  const x = prop.x;
  const y = prop.y;
  if (prop.kind === "mailbox") {
    return [
      { x: x + 3, y: y - 12, w: 2, h: 14, color: "#6a3d18" },
      { x, y: y - 14, w: 10, h: 7, color: "#c44b3a" },
      { x: x + 1, y: y - 13, w: 8, h: 3, color: "#e07060" },
      { x: x + 7, y: y - 11, w: 2, h: 2, color: "#fff6d8" },
    ];
  }
  if (prop.kind === "line") {
    return [
      { x, y: y - 14, w: 2, h: 16, color: "#6a3d18" },
      { x: x + 14, y: y - 14, w: 2, h: 16, color: "#6a3d18" },
      { x, y: y - 14, w: 16, h: 1, color: "#8a8478" },
      { x: x + 3, y: y - 13, w: 4, h: 5, color: "#3a8fbc" },
      { x: x + 9, y: y - 13, w: 4, h: 4, color: "#f4d7a1" },
    ];
  }
  if (prop.kind === "compost") {
    return [
      { x, y: y - 6, w: 14, h: 8, color: "#5a3214" },
      { x: x + 1, y: y - 8, w: 12, h: 4, color: "#3a7d4a" },
      { x: x + 3, y: y - 10, w: 4, h: 3, color: "#7dba6a" },
      { x: x + 8, y: y - 9, w: 3, h: 2, color: "#c4a060" },
    ];
  }
  return [
    { x, y: y - 8, w: 14, h: 8, color: "#8a8478" },
    { x: x + 2, y: y - 10, w: 10, h: 4, color: "#6a6a64" },
    { x: x + 4, y: y - 6, w: 6, h: 4, color: "#3a8fbc" },
    { x: x + 6, y: y - 14, w: 2, h: 6, color: "#6a3d18" },
    { x: x + 3, y: y - 14, w: 8, h: 2, color: "#8a5528" },
  ];
}

export function gateFlowers(fences: { gate: boolean; x: number; y: number }[]) {
  const spots: { sprite: string; x: number; y: number }[] = [];
  let n = 0;
  for (const fence of fences) {
    if (!fence.gate) continue;
    spots.push({ sprite: `flower_${n % 8}`, x: fence.x - 22, y: fence.y + 6 });
    spots.push({ sprite: `flower_${(n + 3) % 8}`, x: fence.x + 18, y: fence.y + 6 });
    n += 1;
  }
  return spots;
}

export function handToolPixels(tool: "hoe" | "can", x: number, y: number): Pixel[] {
  const left = Math.round(x + 8);
  const top = Math.round(y - 22);
  if (tool === "can") {
    return [
      { x: left, y: top, w: 6, h: 5, color: "#3a8fbc" },
      { x: left + 1, y: top - 2, w: 4, h: 2, color: "#d5e4ef" },
      { x: left + 5, y: top + 1, w: 3, h: 2, color: "#fff6d8" },
    ];
  }
  return [
    { x: left + 1, y: top - 2, w: 2, h: 12, color: "#6a3d18" },
    { x: left - 1, y: top - 2, w: 7, h: 3, color: "#c4a060" },
    { x: left, y: top - 1, w: 4, h: 1, color: "#fff6d8" },
  ];
}

export function seasonWindowTint(seasonId: string, faces: readonly { x: number; y: number }[]): Pixel[] {
  const color =
    seasonId === "spring"
      ? "#e7f3c8"
      : seasonId === "summer"
        ? "#ffe7a3"
        : seasonId === "autumn"
          ? "#f0c48a"
          : "#d5e4ef";
  return faces.flatMap((house) => [
    { x: house.x + 3, y: house.y + 3, w: 3, h: 2, color },
    { x: house.x + 10, y: house.y + 3, w: 3, h: 2, color },
  ]);
}

export function nightHour(hour: number) {
  return hour >= 20 || hour < 5;
}

export function nightSky(viewW: number, viewH: number, t: number, reduced: boolean): Pixel[] {
  const x = Math.max(8, viewW - 42);
  const twinkle = reduced ? 1 : Math.floor(t * 2) % 3;
  const pixels: Pixel[] = [
    { x, y: 16, w: 10, h: 10, color: "#fff6d8" },
    { x: x + 4, y: 14, w: 8, h: 8, color: "rgba(18, 32, 72, 0.72)" },
    { x: x + 2, y: 18, w: 2, h: 2, color: "#fff6d8" },
  ];
  for (let i = 0; i < 5; i += 1) {
    const sx = 24 + ((i * 67) % Math.max(1, Math.floor(viewW * 0.55)));
    const sy = 12 + ((i * 19) % Math.max(1, Math.floor(viewH * 0.22)));
    const arm = i === twinkle ? 3 : 2;
    pixels.push({ x: sx, y: sy, w: 1, h: arm, color: "#fff6d8" });
    pixels.push({ x: sx - 1, y: sy + 1, w: arm, h: 1, color: "#d5e4ef" });
  }
  return pixels;
}

export type LandmarkLook = {
  reduced: boolean;
  lantern: "off" | "still" | "pulse";
  lean: "none" | "left" | "right";
  gateOpen: boolean;
  picnic: boolean;
  pebbles: number;
  laundry: "off" | "still" | "sway";
  shutter: "off" | "still" | "swing";
  wood: number;
  bridge: boolean;
  pots: number;
  kettle: boolean;
  barrel: boolean;
  cat: boolean;
};

export const EMPTY_LANDMARK: LandmarkLook = {
  reduced: false,
  lantern: "off",
  lean: "none",
  gateOpen: false,
  picnic: false,
  pebbles: 0,
  laundry: "off",
  shutter: "off",
  wood: 1,
  bridge: false,
  pots: 0,
  kettle: false,
  barrel: false,
  cat: true,
};

export function landmarkPixels(look: LandmarkLook, t: number): Pixel[] {
  const pixels: Pixel[] = [];
  const still = look.reduced;
  const lean = look.lean === "left" ? -3 : look.lean === "right" ? 3 : 0;
  const sx = 348 + lean;
  const sy = 448;
  pixels.push(
    { x: sx + 4, y: sy - 18, w: 2, h: 16, color: "#6a3d18" },
    { x: sx, y: sy - 16, w: 10, h: 6, color: "#c4a060" },
    { x: sx + 2, y: sy - 22, w: 6, h: 5, color: "#d46a32" },
    { x: sx + 1, y: sy - 24, w: 8, h: 3, color: "#6a3d18" },
  );
  pixels.push(
    { x: 548, y: 236, w: 2, h: 16, color: "#6a3d18" },
    { x: 562, y: 236, w: 2, h: 16, color: "#6a3d18" },
    { x: 546, y: 220, w: 20, h: 14, color: "#f4d7a1" },
    { x: 548, y: 222, w: 16, h: 2, color: "#6a3d18" },
  );
  pixels.push(
    { x: 168, y: 600, w: 22, h: 14, color: "#8a5528" },
    { x: 170, y: 594, w: 18, h: 6, color: "#c44b3a" },
    { x: 176, y: 604, w: 6, h: 6, color: "#2a1a10" },
    { x: 184, y: 606, w: 3, h: 2, color: "#f2d15c" },
  );
  const pulse = !still && look.lantern === "pulse" ? Math.floor(t * 2) % 2 : 0;
  for (const lamp of [
    { x: 512, y: 150 },
    { x: 802, y: 142 },
  ]) {
    pixels.push(
      { x: lamp.x, y: lamp.y, w: 2, h: 12, color: "#6a3d18" },
      { x: lamp.x - 2, y: lamp.y - 4, w: 6, h: 4, color: "#5a3214" },
    );
    if (look.lantern !== "off") {
      pixels.push({
        x: lamp.x - 1 - pulse,
        y: lamp.y - 6 - pulse,
        w: 4 + pulse * 2,
        h: 3 + pulse,
        color: pulse ? "#fff6d8" : "#f2d15c",
      });
    }
  }
  const fold = !still && look.laundry === "sway" ? Math.floor(t * 2) % 2 : 0;
  pixels.push(
    { x: 820, y: 186, w: 2, h: 16, color: "#6a3d18" },
    { x: 848, y: 186, w: 2, h: 16, color: "#6a3d18" },
    { x: 820, y: 186, w: 30, h: 1, color: "#8a8478" },
  );
  if (look.laundry !== "off") {
    pixels.push(
      { x: 826, y: 187 + fold, w: 6, h: 7, color: "#3a8fbc" },
      { x: 836, y: 187, w: 6, h: 6, color: "#f4d7a1" },
    );
  }
  const logs = Math.max(0, Math.min(6, Math.floor(look.wood)));
  for (let i = 0; i < logs; i += 1) {
    pixels.push({
      x: 228 + (i % 3) * 5,
      y: 168 - Math.floor(i / 3) * 3,
      w: 8,
      h: 3,
      color: i % 2 ? "#8a5528" : "#6a3d18",
    });
  }
  pixels.push(
    { x: 40, y: 96, w: 36, h: 4, color: "#8a8478" },
    { x: 40, y: 102, w: 36, h: 2, color: "#6a6a64" },
  );
  if (look.bridge) pixels.push({ x: 52, y: 92, w: 8, h: 3, color: "#c4a060" });
  const blink = look.cat && !still && Math.floor(t) % 5 === 0 ? 1 : 0;
  pixels.push(
    { x: 760, y: 188, w: 8, h: 5, color: "#8a8478" },
    { x: 766, y: 186, w: 4, h: 3, color: "#6a6a64" },
    { x: 767, y: 187, w: 1, h: blink ? 1 : 2, color: "#f2d15c" },
  );
  pixels.push(
    { x: 968, y: 188, w: 10, h: 12, color: "#5a3214" },
    { x: 968, y: 192, w: 10, h: 2, color: "#8a5528" },
  );
  if (look.barrel) pixels.push({ x: 970, y: 190, w: 6, h: 2, color: "#3a8fbc" });
  pixels.push(
    { x: 392, y: 200, w: 2, h: 14, color: "#6a3d18" },
    { x: 386, y: 188, w: 14, h: 8, color: "#f4d7a1" },
    { x: 388, y: 191, w: 8, h: 1, color: "#6a3d18" },
  );
  const pots = Math.max(0, Math.min(3, Math.floor(look.pots)));
  for (let i = 0; i < pots; i += 1) {
    pixels.push(
      { x: 496 + i * 8, y: 160, w: 6, h: 4, color: "#c44b3a" },
      { x: 497 + i * 8, y: 157, w: 4, h: 3, color: "#3a7d4a" },
    );
  }
  if (look.shutter !== "off") {
    const swing = !still && look.shutter === "swing" ? Math.floor(t * 2) % 2 : 0;
    pixels.push(
      { x: 786 - swing, y: 152, w: 3, h: 8, color: "#c4a060" },
      { x: 802 + swing, y: 152, w: 3, h: 8, color: "#8a5528" },
    );
  }
  if (look.gateOpen) pixels.push({ x: 300, y: 360, w: 8, h: 2, color: "#7dba6a" });
  if (look.picnic) {
    pixels.push(
      { x: 700, y: 760, w: 18, h: 10, color: "#c44b3a" },
      { x: 704, y: 756, w: 6, h: 4, color: "#f4d7a1" },
    );
  }
  const pebbles = Math.max(0, Math.min(5, Math.floor(look.pebbles)));
  for (let i = 0; i < pebbles; i += 1) {
    pixels.push({ x: 180 + i * 22, y: 214, w: 3, h: 2, color: "#d7c4a4" });
  }
  if (look.kettle) {
    const puff = still ? 0 : Math.floor(t) % 2;
    pixels.push(
      { x: 1044, y: 908, w: 8, h: 6, color: "#8a8478" },
      { x: 1046, y: 904 - puff, w: 2, h: 2, color: "#d5e4ef" },
    );
  }
  return pixels;
}

export function yardDetailPixels(input: {
  hen: boolean;
  laundry: boolean;
  pepper: boolean;
  grain: number;
  stove: boolean;
  bowl: boolean;
  shutters: boolean;
  bell: number;
  sway: boolean;
  t: number;
}): Pixel[] {
  const peck = input.sway ? Math.floor(input.t * 4) % 2 : 0;
  const ember = input.sway ? Math.floor(input.t * 3) % 2 : 0;
  const pixels: Pixel[] = [];
  if (input.hen) {
    pixels.push({ x: 116, y: 600 + peck, w: 4, h: 2, color: "#f2d15c" });
    pixels.push({ x: 120, y: 601 + peck, w: 2, h: 1, color: "#c44b3a" });
  }
  if (input.laundry) {
    pixels.push({ x: 508, y: 198, w: 6, h: 1, color: "#fff6d8" });
    pixels.push({ x: 520, y: 197, w: 6, h: 1, color: "#d5e4ef" });
  }
  if (input.pepper) {
    pixels.push({ x: 507, y: 158, w: 2, h: 2, color: "#7dba6a" });
    pixels.push({ x: 513, y: 160, w: 2, h: 2, color: "#6a3d18" });
  }
  for (let i = 0; i < input.grain; i += 1) {
    pixels.push({ x: 390 + i * 6, y: 544, w: 2, h: 2, color: "#fff6d8" });
  }
  if (input.stove) {
    pixels.push({ x: 1076, y: 948 - ember, w: 2, h: 2, color: ember ? "#fff6d8" : "#d46a32" });
  }
  if (input.bowl) {
    pixels.push({ x: 649, y: 991, w: 6, h: 1, color: "#efe6d6" });
  }
  if (input.shutters) {
    pixels.push({ x: 790, y: 160, w: 2, h: 2, color: "#c4a060" });
    pixels.push({ x: 806, y: 160, w: 2, h: 2, color: "#c4a060" });
  }
  if (input.bell > 0) {
    const swing = input.sway ? Math.floor(input.t * 3) % 2 : 0;
    pixels.push({ x: 86 + swing, y: 192, w: 2, h: 2, color: "#fff6d8" });
  }
  return pixels;
}

export function seasonMark(seasonId: string, viewW: number, viewH: number): Pixel[] {
  const x = Math.max(0, viewW - 26);
  const y = Math.max(0, viewH - 26);
  const frame = { x, y, w: 16, h: 16, color: "rgba(42, 24, 10, 0.72)" };
  const paper = { x: x + 2, y: y + 2, w: 12, h: 12, color: "#fff6d8" };
  if (seasonId === "spring") {
    return [
      frame,
      paper,
      { x: x + 4, y: y + 5, w: 3, h: 3, color: "#f4b4c4" },
      { x: x + 9, y: y + 8, w: 3, h: 3, color: "#fff6d8" },
      { x: x + 7, y: y + 6, w: 2, h: 4, color: "#3a7d4a" },
    ];
  }
  if (seasonId === "summer") {
    return [
      frame,
      paper,
      { x: x + 6, y: y + 4, w: 4, h: 4, color: "#f2d15c" },
      { x: x + 7, y: y + 9, w: 2, h: 3, color: "#d46a32" },
    ];
  }
  if (seasonId === "autumn") {
    return [
      frame,
      paper,
      { x: x + 5, y: y + 5, w: 6, h: 4, color: "#d46a32" },
      { x: x + 7, y: y + 4, w: 2, h: 2, color: "#6a3d18" },
    ];
  }
  return [
    frame,
    paper,
    { x: x + 5, y: y + 4, w: 2, h: 2, color: "#d5e4ef" },
    { x: x + 9, y: y + 7, w: 2, h: 2, color: "#fff6d8" },
    { x: x + 6, y: y + 9, w: 3, h: 2, color: "#d5e4ef" },
  ];
}
