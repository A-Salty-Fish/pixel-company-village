/**
 * Baked and per-frame village craft. Pure layout so the canvas painter and the
 * unit tests share one map. Nameplate LOD stays in `showNameplate` — far zoom
 * still hides cold plates. No chat text, no audio.
 */

export type Pixel = { x: number; y: number; w: number; h: number; color: string };

export type Grid = boolean[][];

export type Pond = { c0: number; r0: number; c1: number; r1: number };

export type PlotRef = {
  index: number;
  x: number;
  y: number;
  col: number;
  orchard: boolean;
  cropRow: number;
  cropSide: number;
};

export const WEATHER_NOTES = {
  clear: "日照在田上",
  cloud: "云压着屋檐",
  drizzle: "细雨只湿小路",
  breeze: "风从湖边来",
} as const;

export type CraftWeatherId = keyof typeof WEATHER_NOTES;

export const HOUSE_FACES = [
  { x: 500, y: 168, face: 0 },
  { x: 790, y: 156, face: 1 },
  { x: 1070, y: 940, face: 2 },
  { x: 220, y: 150, face: 3 },
  { x: 640, y: 980, face: 4 },
] as const;

export const RIDGE = [
  { sprite: "cliff_3", x: 280, y: 40 },
  { sprite: "cliff_4", x: 360, y: 36 },
  { sprite: "cliff_5", x: 640, y: 44 },
  { sprite: "cliff_6", x: 760, y: 40 },
  { sprite: "cliff_7", x: 1080, y: 48 },
] as const;

const CHIMNEYS = [
  { x: 508, y: 96 },
  { x: 792, y: 88 },
  { x: 1076, y: 908 },
] as const;

export function buildPathGrid(cols: number, rows: number): Grid {
  const path = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const fill = (c0: number, r0: number, c1: number, r1: number) => {
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        if (r >= 0 && c >= 0 && r < rows && c < cols) path[r][c] = true;
      }
    }
  };
  fill(0, 13, cols - 1, 14);
  fill(37, 13, 38, rows - 2);
  fill(2, 40, cols - 3, 41);
  return path;
}

export function pathMarks(grid: Grid, tile = 16): Pixel[] {
  const marks: Pixel[] = [];
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r];
    for (let c = 0; c < row.length; c += 1) {
      if (!row[c]) continue;
      const left = c * tile;
      const top = r * tile;
      const horizontal = Boolean(grid[r]?.[c - 1] && grid[r]?.[c + 1]);
      const vertical = Boolean(grid[r - 1]?.[c] && grid[r + 1]?.[c]);
      if (horizontal) {
        marks.push({ x: left + 3, y: top + 7, w: 10, h: 2, color: "#c4a060" });
        marks.push({ x: left + 5, y: top + 6, w: 4, h: 1, color: "#efe0c0" });
      } else if (vertical) {
        marks.push({ x: left + 7, y: top + 2, w: 2, h: 12, color: "#c4a060" });
      }
      if (horizontal && vertical) {
        marks.push({ x: left + 4, y: top + 6, w: 8, h: 5, color: "#d7c4a4" });
        marks.push({ x: left + 6, y: top + 7, w: 3, h: 2, color: "#efe6d6" });
      }
      if ((c + r) % 3 === 0) {
        marks.push({ x: left + 1, y: top + 1, w: 3, h: 2, color: "#efe0c0" });
        marks.push({ x: left + 12, y: top + 12, w: 2, h: 2, color: "#8a6a40" });
      }
      if ((c + r) % 4 === 0 && !grid[r + 1]?.[c]) {
        marks.push({ x: left + 2, y: top + 13, w: 6, h: 2, color: "#3a7d4a" });
      }
      if (c % 5 === 0) {
        marks.push({ x: left, y: top + 14, w: tile, h: 1, color: "rgba(42, 24, 10, 0.35)" });
      }
    }
  }
  return marks;
}

export type FencePlacement = {
  sprite: "fence_0" | "fence_1";
  x: number;
  y: number;
  gate: boolean;
  posts: { x: number; y: number }[];
};

