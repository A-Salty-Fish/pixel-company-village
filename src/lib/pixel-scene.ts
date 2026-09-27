import type { VillageFx } from "@/lib/interactions";
import { blitLabel, getLabelSprite, type LabelMode } from "@/lib/pixel-label";
import { VILLAGE_CAPACITY } from "@/lib/capacity";
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
  const path = Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(false));
  const block = (c: number, r: number) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
  const fillPath = (c0: number, r0: number, c1: number, r1: number) => {
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        if (block(c, r)) path[r][c] = true;
      }
    }
  };
  fillPath(0, 13, COLS - 1, 14);
  fillPath(37, 13, 38, ROWS - 2);
  fillPath(2, 40, COLS - 3, 41);

  const pond = { c0: 2, r0: 2, c1: 13, r1: 7 };

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

  for (let index = 0; index < VILLAGE_CAPACITY; index += 1) {
    const plot = plotAt(index);
    const soil = (index & 1) === 0 ? "soil_wet" : "soil_dry";
    for (let ty = 0; ty < 2; ty += 1) {
      for (let tx = 0; tx < 4; tx += 1) {
        blitTopLeft(ctx, tx === 0 || ty === 0 ? "soil_edge" : soil, plot.x + 24 + tx * TILE, plot.y + 28 + ty * TILE);
      }
    }
    if (index % 3 === 0) drawFence(ctx, plot.x + 24, plot.y + 22, 64);
    if (!plot.orchard) {
      for (let ry = 0; ry < 2; ry += 1) {
        for (let rx = 0; rx < 3; rx += 1) {
          if ((plot.cropRow + rx + ry) % 5 === 0) continue;
          const stage = (plot.cropSide + rx + ry) % 4;
          drawSprite(
            ctx,
            `crop_${plot.cropRow}_${plot.cropSide}_${stage}`,
            plot.x + 36 + rx * 18,
            plot.y + 52 + ry * 12,
          );
        }
      }
    }
  }

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
}

function drawFence(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const frame = spriteFrame("fence_0");
  if (!frame) return;
  drawSprite(ctx, "fence_0", x + w / 2, y + frame.h - frame.ay);
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
  const color = person.scored ? CAT_COLORS[person.identity.palette] : "lgrey";
  ctx.fillStyle = "rgba(24, 36, 16, 0.35)";
  ctx.fillRect(Math.round(x - 8), Math.round(y - 2), 16, 3);
  drawSprite(ctx, catFrame(color, person.dir, anim, frame), x, y);
  if (onActor && fx?.kind === "seed") {
    const rise = Math.min(1, elapsed / 0.4);
    const hop = Math.sin(rise * Math.PI) * 8;
    drawSprite(ctx, "crop_2_0_2", x + 20, y - 10 - rise * 14 - hop, { scale: 2 });
  }
  if (onActor && fx?.kind === "coffee") drawMug(ctx, x + 10, y - 36);
  if (onActor && fx?.kind === "scare" && elapsed < 0.45) drawBang(ctx, x + 8, y - 40);
  if (onActor && fx?.kind === "wave") drawWave(ctx, x + 12, y - 46 - (life?.reduceMotion ? 0 : Math.sin(elapsed * 8) * 3));
  if (life?.selfName === person.name && life.selfPreset) drawStatusProp(ctx, life.selfPreset, x - 16, y - 18);
  const avail = availabilityFor(
    person,
    clock,
    life?.selfName === person.name ? life.selfPreset : null,
  );
  drawDot(ctx, x - 12, y - 4, avail.tone);
  if (bloom) drawPetals(ctx, x, y, life?.reduceMotion ? 0 : t, ringColors(person));
  if (showGlyph) drawGlyph(ctx, glyphFor(person, clock.hour), x + 14, y - 40);
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

const BLOOM_CAP = 16;
const GLYPH_CAP = 12;

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

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, tone: "green" | "yellow" | "red") {
  ctx.fillStyle = tone === "green" ? "#3a7d4a" : tone === "red" ? "#c44b3a" : "#d4a017";
  ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
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

function drawActors(
  ctx: CanvasRenderingContext2D,
  villagers: PlacedVillager[],
  t: number,
  selectedName: string | null,
  fx: VillageFx | null,
  life: SceneLife | null,
) {
  const blooms = bloomNames(villagers, life, selectedName);
  const glyphs = glyphNames(villagers, life, selectedName);
  const clock = shanghaiClock();
  const queue: { sort: number; draw: () => void }[] = [];
  for (const prop of propList) {
    queue.push({
      sort: prop.y,
      draw: () => drawSprite(ctx, prop.name, prop.x, prop.y),
    });
  }
  if (life?.festival) {
    for (const spot of FESTIVAL_FLOWERS) {
      queue.push({
        sort: spot.y,
        draw: () => drawSprite(ctx, "crop_2_0_2", spot.x, spot.y, { scale: 2 }),
      });
    }
  }
  for (const person of villagers) {
    queue.push({
      sort: person.y,
      draw: () =>
        drawVillager(
          ctx,
          person,
          t,
          person.name === selectedName,
          fx,
          life,
          blooms.has(person.name),
          glyphs.has(person.name),
          clock,
        ),
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
  drawActors(world, villagers, t, selectedName, fx, life);

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
  }
  drawNameLabels(ctx, villagers, zoom, camX, camY, emphasize, viewW, viewH, dpr);
}

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
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const span = viewSpan(zoom);
  const viewWorldW = span.w;
  const viewWorldH = span.h;
  const cssW = viewW / dpr;
  const pitchCss = (PITCH_X * cssW * zoom) / WORLD_W;
  // 24px glyphs in the overview when a plaque still fits a plot; smaller phones stay at 12px.
  let cssScale = zoom >= 3 ? 3 : 2;
  if (pitchCss < 72) cssScale = 1;
  const scale = cssScale * Math.max(1, Math.round(dpr));
  const placed: { x: number; y: number; w: number; h: number }[] = [];

  const ordered = [...villagers].sort((a, b) => {
    const ae = emphasize.has(a.name) ? 0 : a.scored ? 1 : 2;
    const be = emphasize.has(b.name) ? 0 : b.scored ? 1 : 2;
    return ae - be;
  });

  for (const person of ordered) {
    const hot = emphasize.has(person.name);
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
    blitLabel(ctx, sprite, x, y, scale);
  }
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hitTest(villagers: PlacedVillager[], worldX: number, worldY: number) {
  for (let i = villagers.length - 1; i >= 0; i -= 1) {
    const v = villagers[i];
    if (worldX >= v.x - 16 && worldX <= v.x + 16 && worldY >= v.y - 40 && worldY <= v.y + 4) return v;
  }
  return null;
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
