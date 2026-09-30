import type { VillageFx } from "@/lib/interactions";
import {
  RIDGE,
  ambientMotes,
  bedCrops,
  buildPathGrid,
  cropAccents,
  distanceSilhouette,
  fencePosts,
  fieldWash,
  grassTufts,
  pathMarks,
  plateAlpha,
  pondLife,
  porchWindows,
  propPixels,
  seasonWash,
  showNameplate,
  smokePuffs,
  soilTiles,
  weatherMotes,
  yardFences,
  yardProps,
  type Pixel,
  type PlotRef,
  type PropSeed,
} from "@/lib/map-craft";
import { blitLabel, getLabelSprite, type LabelMode } from "@/lib/pixel-label";
import { VILLAGE_CAPACITY } from "@/lib/capacity";
import { FLOWER_MARK_CAP, GATHER_SPOTS, GLYPH_BUDGET, PARTICLE_BUDGET, VIEWPOINTS } from "@/lib/play-systems";
import { artReady, drawSprite, spriteFrame, type SpriteFrame } from "@/lib/sprites";
import type { PersonWithState } from "@/lib/types";
import { availabilityFor, glyphFor, ringClosure, shanghaiClock, type SceneLife } from "@/lib/village-life";

export const WORLD_W = 1216;
export const WORLD_H = 1120;
export const VILLAGER_DRAW = 1;
export const DEFAULT_ZOOM = 1;

const TILE = 16;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;
const PITCH_X = 112;
const PITCH_Y = 80;
const ORIGIN_X = 32;
const ORIGIN_Y = 240;

export type Facing = "down" | "left" | "right" | "up";
export type NpcBase = "wilds";

export type Identity = {
  base: NpcBase;
  palette: number;
  tool: "hoe" | "can";
};

export type PlacedVillager = PersonWithState & {
  id: number;
  homeX: number;
  homeY: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  dir: Facing;
  identity: Identity;
  wanderPhase: number;
  orchard: boolean;
};

const BASES: NpcBase[] = ["wilds"];
export const CAT_COLORS = ["brown", "dbeige", "dgrey", "lbeige", "lgrey", "orange", "yellow"] as const;
const FLOWERS = ["flower_0", "flower_1", "flower_2", "flower_3", "flower_4", "flower_5", "flower_6", "flower_7"];
const TREES = ["tree_0", "tree_1", "tree_2", "tree_3", "tree_4", "tree_5", "tree_6", "tree_7", "tree_8", "tree_9"];
const GRASS = Array.from({ length: 12 }, (_, i) => `grass_${i}`);
const ANIM_FRAMES = { idle: 7, walk: 8, chop: 8, dig: 8, water: 4, sit: 8, hold: 7 } as const;
type CatAnim = keyof typeof ANIM_FRAMES;

type Plot = { x: number; y: number; col: number; row: number; orchard: boolean; cropRow: number; cropSide: number };

let groundCanvas: HTMLCanvasElement | null = null;
let worldCanvas: HTMLCanvasElement | null = null;
const propList: { name: string; x: number; y: number; sort: number }[] = [];
let pixelProps: PropSeed[] = [];
const POND = { c0: 2, r0: 2, c1: 13, r1: 7 };

function paintPixels(ctx: CanvasRenderingContext2D, pixels: Pixel[]) {
  for (const pixel of pixels) {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x, pixel.y, pixel.w, pixel.h);
  }
}