export function yardFences(plots: PlotRef[]): FencePlacement[] {
  const fences: FencePlacement[] = [];
  for (const plot of plots) {
    if (plot.index % 2 !== 0 && !plot.orchard) continue;
    const gate = plot.orchard || plot.index % 8 === 0;
    const x = plot.x + 56;
    const y = plot.y + (plot.orchard ? 30 : 36);
    fences.push({
      sprite: plot.index % 4 === 0 ? "fence_0" : "fence_1",
      x,
      y,
      gate,
      posts: [
        { x: x - 34, y: y - 14 },
        { x: x + 30, y: y - 14 },
      ],
    });
  }
  return fences;
}

export function fencePosts(fences: FencePlacement[]): Pixel[] {
  const pixels: Pixel[] = [];
  for (const fence of fences) {
    for (const post of fence.posts) {
      pixels.push({ x: post.x, y: post.y, w: 3, h: 14, color: "#6a3d18" });
      pixels.push({ x: post.x - 1, y: post.y, w: 5, h: 3, color: "#8a5528" });
      pixels.push({ x: post.x, y: post.y + 12, w: 3, h: 2, color: "#2a1a10" });
    }
    if (fence.gate) {
      pixels.push({ x: fence.x - 8, y: fence.y - 6, w: 16, h: 2, color: "#c4a060" });
      continue;
    }
    pixels.push({ x: fence.x - 32, y: fence.y - 10, w: 64, h: 2, color: "#c4a060" });
    pixels.push({ x: fence.x - 32, y: fence.y - 6, w: 64, h: 2, color: "#8a5528" });
  }
  return pixels;
}

export function soilTiles(plot: PlotRef, tile = 16) {
  const tiles: { name: "soil_edge" | "soil_wet" | "soil_dry"; x: number; y: number }[] = [];
  for (let ty = 0; ty < 3; ty += 1) {
    for (let tx = 0; tx < 4; tx += 1) {
      const edge = tx === 0 || ty === 0 || tx === 3 || ty === 2;
      const wet = ((plot.index + tx + ty) & 1) === 0;
      tiles.push({
        name: edge ? "soil_edge" : wet ? "soil_wet" : "soil_dry",
        x: plot.x + 24 + tx * tile,
        y: plot.y + 26 + ty * tile,
      });
    }
  }
  return tiles;
}

export function fieldWash(plot: PlotRef): Pixel {
  return {
    x: plot.x + 20,
    y: plot.y + 24,
    w: 76,
    h: 50,
    color: plot.col < 5 ? "rgba(70, 110, 50, 0.16)" : "rgba(150, 96, 40, 0.14)",
  };
}

export type CropSpot = {
  sprite: string;
  x: number;
  y: number;
  stage: number;
  furrow: boolean;
};

export function bedCrops(plot: PlotRef): CropSpot[] {
  if (plot.orchard) return [];
  const spots: CropSpot[] = [];
  for (let ry = 0; ry < 3; ry += 1) {
    for (let rx = 0; rx < 4; rx += 1) {
      if ((plot.cropRow + rx * 2 + ry) % 5 === 0) continue;
      const stage = (plot.cropSide + rx + ry * 2) % 4;
      const row = ((plot.cropRow % 10) + 10) % 10;
      const side = plot.cropSide & 1;
      spots.push({
        sprite: `crop_${row}_${side}_${stage}`,
        x: plot.x + 34 + rx * 16,
        y: plot.y + 42 + ry * 12,
        stage,
        furrow: rx === 0,
      });
    }
  }
  return spots;
}

export function cropAccents(spots: CropSpot[]): Pixel[] {
  const pixels: Pixel[] = [];
  for (const spot of spots) {
    if (spot.furrow) {
      pixels.push({ x: spot.x - 10, y: spot.y - 1, w: 8, h: 1, color: "rgba(90, 50, 20, 0.55)" });
    }
    if (spot.stage === 0) {
      pixels.push({ x: spot.x - 1, y: spot.y - 8, w: 2, h: 3, color: "#7dba6a" });
    } else if (spot.stage === 1) {
      pixels.push({ x: spot.x - 2, y: spot.y - 10, w: 4, h: 2, color: "#3a7d4a" });
    } else if (spot.stage === 2) {
      pixels.push({ x: spot.x - 3, y: spot.y - 11, w: 2, h: 2, color: "#f2d15c" });
      pixels.push({ x: spot.x + 2, y: spot.y - 9, w: 2, h: 2, color: "#7dba6a" });
    } else {
      pixels.push({ x: spot.x - 3, y: spot.y - 12, w: 3, h: 3, color: "#c44b3a" });
      pixels.push({ x: spot.x + 2, y: spot.y - 9, w: 2, h: 2, color: "#d46a32" });
    }
  }
  return pixels;
}

