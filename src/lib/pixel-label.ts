/** Fusion Pixel nameplates. Glyphs are rasterized at 12px, then nearest-neighbor scaled. */

export type LabelMode = "hot" | "scored" | "muted";

const labelCache = new Map<string, { canvas: HTMLCanvasElement; w: number; h: number }>();

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  return canvas;
}

function crisp(canvas: HTMLCanvasElement, read = false) {
  const ctx = canvas.getContext("2d", read ? { willReadFrequently: true } : undefined);
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function rasterText(text: string, color: string) {
  const fontPx = 12;
  const probe = crisp(makeCanvas(4, 4));
  const font = `${fontPx}px FusionPixel`;
  if (!probe) return null;
  probe.font = font;
  const measured = Math.ceil(probe.measureText(text).width);
  const tw = Math.max(fontPx, measured);
  const th = fontPx + 2;
  const canvas = makeCanvas(tw + 2, th);
  const ctx = crisp(canvas, true);
  if (!ctx) return null;
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 1, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const [r, g, b] = hexRgb(color);
  for (let i = 0; i < data.length; i += 4) {
    const ink = data[i + 3] >= 128;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = ink ? 255 : 0;
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, w: canvas.width, h: canvas.height };
}

function hexRgb(hex: string): [number, number, number] {
  const n = hex.slice(1);
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

export function clearLabelCache() {
  labelCache.clear();
}

export function getLabelSprite(name: string, mode: LabelMode) {
  const key = `fusion|${mode}|${name}`;
  const hit = labelCache.get(key);
  if (hit) return hit;

  const ink = mode === "hot" ? "#3a2208" : mode === "scored" ? "#24160c" : "#2a2118";
  const text = rasterText(name, ink);
  if (!text) return null;

  const padX = 4;
  const padY = 3;
  const w = text.w + padX * 2;
  const h = text.h + padY * 2;
  const canvas = makeCanvas(w, h);
  const ctx = crisp(canvas);
  if (!ctx) return null;

  const fill = mode === "hot" ? "#ffe7a3" : mode === "scored" ? "#f4d7a2" : "#efe6d6";
  const rim = mode === "hot" ? "#6a3412" : mode === "scored" ? "#5a3214" : "#6a5a48";
  const lip = mode === "hot" ? "#fff6d0" : "#fff1cf";
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = lip;
  ctx.fillRect(2, 2, w - 4, 1);
  ctx.fillStyle = mode === "muted" ? "#8d8274" : "#c4924a";
  ctx.fillRect(2, 2, 2, h - 4);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(text.canvas, padX, padY);

  const entry = { canvas, w, h };
  labelCache.set(key, entry);
  return entry;
}

export function blitLabel(
  ctx: CanvasRenderingContext2D,
  sprite: { canvas: HTMLCanvasElement; w: number; h: number },
  destX: number,
  destY: number,
  scale: number,
  alpha = 1,
) {
  const s = Math.max(1, Math.round(scale));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite.canvas,
    0,
    0,
    sprite.w,
    sprite.h,
    Math.round(destX),
    Math.round(destY),
    sprite.w * s,
    sprite.h * s,
  );
  ctx.restore();
}