export function hashName(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function identityFor(name: string): Identity {
  const h = hashName(name);
  return {
    base: BASES[h % BASES.length],
    palette: h % CAT_COLORS.length,
    tool: (h >>> 9) & 1 ? "hoe" : "can",
  };
}

function plotAt(index: number): Plot {
  const col = index % 10;
  const row = Math.floor(index / 10) % 10;
  const h = (index * 2654435761) >>> 0;
  return {
    x: ORIGIN_X + col * PITCH_X + (col >= 5 ? 32 : 0),
    y: ORIGIN_Y + row * PITCH_Y + (row >= 5 ? 32 : 0),
    col,
    row,
    orchard: h % 7 === 2,
    cropRow: h % 10,
    cropSide: (h >>> 4) & 1,
  };
}

export function placeVillagers(people: PersonWithState[]): PlacedVillager[] {
  return people.map((person, id) => {
    const plot = plotAt(person.plot ?? id);
    const baseX = plot.x + 64;
    const baseY = plot.y + 58;
    return {
      ...person,
      id,
      plot: person.plot ?? id,
      homeX: plot.x,
      homeY: plot.y,
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      dir: "down",
      identity: identityFor(person.name),
      wanderPhase: (hashName(person.name) % 628) / 100,
      orchard: plot.orchard,
    };
  });
}

function fishingSpot(plot: number) {
  return { x: 56 + (plot % 8) * 20, y: 150 };
}

export function updateVillager(person: PlacedVillager, t: number) {
  if (person.scored && person.state === "wander") {
    const path = [
      [48, 216],
      [1168, 216],
      [1168, 1064],
      [48, 1064],
    ];
    const u = (t * 0.08 * person.speed + person.wanderPhase) % 1;
    const seg = Math.min(3, Math.floor(u * 4));
    const local = u * 4 - seg;
    const a = path[seg];
    const b = path[(seg + 1) % 4];
    person.x = a[0] + (b[0] - a[0]) * local;
    person.y = a[1] + (b[1] - a[1]) * local;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    person.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "down" : "up";
    return;
  }
  if (person.scored && person.state === "fishing") {
    const spot = fishingSpot(person.plot);
    person.x = spot.x;
    person.y = spot.y;
    person.dir = "up";
    return;
  }
  if (person.scored && person.state === "slacking") {
    person.x = person.baseX + 22;
    person.y = person.baseY + Math.sin(t * 0.8 + person.wanderPhase) * 0.6;
    person.dir = "down";
    return;
  }
  const bob = Math.sin(t * 1.4 + person.wanderPhase) * 0.8;
  person.x = person.baseX;
  person.y = person.baseY + bob;
  const facings: Facing[] = ["down", "left", "right", "up"];
  person.dir = facings[hashName(person.name) % facings.length];
}

function tileIndex(x: number, y: number) {
  return ((x * 13) ^ (y * 7)) >>> 0;
}

function blitTopLeft(ctx: CanvasRenderingContext2D, name: string, x: number, y: number) {
  const frame: SpriteFrame | undefined = spriteFrame(name);
  if (!frame) return;
  drawSprite(ctx, name, x + frame.ax, y + frame.ay);
}

function ensureGround() {
  if (groundCanvas || !artReady()) return;
  groundCanvas = document.createElement("canvas");
  groundCanvas.width = WORLD_W;
  groundCanvas.height = WORLD_H;
  const ctx = groundCanvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const path = buildPathGrid(COLS, ROWS);
  const block = (c: number, r: number) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
  const pond = POND;

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const nearPond =
        c >= pond.c0 - 1 && c <= pond.c1 + 1 && r >= pond.r0 - 1 && r <= pond.r1 + 1 && !(c >= pond.c0 && c <= pond.c1 && r >= pond.r0 && r <= pond.r1);
      const groundName = nearPond ? "sand" : GRASS[tileIndex(c, r) % GRASS.length];
      blitTopLeft(ctx, groundName, c * TILE, r * TILE);
    }
  }

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!path[r][c]) continue;
      blitTopLeft(ctx, `path_${tileIndex(c, r) % 8}`, c * TILE, r * TILE);
    }
  }
  ctx.fillStyle = "rgba(42, 24, 10, 0.82)";
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!path[r][c]) continue;
      const edge = (dc: number, dr: number) => !block(c + dc, r + dr) || !path[r + dr]?.[c + dc];
      if (edge(0, -1)) ctx.fillRect(c * TILE, r * TILE, TILE, 3);
      if (edge(0, 1)) ctx.fillRect(c * TILE, r * TILE + TILE - 3, TILE, 3);
      if (edge(-1, 0)) ctx.fillRect(c * TILE, r * TILE, 3, TILE);
      if (edge(1, 0)) ctx.fillRect(c * TILE + TILE - 3, r * TILE, 3, TILE);
      ctx.fillStyle = "rgba(42, 24, 10, 0.82)";
    }
  }
  paintPixels(ctx, pathMarks(path));

  const plots: PlotRef[] = [];
  for (let index = 0; index < VILLAGE_CAPACITY; index += 1) {
    const plot = plotAt(index);
    const ref: PlotRef = { ...plot, index };
    plots.push(ref);
    for (const tile of soilTiles(ref)) blitTopLeft(ctx, tile.name, tile.x, tile.y);
    const wash = fieldWash(ref);
    ctx.fillStyle = wash.color;
    ctx.fillRect(wash.x, wash.y, wash.w, wash.h);
    const crops = bedCrops(ref);
    for (const crop of crops) drawSprite(ctx, crop.sprite, crop.x, crop.y);
    paintPixels(ctx, cropAccents(crops));
  }
  const fences = yardFences(plots);
  for (const fence of fences) {
    if (!fence.gate) drawSprite(ctx, fence.sprite, fence.x, fence.y);
  }
  paintPixels(ctx, fencePosts(fences));
  paintPixels(ctx, grassTufts(COLS, ROWS, path, pond, plots));

  for (let i = 0; i < 160; i += 1) {
    const c = (i * 17 + 3) % COLS;
    const r = (i * 11 + 5) % ROWS;
    if (path[r][c]) continue;
    if (c >= pond.c0 - 1 && c <= pond.c1 + 1 && r >= pond.r0 - 1 && r <= pond.r1 + 1) continue;
    const px = c * TILE + 8;
    const py = r * TILE + 14;
    let onSoil = false;
    for (let index = 0; index < VILLAGE_CAPACITY; index += 1) {
      const plot = plotAt(index);
      if (px > plot.x + 12 && px < plot.x + 100 && py > plot.y + 16 && py < plot.y + 70) {
        onSoil = true;
        break;
      }
    }
    if (onSoil) continue;
    drawSprite(ctx, FLOWERS[i % FLOWERS.length], px, py);
  }

  propList.length = 0;
  const pushProp = (name: string, x: number, y: number) => {
    const frame = spriteFrame(name);
    propList.push({ name, x, y, sort: y + (frame ? frame.h - frame.ay : 0) });
  };
  const headerTrees: [number, number, string][] = [
    [48, 214, "tree_0"],
    [220, 200, "tree_3"],
    [390, 208, "tree_6"],
    [860, 198, "tree_1"],
    [1040, 206, "tree_4"],
    [1164, 212, "tree_8"],
    [40, 1064, "tree_2"],
    [220, 1072, "tree_5"],
    [980, 1060, "tree_7"],
    [1160, 1052, "tree_9"],
    [28, 520, "tree_1"],
    [28, 820, "tree_6"],
    [1184, 500, "tree_3"],
    [1184, 800, "tree_0"],
  ];
  for (const [x, y, name] of headerTrees) pushProp(name, x, y);
  for (let index = 0; index < VILLAGE_CAPACITY; index += 1) {
    const plot = plotAt(index);
    if (!plot.orchard) continue;
    pushProp(TREES[(index + 1) % TREES.length], plot.x + 70, plot.y + 58);
  }
  pushProp("house_0", 470, 214);
  pushProp("house_1", 760, 200);
  pushProp("house_2", 1040, 980);
  pushProp("cliff_0", 160, 48);
  pushProp("cliff_1", 200, 56);
  pushProp("cliff_2", 900, 52);
  pushProp("bush_0", 320, 204);
  pushProp("bush_1", 640, 198);
  pushProp("farm_0", 300, 190);
  pushProp("farm_1", 980, 190);
  for (let i = 0; i < 4; i += 1) {
    pushProp(TREES[(i + 2) % TREES.length], 620, 340 + i * 180);
  }
  for (let index = 0; index < VILLAGE_CAPACITY; index += 4) {
    const plot = plotAt(index);
    pushProp(`bush_${Math.floor(index / 4) % 6}`, plot.x + 16, plot.y + 68);
    if (index % 5 === 0) pushProp(`farm_${Math.floor(index / 5) % 8}`, plot.x + 88, plot.y + 36);
  }
  for (const ridge of RIDGE) pushProp(ridge.sprite, ridge.x, ridge.y);
  pixelProps = [];
  for (const prop of yardProps(plots)) {
    if (prop.kind === "sprite" && prop.sprite) pushProp(prop.sprite, prop.x, prop.y);
    else pixelProps.push(prop);
  }
}