export type PropSeed = {
  kind: "sprite" | "scarecrow" | "crate" | "can" | "hay" | "hoe" | "lantern";
  sprite?: string;
  x: number;
  y: number;
  sort: number;
};

export function yardProps(plots: PlotRef[]): PropSeed[] {
  const out: PropSeed[] = [];
  const kinds = ["scarecrow", "crate", "can", "hay", "hoe"] as const;
  for (const plot of plots) {
    if (plot.index % 4 === 3) {
      out.push({
        kind: "sprite",
        sprite: `farm_${plot.index % 8}`,
        x: plot.x - 4,
        y: plot.y + 26,
        sort: plot.y + 26,
      });
    }
    if (plot.index % 4 === 1) {
      out.push({
        kind: "sprite",
        sprite: `bush_${plot.index % 6}`,
        x: plot.x + 98,
        y: plot.y + 66,
        sort: plot.y + 66,
      });
    }
    if (plot.index % 5 === 2) {
      out.push({
        kind: kinds[Math.floor(plot.index / 5) % kinds.length],
        x: plot.x + 8,
        y: plot.y + 46,
        sort: plot.y + 52,
      });
    }
    if (plot.orchard) {
      out.push({ kind: "crate", x: plot.x + 18, y: plot.y + 62, sort: plot.y + 68 });
    }
  }
  out.push({ kind: "lantern", x: 37 * 16 + 4, y: 13 * 16 - 4, sort: 13 * 16 });
  out.push({ kind: "lantern", x: 2 * 16, y: 40 * 16 - 4, sort: 40 * 16 });
  out.push({ kind: "lantern", x: 70 * 16, y: 14 * 16 - 4, sort: 14 * 16 });
  return out;
}

export function propPixels(prop: PropSeed, lit: boolean): Pixel[] {
  const x = prop.x;
  const y = prop.y;
  if (prop.kind === "scarecrow") {
    return [
      { x: x + 4, y: y - 16, w: 2, h: 18, color: "#6a3d18" },
      { x: x - 4, y: y - 8, w: 16, h: 2, color: "#8a5528" },
      { x: x + 1, y: y - 20, w: 8, h: 5, color: "#c44b3a" },
      { x: x + 2, y: y - 16, w: 6, h: 4, color: "#f4d7a1" },
      { x: x + 3, y: y - 15, w: 1, h: 1, color: "#2a1a10" },
      { x: x + 6, y: y - 15, w: 1, h: 1, color: "#2a1a10" },
      { x: x - 2, y: y - 6, w: 3, h: 3, color: "#efe6d6" },
      { x: x + 9, y: y - 6, w: 3, h: 3, color: "#efe6d6" },
    ];
  }
  if (prop.kind === "crate") {
    return [
      { x, y: y - 8, w: 12, h: 10, color: "#6a3d18" },
      { x: x + 1, y: y - 7, w: 10, h: 4, color: "#c4a060" },
      { x: x + 1, y: y - 2, w: 10, h: 3, color: "#8a5528" },
      { x: x + 5, y: y - 7, w: 1, h: 8, color: "#5a3214" },
    ];
  }
  if (prop.kind === "can") {
    return [
      { x: x + 2, y: y - 8, w: 8, h: 7, color: "#3a8fbc" },
      { x: x + 3, y: y - 10, w: 6, h: 3, color: "#7ec8e0" },
      { x: x + 9, y: y - 6, w: 4, h: 2, color: "#d5e4ef" },
      { x: x + 4, y: y - 7, w: 3, h: 2, color: "#fff6d8" },
    ];
  }
  if (prop.kind === "hay") {
    return [
      { x, y: y - 6, w: 14, h: 6, color: "#e0a050" },
      { x: x + 1, y: y - 10, w: 12, h: 5, color: "#f2d15c" },
      { x: x + 3, y: y - 13, w: 8, h: 4, color: "#ffe7a3" },
      { x: x + 2, y: y - 8, w: 10, h: 1, color: "#8a5528" },
    ];
  }
  if (prop.kind === "hoe") {
    return [
      { x: x + 2, y: y - 16, w: 2, h: 16, color: "#6a3d18" },
      { x: x - 1, y: y - 16, w: 8, h: 3, color: "#8a8478" },
      { x: x + 1, y: y - 14, w: 4, h: 2, color: "#c4a060" },
    ];
  }
  if (prop.kind === "lantern") {
    const glow = lit ? "#fff6d8" : "#8a6a40";
    const body = lit ? "#f2d15c" : "#6a3d18";
    return [
      { x: x + 3, y: y - 14, w: 2, h: 14, color: "#5a3214" },
      { x: x, y: y - 16, w: 8, h: 6, color: body },
      { x: x + 2, y: y - 14, w: 4, h: 3, color: glow },
      { x: x + 1, y: y - 4, w: 6, h: 2, color: lit ? "rgba(242, 209, 92, 0.45)" : "#3a2a18" },
    ];
  }
  return [];
}

