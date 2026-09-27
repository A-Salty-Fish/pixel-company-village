export type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
};

type AtlasFile = {
  image: string;
  frames: Record<string, SpriteFrame>;
};

export const PALETTE_COUNT = 8;

const HUE_SHIFTS = [0, 32, 68, 108, 148, 188, 228, 278];

let frames: Record<string, SpriteFrame> = {};
let baseCanvas: HTMLCanvasElement | null = null;
let variants: HTMLCanvasElement[][] = [];
let ready = false;
let loading: Promise<void> | null = null;

export function artReady() {
  return ready;
}

export function spriteFrame(name: string) {
  return frames[name];
}

export async function loadVillageArt() {
  if (ready) return;
  if (loading) return loading;
  loading = (async () => {
    const atlasPromise = fetch("/assets/village-atlas.json").then((res) => {
      if (!res.ok) throw new Error("atlas_json");
      return res.json() as Promise<AtlasFile>;
    });
    const [atlas] = await Promise.all([atlasPromise, loadPixelFont()]);
    const image = await loadImage(atlas.image);
    frames = atlas.frames;
    baseCanvas = imageToCanvas(image);
    variants = buildVariants(baseCanvas);
    ready = true;
  })();
  try {
    await loading;
  } catch (error) {
    loading = null;
    throw error;
  }
}

async function loadPixelFont() {
  const face = new FontFace(
    "FusionPixel",
    "url(/fonts/fusion-pixel-12px-proportional-zh_hans.woff2)",
    { display: "block" },
  );
  await face.load();
  document.fonts.add(face);
  await document.fonts.load("12px FusionPixel");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("atlas_image"));
    image.src = src;
  });
}

function imageToCanvas(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  return canvas;
}

function buildVariants(source: HTMLCanvasElement) {
  const made: HTMLCanvasElement[][] = [];
  for (let palette = 0; palette < PALETTE_COUNT; palette += 1) {
    const row: HTMLCanvasElement[] = [];
    row.push(recolor(source, HUE_SHIFTS[palette], false));
    row.push(recolor(source, HUE_SHIFTS[palette], true));
    made.push(row);
  }
  return made;
}

function recolor(source: HTMLCanvasElement, shift: number, muted: boolean) {
  if (shift === 0 && !muted) return source;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const skin = isSkin(h, s, l);
    let nh = h;
    let ns = s;
    let nl = l;
    if (muted) {
      nh = skin ? h : (h + shift) % 360;
      ns = skin ? s * 0.85 : Math.max(0.28, s * 0.7);
      nl = l * 0.94;
    } else if (!skin && s > 0.14 && l > 0.14 && l < 0.93) {
      nh = (h + shift) % 360;
    }
    const [r, g, b] = hslToRgb(nh, ns, nl);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function isSkin(h: number, s: number, l: number) {
  const hue = (h + 360) % 360;
  const warm = hue <= 25 || hue >= 350;
  // Little Wilds faces are a few warm, saturated pixels. The beige outfit is duller.
  return warm && s >= 0.42 && l >= 0.72;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  anchorX: number,
  anchorY: number,
  options?: { palette?: number; muted?: boolean; scale?: number },
) {
  const frame = frames[name];
  if (!frame || !baseCanvas) return false;
  const palette = options?.palette ?? 0;
  const muted = options?.muted ?? false;
  const scale = options?.scale ?? 1;
  const sheet = options?.palette != null || options?.muted ? variants[palette]?.[muted ? 1 : 0] ?? baseCanvas : baseCanvas;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    Math.round(anchorX - frame.ax * scale),
    Math.round(anchorY - frame.ay * scale),
    frame.w * scale,
    frame.h * scale,
  );
  return true;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