function drawMill(ctx: CanvasRenderingContext2D, angle: number) {
  ctx.fillStyle = "#8a5528";
  ctx.fillRect(1088, 200, 4, 28);
  ctx.save();
  ctx.translate(1090, 198);
  ctx.rotate(angle);
  ctx.fillStyle = "#f2d15c";
  ctx.fillRect(-10, -2, 20, 4);
  ctx.fillRect(-2, -10, 4, 20);
  ctx.restore();
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(70, 150, 6, 18);
  ctx.fillStyle = "#3a8fbc";
  ctx.fillRect(64, 146, 18, 4);
}

function drawCritter(
  ctx: CanvasRenderingContext2D,
  kind: "none" | "butterfly" | "firefly",
  x: number,
  y: number,
  index: number,
) {
  const left = Math.round(x);
  const top = Math.round(y);
  if (kind === "firefly") {
    ctx.fillStyle = index % 2 ? "#fff6d8" : "#f2d15c";
    ctx.fillRect(left, top, 2, 2);
    return;
  }
  ctx.fillStyle = index % 2 ? "#f4b4c4" : "#e7c86a";
  ctx.fillRect(left, top, 2, 2);
  ctx.fillRect(left - 3, top - 1, 2, 2);
  ctx.fillRect(left + 3, top - 1, 2, 2);
}

function drawSeasonSpeck(ctx: CanvasRenderingContext2D, seasonId: string, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  if (seasonId === "spring") {
    ctx.fillStyle = "#f4b4c4";
    ctx.fillRect(left, top, 2, 2);
    ctx.fillRect(left + 2, top + 1, 1, 1);
    return;
  }
  if (seasonId === "summer") {
    ctx.fillStyle = "#3a7d4a";
    ctx.fillRect(left, top, 2, 3);
    return;
  }
  if (seasonId === "autumn") {
    ctx.fillStyle = "#d46a32";
    ctx.fillRect(left, top, 3, 2);
    return;
  }
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left, top, 2, 2);
  ctx.fillRect(left + 1, top + 2, 1, 1);
}

function drawWater(ctx: CanvasRenderingContext2D, t: number) {
  const frame = `water_${Math.floor(t * 6) % 4}`;
  for (let r = 2; r <= 7; r += 1) {
    for (let c = 2; c <= 13; c += 1) blitTopLeft(ctx, frame, c * TILE, r * TILE);
  }
}

function catAnim(person: PlacedVillager, t: number): { anim: CatAnim; fps: number } {
  if (!person.scored) return { anim: "idle", fps: 4 };
  if (person.state === "hard_work") return { anim: "chop", fps: 8 };
  if (person.state === "focused") return { anim: "water", fps: 6 };
  if (person.state === "mixed") return { anim: Math.floor(t * 0.35) % 2 === 0 ? "dig" : "water", fps: 8 };
  if (person.state === "fishing") return { anim: "hold", fps: 4 };
  if (person.state === "slacking") return { anim: "sit", fps: 4 };
  if (person.state === "wander") return { anim: "walk", fps: 8 };
  return { anim: "idle", fps: 4 };
}

function catFrame(color: string, dir: Facing, anim: CatAnim, frame: number) {
  const count = ANIM_FRAMES[anim];
  const index = ((frame % count) + count) % count;
  const name = `cat_${color}_${dir}_${anim}_${index}`;
  if (spriteFrame(name)) return name;
  return `cat_${color}_down_idle_0`;
}

function drawVillager(
  ctx: CanvasRenderingContext2D,
  person: PlacedVillager,
  t: number,
  selected: boolean,
  fx: VillageFx | null,
  life: SceneLife | null,
  bloom: boolean,
  showGlyph: boolean,
  clock: ReturnType<typeof shanghaiClock>,
  zoom: number,
) {
  const elapsed = fx ? (Date.now() - fx.startedAt) / 1000 : 0;
  const onActor = fx?.actor === person.name;
  const onPartner = fx?.kind === "pair" && fx.partner === person.name;
  const posed = catAnim(person, t);
  let anim = posed.anim;
  const fps = posed.fps;
  let y = person.y;
  if (onActor && fx) {
    if (fx.kind === "rod") anim = "hold";
    if (fx.kind === "sit") anim = "sit";
    if (fx.kind === "nod") y -= Math.sin(elapsed * 14) * 3;
    if (fx.kind === "scare") y -= elapsed < 0.28 ? 10 : 0;
    if (fx.kind === "coffee") y -= Math.sin(elapsed * 10) * 2;
  }
  if ((onActor || onPartner) && fx?.kind === "pair") anim = "water";
  const frame = Math.floor(t * fps * person.speed);
  const bob = selected && !life?.reduceMotion ? (Math.floor(t * 5) % 2 === 0 ? 1 : 0) : 0;
  const x = person.x;
  y -= bob;
  if (life?.decor?.nods.includes(person.name) && !life.reduceMotion) {
    y -= Math.abs(Math.sin(t * 3)) * 3;
  }
  const color = person.scored ? CAT_COLORS[person.identity.palette] : "lgrey";
  const read = distanceSilhouette(zoom, Boolean(person.scored));
  ctx.fillStyle = "rgba(20, 16, 8, 0.55)";
  ctx.fillRect(Math.round(x + read.body.x), Math.round(y + read.body.y), read.body.w, read.body.h);
  ctx.fillStyle = read.shadow.color;
  ctx.fillRect(Math.round(x + read.shadow.x), Math.round(y + read.shadow.y), read.shadow.w, read.shadow.h);
  if (read.cap) {
    ctx.fillStyle = read.cap.color;
    ctx.fillRect(Math.round(x + read.cap.x), Math.round(y + read.cap.y), read.cap.w, read.cap.h);
  }
  if (read.side) {
    ctx.fillStyle = read.side.color;
    ctx.fillRect(Math.round(x + read.side.x), Math.round(y + read.side.y), read.side.w, read.side.h);
    ctx.fillRect(Math.round(x - read.side.x - read.side.w), Math.round(y + read.side.y), read.side.w, read.side.h);
  }
  if (read.pip) {
    ctx.fillStyle = read.pip.color;
    ctx.fillRect(Math.round(x + read.pip.x), Math.round(y + read.pip.y), read.pip.w, read.pip.h);
  }
  drawSprite(ctx, catFrame(color, person.dir, anim, frame), x, y);
  if (selected || life?.neighbors.includes(person.name)) {
    ctx.strokeStyle = selected ? "#fff6d8" : "#f2d15c";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(x - 10), Math.round(y - 28), 20, 26);
  }
  if (onActor && fx?.kind === "seed") {
    const rise = Math.min(1, elapsed / 0.4);
    const hop = Math.sin(rise * Math.PI) * 8;
    drawSprite(ctx, "crop_2_0_2", x + 20, y - 10 - rise * 14 - hop, { scale: 2 });
  }
  if (onActor && fx?.kind === "coffee") drawMug(ctx, x + 10, y - 36);
  if (onActor && fx?.kind === "scare" && elapsed < 0.45) drawBang(ctx, x + 8, y - 40);
  if (onActor && fx?.kind === "stretch") y -= life?.reduceMotion ? 2 : Math.sin(elapsed * 8) * 5;
  if (onActor && fx?.kind === "wave") drawWave(ctx, x + 12, y - 46 - (life?.reduceMotion ? 0 : Math.sin(elapsed * 8) * 3));
  if (onActor && fx?.kind === "clap") drawClap(ctx, x + 8, y - 30);
  if (!person.scored) {
    ctx.save();
    ctx.strokeStyle = "#8a8478";
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(Math.round(x - 11), Math.round(y - 30), 22, 28);
    ctx.restore();
  } else if (!selected) {
    ctx.strokeStyle = "rgba(20, 12, 8, 0.55)";
    ctx.strokeRect(Math.round(x - 10), Math.round(y - 30), 20, 28);
  }
  if (life?.selfName === person.name && life.selfPreset) {
    drawStatusProp(ctx, life.selfPreset, x - 18, y - 28);
    drawStatusBadge(ctx, life.selfPreset, x - 4, y - 46);
  }
  const avail = availabilityFor(
    person,
    clock,
    life?.selfName === person.name ? life.selfPreset : null,
  );
  drawDot(ctx, x - 12, y - 4, avail.tone, read.dot);
  if (bloom && life?.particles) drawPetals(ctx, x, y, life?.reduceMotion ? 0 : t, ringColors(person));
  if (showGlyph) drawGlyph(ctx, glyphFor(person, clock.hour), x + 14, y - 40);
  drawLifeMarks(ctx, person, life, t, x, y);
}