export function grassTufts(cols: number, rows: number, grid: Grid, pond: Pond, plots: PlotRef[], tile = 16): Pixel[] {
  const pixels: Pixel[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((((c * 13) ^ (r * 7)) >>> 0) % 11 !== 0) continue;
      if (grid[r]?.[c]) continue;
      if (c >= pond.c0 && c <= pond.c1 && r >= pond.r0 && r <= pond.r1) continue;
      const x = c * tile + 4;
      const y = r * tile + 10;
      let blocked = false;
      for (const plot of plots) {
        if (x > plot.x + 8 && x < plot.x + 108 && y > plot.y + 12 && y < plot.y + 82) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      const dark = (c + r) % 2 === 0;
      pixels.push({ x, y, w: 3, h: 2, color: dark ? "#2f5a28" : "#8fbf6a" });
      pixels.push({ x: x + 1, y: y - 2, w: 1, h: 2, color: dark ? "#3a7d4a" : "#e7f3c8" });
    }
  }
  return pixels;
}

export function pondLife(pond: Pond, t: number, reduced: boolean, tile = 16): Pixel[] {
  const pixels: Pixel[] = [];
  for (let c = pond.c0; c <= pond.c1; c += 2) {
    const x = c * tile + 4;
    const y = (pond.r0 - 1) * tile + 6;
    pixels.push({ x, y, w: 2, h: 9, color: "#2f6a3a" });
    pixels.push({ x: x - 3, y: y + 3, w: 2, h: 6, color: "#3a7d4a" });
    pixels.push({ x: x + 1, y: y, w: 3, h: 2, color: "#7dba6a" });
  }
  for (let c = pond.c0; c <= pond.c1; c += 1) {
    if (c % 2 !== 0) continue;
    pixels.push({ x: c * tile + 5, y: (pond.r1 + 1) * tile + 3, w: 3, h: 2, color: "#efe0c0" });
    pixels.push({ x: c * tile + 9, y: (pond.r1 + 1) * tile + 6, w: 2, h: 2, color: "#8a6a40" });
  }
  const pads = [
    { c: pond.c0 + 1, r: pond.r0 + 1 },
    { c: pond.c1 - 2, r: pond.r0 + 2 },
    { c: pond.c0 + 4, r: pond.r1 - 1 },
  ];
  for (const pad of pads) {
    pixels.push({ x: pad.c * tile + 2, y: pad.r * tile + 4, w: 9, h: 5, color: "#2f6a3a" });
    pixels.push({ x: pad.c * tile + 3, y: pad.r * tile + 5, w: 6, h: 3, color: "#7dba6a" });
    pixels.push({ x: pad.c * tile + 5, y: pad.r * tile + 6, w: 2, h: 2, color: "#f4b4c4" });
  }
  const bob = reduced ? 0 : Math.floor(t) % 5;
  pixels.push({
    x: (pond.c0 + 3) * tile + 2,
    y: (pond.r0 + 3) * tile + bob,
    w: 7,
    h: 1,
    color: "rgba(255, 246, 216, 0.75)",
  });
  return pixels;
}