function drawMug(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left, top, 8, 7);
  ctx.fillStyle = "#c47a3a";
  ctx.fillRect(left + 1, top + 1, 6, 4);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left + 7, top + 2, 2, 3);
}

const FESTIVAL_FLOWERS = [
  { x: 180, y: 420 },
  { x: 420, y: 520 },
  { x: 860, y: 460 },
  { x: 1040, y: 700 },
  { x: 260, y: 860 },
  { x: 720, y: 900 },
];

const BLOOM_CAP = PARTICLE_BUDGET;
const GLYPH_CAP = GLYPH_BUDGET;

function bloomNames(villagers: PlacedVillager[], life: SceneLife | null, selectedName: string | null) {
  const names = new Set<string>();
  if (!life || life.quiet || life.reduceMotion) return names;
  const closed: string[] = [];
  for (const person of villagers) {
    if (ringClosure(person).any) closed.push(person.name);
  }
  for (const name of life.sundayGlow) {
    if (!closed.includes(name)) closed.push(name);
  }
  const picked = closed.length <= BLOOM_CAP ? closed : closed.filter((name) => hashName(name) % Math.ceil(closed.length / BLOOM_CAP) === 0);
  for (const name of picked.slice(0, BLOOM_CAP)) names.add(name);
  if (selectedName && closed.includes(selectedName)) names.add(selectedName);
  return names;
}

function glyphNames(villagers: PlacedVillager[], life: SceneLife | null, selectedName: string | null) {
  const names = new Set<string>();
  if (!life?.glyphsOn || life.quiet) return names;
  const pool = villagers.map((person) => person.name);
  const picked = pool.length <= GLYPH_CAP ? pool : pool.filter((name) => hashName(name) % Math.ceil(pool.length / GLYPH_CAP) === 0);
  for (const name of picked.slice(0, GLYPH_CAP)) names.add(name);
  if (selectedName) names.add(selectedName);
  return names;
}

function ringColors(person: PlacedVillager) {
  const rings = ringClosure(person);
  const colors = [];
  if (rings.work) colors.push("#3a7d4a");
  if (rings.fish) colors.push("#3a8fbc");
  if (rings.task) colors.push("#d4a017");
  if (colors.length === 0) colors.push("#f2d15c");
  return colors;
}

function drawPetals(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, colors: string[]) {
  for (let i = 0; i < 4; i += 1) {
    const angle = t * 0.7 + i * 1.4;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(Math.round(x + Math.cos(angle) * 14), Math.round(y - 28 + Math.sin(angle) * 5), 3, 3);
  }
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, tone: "green" | "yellow" | "red", size = 3) {
  ctx.fillStyle = tone === "green" ? "#3a7d4a" : tone === "red" ? "#c44b3a" : "#d4a017";
  const s = size;
  ctx.fillRect(Math.round(x), Math.round(y), s, s);
  ctx.fillStyle = "rgba(20, 12, 8, 0.8)";
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, s + 2, 1);
  ctx.fillRect(Math.round(x) - 1, Math.round(y) + s, s + 2, 1);
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left - 1, top - 1, 12, 9);
  ctx.fillStyle = "#ffe7a3";
  ctx.fillRect(left, top, 10, 7);
  ctx.fillStyle = "#3a2208";
  ctx.fillRect(left + 2, top + 2, 2, 2);
  ctx.fillRect(left + 6, top + 2, 2, 2);
}

function drawGlyph(ctx: CanvasRenderingContext2D, kind: ReturnType<typeof glyphFor>, x: number, y: number) {
  const left = Math.round(x - 3);
  const top = Math.round(y);
  if (kind === "stretch") {
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(left, top, 2, 5);
    ctx.fillRect(left + 5, top, 2, 5);
    return;
  }
  if (kind === "cast") {
    ctx.fillStyle = "#3a8fbc";
    ctx.fillRect(left + 2, top, 2, 6);
    ctx.fillRect(left + 4, top + 4, 3, 2);
    return;
  }
  if (kind === "mug") {
    drawMug(ctx, left, top);
    return;
  }
  if (kind === "bowl") {
    ctx.fillStyle = "#c47a3a";
    ctx.fillRect(left, top + 2, 8, 3);
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(left + 1, top + 1, 6, 2);
    return;
  }
  ctx.fillStyle = "#7dba6a";
  ctx.fillRect(left + 2, top + 2, 3, 3);
}

function drawStatusProp(ctx: CanvasRenderingContext2D, preset: NonNullable<SceneLife["selfPreset"]>, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  if (preset === "focus") {
    ctx.fillStyle = "#d4a017";
    ctx.fillRect(left, top, 4, 8);
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(left + 1, top + 1, 2, 3);
    return;
  }
  if (preset === "lunch") {
    ctx.fillStyle = "#c47a3a";
    ctx.fillRect(left, top + 2, 8, 4);
    return;
  }
  if (preset === "meeting") {
    ctx.fillStyle = "#6a3d18";
    ctx.fillRect(left, top + 4, 8, 3);
    ctx.fillRect(left + 1, top, 2, 4);
    return;
  }
  if (preset === "dive") {
    ctx.fillStyle = "#3a8fbc";
    ctx.fillRect(left, top + 3, 8, 2);
    ctx.fillRect(left + 6, top, 2, 4);
    return;
  }
  ctx.fillStyle = "#efe6d6";
  ctx.fillRect(left, top, 6, 8);
  ctx.fillStyle = "#6a5a48";
  ctx.fillRect(left + 2, top + 3, 2, 2);
}

function drawBang(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left, top, 3, 8);
  ctx.fillRect(left, top + 10, 3, 2);
}

function flowerMarkNames(villagers: PlacedVillager[], selectedName: string | null) {
  const names = new Set<string>();
  const closed = villagers.filter((person) => ringClosure(person).any).map((person) => person.name);
  const picked =
    closed.length <= FLOWER_MARK_CAP
      ? closed
      : closed.filter((name) => hashName(name) % Math.ceil(closed.length / FLOWER_MARK_CAP) === 0);
  for (const name of picked.slice(0, FLOWER_MARK_CAP)) names.add(name);
  if (selectedName && closed.includes(selectedName)) names.add(selectedName);
  return names;
}

function drawLifeMarks(
  ctx: CanvasRenderingContext2D,
  person: PlacedVillager,
  life: SceneLife | null,
  t: number,
  x: number,
  y: number,
) {
  if (!life) return;
  if (life.spotlights.includes(person.name)) {
    ctx.fillStyle = "rgba(255, 226, 120, 0.28)";
    ctx.fillRect(Math.round(x - 16), Math.round(y - 50), 32, 54);
  }
  if (life.sundayGlow.includes(person.name)) {
    const pulse = life.reduceMotion ? 0 : Math.sin(t * 4) * 2;
    ctx.strokeStyle = "#f2d15c";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(x - 13 - pulse), Math.round(y - 34 - pulse), 26 + pulse * 2, 32 + pulse * 2);
  }
  const club = life.clubs[person.name];
  if (club) drawFlag(ctx, x - 20, y - 18, club);
  const tier = life.cropTiers[person.name] ?? 0;
  if (tier > 0) {
    drawSprite(ctx, `crop_0_0_${Math.min(3, tier)}`, x + 16, y + 6, { scale: 2 });
  }
  if (life.jobLook) {
    const look = jobPixels(person);
    if (look) drawJob(ctx, x + 18, y - 8, look);
  }
  if (life.selfName === person.name && life.selfProp) drawMiniProp(ctx, life.selfProp, x - 22, y + 4);
  const crop = life.gardenCrops[person.name];
  if (crop) drawMiniProp(ctx, crop, x + 8, y + 8);
  const decor = life.decor;
  if (!decor) return;
  if (decor.pins.includes(person.name)) {
    ctx.strokeStyle = "#f2d15c";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(x - 14), Math.round(y - 36), 28, 34);
  }
  if (decor.hats.includes(person.name)) {
    ctx.fillStyle = "#c44b3a";
    ctx.fillRect(Math.round(x - 6), Math.round(y - 40), 12, 4);
    ctx.fillRect(Math.round(x - 2), Math.round(y - 46), 4, 6);
  }
  if (decor.gifts.includes(person.name)) {
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(Math.round(x + 8), Math.round(y - 44), 3, 3);
  }
  if (life.selfName === person.name && decor.porch) drawPorchLamp(ctx, x, y);
  if (life.selfName === person.name && decor.watered) drawWaterDrop(ctx, x + 8, y - 4);
  if (life.selfName === person.name && decor.instrument) {
    drawMiniProp(ctx, decor.instrument, x - 16, y - 18);
  }
  if (life.selfName === person.name && decor.wreath) {
    ctx.strokeStyle = decor.wreath;
    ctx.strokeRect(Math.round(x - 12), Math.round(y - 34), 24, 8);
  }
}

function drawPorchLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x - 22);
  const top = Math.round(y - 18);
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left + 2, top + 5, 2, 10);
  ctx.fillStyle = "#f2d15c";
  ctx.fillRect(left, top, 6, 5);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left + 2, top + 1, 2, 2);
}

function drawWaterDrop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#3a8fbc";
  ctx.fillRect(left + 1, top, 2, 2);
  ctx.fillRect(left, top + 2, 4, 3);
}

function drawBench(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left - 10, top - 6, 20, 2);
  ctx.fillRect(left - 10, top, 20, 3);
  ctx.fillStyle = "#8a5528";
  ctx.fillRect(left - 8, top + 3, 2, 4);
  ctx.fillRect(left + 6, top + 3, 2, 4);
}

function drawWeekRibbon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left, top, 2, 16);
  ctx.fillStyle = "#c44b3a";
  ctx.fillRect(left + 2, top + 2, 12, 7);
  ctx.fillStyle = "#f4d7a1";
  ctx.fillRect(left + 2, top + 5, 12, 2);
  ctx.fillStyle = "#8a2020";
  ctx.fillRect(left + 12, top + 9, 3, 4);
}

function drawStroll(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  ctx.fillStyle = "#efe0c0";
  for (let i = 0; i < points.length; i += 1) {
    const here = points[i];
    ctx.fillRect(Math.round(here.x) - 2, Math.round(here.y) - 1, 4, 3);
    const next = points[i + 1];
    if (!next) continue;
    ctx.fillStyle = "#c4a060";
    ctx.fillRect(Math.round((here.x + next.x) / 2) - 1, Math.round((here.y + next.y) / 2) - 1, 3, 2);
    ctx.fillStyle = "#efe0c0";
  }
}