export function porchWindows(
  dusk: boolean,
  porch: boolean,
  reduced: boolean,
  t: number,
  faces: readonly { x: number; y: number }[] = HOUSE_FACES,
): Pixel[] {
  if (!dusk && !porch) return [];
  const flicker = !reduced && Math.floor(t * 2) % 5 === 0;
  const glow = dusk ? "#f2d15c" : "#e7c86a";
  const core = flicker ? "#fff6d8" : "#ffe7a3";
  const pixels: Pixel[] = [];
  for (const house of faces) {
    pixels.push({ x: house.x, y: house.y, w: 16, h: 12, color: "#2a1a10" });
    pixels.push({ x: house.x + 2, y: house.y + 2, w: 5, h: 7, color: glow });
    pixels.push({ x: house.x + 9, y: house.y + 2, w: 5, h: 7, color: glow });
    pixels.push({ x: house.x + 3, y: house.y + 3, w: 3, h: 2, color: core });
    pixels.push({ x: house.x + 10, y: house.y + 3, w: 3, h: 2, color: core });
    pixels.push({ x: house.x + 7, y: house.y + 2, w: 2, h: 7, color: "#2a1a10" });
    pixels.push({ x: house.x + 2, y: house.y + 5, w: 5, h: 1, color: "#6a3d18" });
    pixels.push({ x: house.x + 9, y: house.y + 5, w: 5, h: 1, color: "#6a3d18" });
    pixels.push({ x: house.x - 1, y: house.y + 12, w: 18, h: 2, color: "#6a3d18" });
    pixels.push({ x: house.x - 2, y: house.y + 18, w: 20, h: 3, color: "rgba(242, 209, 92, 0.38)" });
    if (porch) {
      pixels.push({ x: house.x - 8, y: house.y + 2, w: 3, h: 12, color: "#5a3214" });
      pixels.push({ x: house.x - 11, y: house.y, w: 8, h: 5, color: "#f2d15c" });
      pixels.push({ x: house.x - 9, y: house.y + 1, w: 4, h: 2, color: core });
    }
  }
  return pixels;
}

export function smokePuffs(t: number, still: boolean): Pixel[] {
  const pixels: Pixel[] = [];
  for (let i = 0; i < CHIMNEYS.length; i += 1) {
    const chimney = CHIMNEYS[i];
    const rise = still ? i : Math.floor(t * 2 + i) % 6;
    pixels.push({ x: chimney.x, y: chimney.y - rise * 2, w: 4, h: 3, color: "rgba(255, 246, 216, 0.55)" });
    pixels.push({ x: chimney.x + 3, y: chimney.y - 5 - rise * 2, w: 3, h: 2, color: "rgba(239, 224, 192, 0.4)" });
    pixels.push({ x: chimney.x + 1, y: chimney.y - 8 - rise, w: 2, h: 2, color: "rgba(213, 228, 239, 0.35)" });
  }
  return pixels;
}

export function seasonWash(seasonId: string, viewW: number, viewH: number): Pixel[] {
  const horizon =
    seasonId === "spring"
      ? "rgba(186, 220, 140, 0.28)"
      : seasonId === "summer"
        ? "rgba(255, 210, 110, 0.24)"
        : seasonId === "autumn"
          ? "rgba(214, 132, 64, 0.26)"
          : "rgba(186, 214, 230, 0.32)";
  const hem = seasonId === "winter" ? "rgba(90, 120, 150, 0.18)" : "rgba(42, 24, 10, 0.12)";
  const band = Math.max(8, Math.round(viewH * 0.07));
  return [
    { x: 0, y: 0, w: viewW, h: band, color: horizon },
    { x: 0, y: Math.max(0, viewH - 12), w: viewW, h: 12, color: hem },
    { x: 0, y: 0, w: 18, h: 28, color: horizon },
    { x: Math.max(0, viewW - 18), y: 0, w: 18, h: 28, color: horizon },
  ];
}