function jobPixels(person: PlacedVillager): "hoe" | "rod" | "scroll" | null {
  if (!person.scored) return null;
  const work = person.work / 3;
  const fish = person.fish / 3;
  const task = person.on_task;
  const max = Math.max(work, fish, task);
  if (max <= 0) return null;
  if (fish === max) return "rod";
  if (task === max) return "scroll";
  return "hoe";
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, axis: "work" | "fish" | "task") {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left, top, 2, 12);
  ctx.fillStyle = axis === "work" ? "#3a7d4a" : axis === "fish" ? "#3a8fbc" : "#d4a017";
  ctx.fillRect(left + 2, top, 7, 5);
}

function drawJob(ctx: CanvasRenderingContext2D, x: number, y: number, kind: "hoe" | "rod" | "scroll") {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = kind === "rod" ? "#3a8fbc" : kind === "scroll" ? "#fff6d8" : "#c4a060";
  if (kind === "scroll") {
    ctx.fillRect(left, top, 8, 6);
    ctx.fillStyle = "#6a3d18";
    ctx.fillRect(left + 1, top + 2, 6, 1);
    return;
  }
  ctx.fillRect(left + 3, top, 2, 10);
  ctx.fillRect(left, top, 8, 2);
}

function drawMiniProp(ctx: CanvasRenderingContext2D, id: string, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  const color =
    id === "lantern" || id === "lamp"
      ? "#f2d15c"
      : id === "pot" || id === "flower"
        ? "#c44b3a"
        : id === "mushroom"
          ? "#d46a4a"
          : "#efe6d6";
  ctx.fillStyle = "#6a3d18";
  ctx.fillRect(left, top, 8, 8);
  ctx.fillStyle = color;
  ctx.fillRect(left + 1, top + 1, 6, 6);
}

function drawClap(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left, top, 3, 4);
  ctx.fillRect(left + 5, top, 3, 4);
}

function drawStatusBadge(ctx: CanvasRenderingContext2D, preset: NonNullable<SceneLife["selfPreset"]>, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = preset === "leave" || preset === "meeting" ? "#c44b3a" : preset === "focus" ? "#d4a017" : "#3a8fbc";
  ctx.fillRect(left, top, 8, 8);
  ctx.fillStyle = "#fff6d8";
  ctx.fillRect(left + 2, top + 2, 4, 4);
}

const HOUSE_FACES = [
  { x: 500, y: 168, face: 0 },
  { x: 790, y: 156, face: 1 },
  { x: 1070, y: 940, face: 2 },
  { x: 220, y: 150, face: 3 },
  { x: 640, y: 980, face: 4 },
];

function drawHouseFace(ctx: CanvasRenderingContext2D, face: number, x: number, y: number) {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = face === 1 ? "#6a3d18" : face === 2 ? "#2a1a10" : "#8a3a28";
  ctx.fillRect(left, top, face === 1 ? 14 : 8, 12);
  ctx.fillStyle = face === 2 ? "#d5e4ef" : "#f2d15c";
  ctx.fillRect(left + 2, top + 3, 3, 4);
  if (face === 0) {
    ctx.fillStyle = "#c44b3a";
    ctx.fillRect(left + 10, top - 6, 3, 6);
  }
  if (face === 3) {
    ctx.fillStyle = "#3a8fbc";
    ctx.fillRect(left, top, 10, 12);
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(left + 3, top + 2, 4, 4);
  }
  if (face === 4) {
    ctx.fillStyle = "#2f6a3a";
    ctx.fillRect(left, top, 16, 12);
    ctx.fillStyle = "#f2d15c";
    ctx.fillRect(left + 2, top + 3, 3, 3);
    ctx.fillRect(left + 10, top + 3, 3, 3);
  }
}

function drawSpotMarker(ctx: CanvasRenderingContext2D, x: number, y: number, kind: "gather" | "view") {
  ctx.fillStyle = kind === "view" ? "#fff6d8" : "#6a3d18";
  ctx.fillRect(Math.round(x - 6), Math.round(y), 12, 4);
  if (kind === "view") {
    ctx.fillStyle = "#f2d15c";
    ctx.fillRect(Math.round(x - 1), Math.round(y - 8), 2, 8);
  }
}

function drawFestivalOverlay(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  festivalId: string,
  t: number,
  quiet: boolean,
  reduced: boolean,
) {
  const count = quiet ? 8 : 18;
  const still = quiet || reduced;
  for (let i = 0; i < count; i += 1) {
    const baseX = ((i * 97) % Math.max(1, viewW - 8)) + 4;
    const baseY = ((i * 53) % Math.max(1, viewH - 8)) + 4;
    const drift = still ? 0 : Math.sin(t + i) * 6;
    if (festivalId === "立春") {
      ctx.fillStyle = i % 2 ? "#f4b4c4" : "#fff6d8";
      ctx.fillRect(Math.round(baseX), Math.round(baseY + drift), 3, 3);
    } else if (festivalId === "立夏") {
      ctx.fillStyle = i % 2 ? "#f2d15c" : "#fff6d8";
      ctx.fillRect(Math.round(baseX + drift), Math.round(baseY), 2, 2);
    } else if (festivalId === "立秋") {
      ctx.fillStyle = i % 2 ? "#d46a32" : "#e0a050";
      ctx.fillRect(Math.round(baseX), Math.round(baseY + drift), 4, 2);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(Math.round(baseX), Math.round(baseY), 2, 2);
    }
  }
}

export function paintBootField(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, label: string) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#3c6e32";
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.fillStyle = "#2f5a28";
  for (let row = 0; row < 8; row += 1) {
    ctx.fillRect(24, 80 + row * (viewH / 10), viewW - 48, 10);
  }
  ctx.fillStyle = "#c4a060";
  ctx.fillRect(0, Math.round(viewH * 0.42), viewW, 18);
  ctx.fillStyle = "#3a8fbc";
  ctx.fillRect(28, 28, Math.min(180, viewW * 0.2), 48);
  ctx.fillStyle = "#5a3214";
  ctx.fillRect(16, 16, Math.min(280, viewW - 32), 36);
  ctx.fillStyle = "#fff6d8";
  ctx.font = "16px sans-serif";
  ctx.fillText(label, 28, 40);
}

function drawActors(
  ctx: CanvasRenderingContext2D,
  villagers: PlacedVillager[],
  t: number,
  selectedName: string | null,
  fx: VillageFx | null,
  life: SceneLife | null,
  zoom: number,
) {
  const blooms = bloomNames(villagers, life, selectedName);
  const glyphs = glyphNames(villagers, life, selectedName);
  const flowers = flowerMarkNames(villagers, selectedName);
  const clock = shanghaiClock();
  const queue: { sort: number; draw: () => void }[] = [];
  for (const prop of propList) {
    queue.push({
      sort: prop.y,
      draw: () => drawSprite(ctx, prop.name, prop.x, prop.y),
    });
  }
  if (life?.festival && life.festivalSkin) {
    for (const spot of FESTIVAL_FLOWERS) {
      queue.push({
        sort: spot.y,
        draw: () => drawSprite(ctx, "crop_2_0_2", spot.x, spot.y, { scale: 2 }),
      });
    }
  }
  for (const house of HOUSE_FACES) {
    queue.push({
      sort: house.y + 20,
      draw: () => drawHouseFace(ctx, house.face, house.x, house.y),
    });
  }
  for (const spot of GATHER_SPOTS) {
    queue.push({ sort: spot.y, draw: () => drawSpotMarker(ctx, spot.x, spot.y, "gather") });
  }
  for (const spot of VIEWPOINTS) {
    const found = life?.feathers.includes(spot.id);
    queue.push({
      sort: spot.y,
      draw: () => drawSpotMarker(ctx, spot.x, spot.y, found ? "view" : "gather"),
    });
  }
  if (life?.decor) {
    const decor = life.decor;
    for (const step of decor.footprints) {
      queue.push({
        sort: step.y,
        draw: () => {
          ctx.save();
          ctx.globalAlpha = step.alpha;
          ctx.fillStyle = "#5a3a1c";
          ctx.fillRect(step.x - 2, step.y, 3, 2);
          ctx.fillRect(step.x + 2, step.y + 1, 3, 2);
          ctx.restore();
        },
      });
    }
    if (decor.sit) {
      const sit = decor.sit;
      queue.push({
        sort: sit.y,
        draw: () => drawBench(ctx, sit.x, sit.y),
      });
    }
    if (decor.mill) {
      queue.push({
        sort: 220,
        draw: () => drawMill(ctx, decor.millSpin ? t * 0.35 : 0),
      });
    }
    if (decor.critters !== "none") {
      const still = Boolean(life?.reduceMotion);
      for (let i = 0; i < 4; i += 1) {
        const x = 220 + i * 150;
        const y = 340 + (i % 2) * 70;
        const hop = still ? 0 : Math.sin(t + i) * 3;
        queue.push({
          sort: y,
          draw: () => drawCritter(ctx, decor.critters, x, y + hop, i),
        });
      }
    }
    if (decor.stroll.length >= 2) {
      const stroll = decor.stroll;
      queue.push({
        sort: 8,
        draw: () => drawStroll(ctx, stroll),
      });
    }
    if (decor.weekRibbon) {
      queue.push({
        sort: 140,
        draw: () => drawWeekRibbon(ctx, 88, 128),
      });
    }
    if (decor.dusk || decor.porch) {
      const panes = porchWindows(decor.dusk, decor.porch, Boolean(life?.reduceMotion), t);
      queue.push({
        sort: 12,
        draw: () => paintPixels(ctx, panes),
      });
    }
  }
  const lit = Boolean(life?.decor?.dusk || life?.decor?.porch);
  for (const prop of pixelProps) {
    const pixels = propPixels(prop, lit);
    queue.push({
      sort: prop.sort,
      draw: () => paintPixels(ctx, pixels),
    });
  }
  const smoke = smokePuffs(t, Boolean(life?.reduceMotion || life?.quiet));
  queue.push({
    sort: 40,
    draw: () => paintPixels(ctx, smoke),
  });
  for (const person of villagers) {
    const bench = life?.decor?.sit;
    const seated = Boolean(bench && life?.selfName === person.name);
    const actor = seated && bench ? { ...person, x: bench.x, y: bench.y, state: "slacking" as const } : person;
    queue.push({
      sort: actor.y,
      draw: () => {
        drawVillager(
          ctx,
          actor,
          t,
          person.name === selectedName,
          fx,
          life,
          blooms.has(person.name),
          glyphs.has(person.name),
          clock,
          zoom,
        );
        if (flowers.has(person.name)) drawSprite(ctx, "flower_3", person.x + 14, person.y + 2);
      },
    });
  }
  queue.sort((a, b) => a.sort - b.sort);
  for (const item of queue) item.draw();
}