export function weatherMotes(input: {
  id: CraftWeatherId;
  viewW: number;
  viewH: number;
  t: number;
  reduced: boolean;
  quiet: boolean;
}): Pixel[] {
  const drift = !input.reduced && !input.quiet;
  const count = input.quiet ? 6 : input.id === "clear" ? 5 : 16;
  const width = Math.max(1, input.viewW - 8);
  const height = Math.max(1, input.viewH - 8);
  const motes: Pixel[] = [];
  for (let i = 0; i < count; i += 1) {
    const baseX = ((i * 97) % width) + 4;
    const baseY = ((i * 53) % height) + 4;
    if (input.id === "clear") {
      motes.push({ x: 10 + (i % 4) * 7, y: 8 + i * 3, w: 2, h: 2, color: "rgba(255, 246, 216, 0.85)" });
      continue;
    }
    if (input.id === "drizzle") {
      const y = drift ? Math.floor(input.t * 18 + i * 11) % height : baseY;
      motes.push({ x: baseX, y, w: 1, h: 5, color: "rgba(213, 228, 239, 0.9)" });
      continue;
    }
    if (input.id === "breeze") {
      const x = drift ? Math.floor(input.t * 14 + i * 9) % width : baseX;
      motes.push({ x, y: baseY, w: 5, h: 1, color: "rgba(239, 230, 214, 0.75)" });
      continue;
    }
    motes.push({
      x: baseX,
      y: 8 + (i % 5) * 4,
      w: 22,
      h: 3,
      color: i % 2 ? "rgba(255, 246, 216, 0.16)" : "rgba(180, 196, 210, 0.2)",
    });
  }
  return motes;
}

export function ambientMotes(input: {
  seasonId: string;
  viewW: number;
  viewH: number;
  t: number;
  reduced: boolean;
  quiet: boolean;
}): Pixel[] {
  if (input.quiet) return [];
  const color =
    input.seasonId === "autumn"
      ? "#d46a32"
      : input.seasonId === "winter"
        ? "#fff6d8"
        : input.seasonId === "spring"
          ? "#f4b4c4"
          : "#e7c86a";
  const width = Math.max(1, input.viewW - 8);
  const height = Math.max(1, input.viewH - 8);
  const drift = !input.reduced;
  const motes: Pixel[] = [];
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 73) % width) + (drift ? Math.floor(Math.sin(input.t * 0.4 + i) * 6) : 0);
    const y = ((i * 41) % height) + 4;
    motes.push({ x, y, w: 2, h: 2, color });
  }
  return motes;
}

/** Far zoom still hides cold nameplates. Hot, pinned, and show-all stay. */
export function showNameplate(zoom: number, hot: boolean, showAll: boolean) {
  if (zoom < 2 && !hot && !showAll) return false;
  return true;
}

export function plateAlpha(mode: "hot" | "scored" | "muted", zoom: number) {
  if (mode === "hot") return 1;
  if (zoom < 2) return mode === "muted" ? 0.88 : 1;
  return mode === "muted" ? 0.7 : 0.92;
}

export function distanceSilhouette(zoom: number, scored: boolean) {
  const far = zoom < 2;
  return {
    far,
    body: { x: far ? -9 : -8, y: far ? -30 : -20, w: far ? 18 : 16, h: far ? 28 : 16 },
    shadow: { x: far ? -10 : -8, y: -1, w: far ? 20 : 16, h: far ? 4 : 3, color: "rgba(24, 36, 16, 0.45)" },
    cap: far ? { x: -12, y: -32, w: 24, h: 2, color: "rgba(20, 12, 8, 0.92)" } : null,
    side: far ? { x: -12, y: -30, w: 2, h: 24, color: "rgba(20, 12, 8, 0.88)" } : null,
    pip: far
      ? { x: -2, y: -36, w: 4, h: 3, color: scored ? "#f2d15c" : "#8a8478" }
      : null,
    dot: far ? 4 : 3,
  };
}