export function paintVillage(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  camX: number,
  camY: number,
  zoom: number,
  villagers: PlacedVillager[],
  t: number,
  selectedName: string | null,
  emphasize: Set<string>,
  dpr: number,
  fx: VillageFx | null = null,
  life: SceneLife | null = null,
) {
  if (!artReady()) return;
  ensureGround();
  if (!groundCanvas) return;
  if (!worldCanvas) {
    worldCanvas = document.createElement("canvas");
    worldCanvas.width = WORLD_W;
    worldCanvas.height = WORLD_H;
  }
  const world = worldCanvas.getContext("2d");
  if (!world) return;
  world.imageSmoothingEnabled = false;
  world.clearRect(0, 0, WORLD_W, WORLD_H);
  world.drawImage(groundCanvas, 0, 0);
  drawWater(world, life?.reduceMotion ? 0 : t);
  paintPixels(world, pondLife(POND, life?.reduceMotion ? 0 : t, Boolean(life?.reduceMotion)));
  drawActors(world, villagers, t, selectedName, fx, life, zoom);

  const span = viewSpan(zoom);
  const viewWorldW = span.w;
  const viewWorldH = span.h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#3c6e32";
  ctx.fillRect(0, 0, viewW, viewH);
  const destW = Math.max(1, Math.round(viewW));
  const destH = Math.max(1, Math.round(viewH));
  ctx.drawImage(worldCanvas, camX, camY, viewWorldW, viewWorldH, 0, 0, destW, destH);
  if (life?.seasonTint) {
    ctx.fillStyle = life.seasonTint;
    ctx.fillRect(0, 0, viewW, viewH);
    paintPixels(ctx, seasonWash(life.decor?.seasonId ?? "spring", viewW, viewH));
  }
  if (life?.festivalSkin && life.festivalId) {
    drawFestivalOverlay(ctx, viewW, viewH, life.festivalId, t, Boolean(life.quiet), Boolean(life.reduceMotion));
  }
  if (life?.decor?.dusk) {
    ctx.fillStyle = "rgba(88, 48, 24, 0.28)";
    ctx.fillRect(0, 0, viewW, viewH);
  }
  if (life?.decor && life.decor.stars > 0) {
    for (let i = 0; i < life.decor.stars; i += 1) {
      const sx = ((i * 97) % Math.max(1, viewW - 8)) + 4;
      const sy = ((i * 53) % Math.max(1, Math.floor(viewH * 0.35))) + 4;
      ctx.fillStyle = i % 2 ? "#fff6d8" : "#f2d15c";
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
  if (life?.decor && life.decor.seasonParticles > 0) {
    const count = life.decor.seasonParticles;
    const still = Boolean(life.reduceMotion);
    for (let i = 0; i < count; i += 1) {
      const drift = still ? 0 : Math.round(Math.sin(t * 0.6 + i) * 4);
      const sx = ((i * 131) % Math.max(1, viewW - 8)) + 4;
      const sy = ((i * 47) % Math.max(1, viewH - 8)) + 4 + drift;
      drawSeasonSpeck(ctx, life.decor.seasonId, sx, sy);
    }
  }
  if (life?.decor?.showWeather) {
    paintPixels(
      ctx,
      weatherMotes({
        id: life.decor.weatherId,
        viewW,
        viewH,
        t,
        reduced: Boolean(life.reduceMotion),
        quiet: Boolean(life.quiet),
      }),
    );
  }
  paintPixels(
    ctx,
    ambientMotes({
      seasonId: life?.decor?.seasonId ?? "spring",
      viewW,
      viewH,
      t,
      reduced: Boolean(life?.reduceMotion),
      quiet: Boolean(life?.quiet),
    }),
  );
  drawNameLabels(ctx, villagers, zoom, camX, camY, emphasize, viewW, viewH, dpr, life);
}

const FAMILIAR_RIM = ["", "#c4a060", "#d4a017", "#2f6a3a"];

export function drawNameLabels(
  ctx: CanvasRenderingContext2D,
  villagers: PlacedVillager[],
  zoom: number,
  camX: number,
  camY: number,
  emphasize: Set<string>,
  viewW = WORLD_W,
  viewH = WORLD_H,
  dpr = 1,
  life: SceneLife | null = null,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const span = viewSpan(zoom);
  const viewWorldW = span.w;
  const viewWorldH = span.h;
  const cssW = viewW / dpr;
  const pitchCss = (PITCH_X * cssW * zoom) / WORLD_W;
  let cssScale = zoom >= 3 ? 3 : 2;
  if (pitchCss < 72) cssScale = 1;
  const scale = cssScale * Math.max(1, Math.round(dpr));
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const showAll = Boolean(life?.showAllPlates);
  const pins = new Set(life?.decor?.pins ?? []);

  const ordered = [...villagers].sort((a, b) => {
    const ah = emphasize.has(a.name) || pins.has(a.name) ? 0 : 1;
    const bh = emphasize.has(b.name) || pins.has(b.name) ? 0 : 1;
    if (ah !== bh) return ah - bh;
    return b.y - a.y;
  });

  for (const person of ordered) {
    const pinned = pins.has(person.name);
    const hot = emphasize.has(person.name) || pinned;
    if (!showNameplate(zoom, hot, showAll)) continue;
    const mode: LabelMode = hot ? "hot" : person.scored ? "scored" : "muted";
    const sprite = getLabelSprite(person.name, mode);
    if (!sprite) continue;
    const sx = ((person.x - camX) / viewWorldW) * viewW;
    const sy = ((person.y - 34 - camY) / viewWorldH) * viewH;
    const dw = sprite.w * scale;
    const dh = sprite.h * scale;
    const x = sx - dw / 2;
    const y = sy - dh;
    if (x > viewW || y > viewH || x + dw < 0 || y + dh < 0) continue;
    const box = { x, y, w: dw, h: dh };
    const hit = placed.some((other) => overlaps(box, other));
    if (hit && !hot) continue;
    placed.push(box);
    const level = life?.familiarity[person.name] ?? 0;
    if (level > 0) {
      ctx.fillStyle = FAMILIAR_RIM[level] ?? FAMILIAR_RIM[1];
      ctx.fillRect(Math.round(x - 2), Math.round(y - 2), dw + 4, dh + 4);
    }
    if (zoom < 2) {
      ctx.fillStyle = "rgba(20, 12, 8, 0.55)";
      ctx.fillRect(Math.round(x + 1), Math.round(y + 1), dw, dh);
    }
    blitLabel(ctx, sprite, x, y, scale, plateAlpha(mode, zoom));
  }
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hitTest(villagers: PlacedVillager[], worldX: number, worldY: number, zoom = 2) {
  const pad = zoom <= 1 ? 22 : zoom < 2 ? 10 : 0;
  let best: PlacedVillager | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const v of villagers) {
    const left = v.x - 16 - pad;
    const right = v.x + 16 + pad;
    const top = v.y - 40 - pad;
    const bottom = v.y + 8 + pad;
    if (worldX < left || worldX > right || worldY < top || worldY > bottom) continue;
    const dx = worldX - v.x;
    const dy = worldY - (v.y - 16);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      best = v;
      bestDist = dist;
    }
  }
  return best;
}

/** Integer world span for a zoom step so drawImage never samples a fractional source rect. */
export function viewSpan(zoom: number) {
  const z = Math.max(1, Math.round(zoom) || 1);
  return {
    w: Math.max(1, Math.floor(WORLD_W / z)),
    h: Math.max(1, Math.floor(WORLD_H / z)),
  };
}

export function clampCamera(x: number, y: number, zoom: number) {
  const view = viewSpan(zoom);
  return {
    x: Math.round(Math.min(Math.max(0, x), Math.max(0, WORLD_W - view.w))),
    y: Math.round(Math.min(Math.max(0, y), Math.max(0, WORLD_H - view.h))),
  };
}

export function cameraFocus(person: PlacedVillager, zoom: number) {
  return clampCamera(person.x - WORLD_W / zoom / 2, person.y - WORLD_H / zoom / 2, zoom);
}

export function defaultCamera() {
  return { zoom: DEFAULT_ZOOM, x: 0, y: 0 };
}
