// 像素公司村 — arcane motes over a busy farmer: a small violet rune ring with motes circling it.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, cycle, TAU, WHITE, mix } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Arcane motes",
  size: [40, 40],
  origin: [20, 36],
  duration: 3,
  loop: true,
  fps: 12,
  options: { palette: ["#1d0f3a", "#3a1d78", "#5b2fc0", "#8457f0", "#b28cff", "#dcc8ff", "#ffffff"], seed: 3, tier: 1 },
};

const CY = -22;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), tier = o.tier ?? 1, ph = (t / meta.duration) * TAU;
  const n = 2 + tier, rx = 8 + tier * 2, ry = 3;
  p.glow(0, CY, 10 + tier * 3, C[3], 0.22);
  // the far half of the orbit, dimmer
  for (let i = 0; i < n; i++) {
    const g = ph * (1 + (i % 2) * 0.25) + (i / n) * TAU, x = Math.cos(g) * rx, y = CY + Math.sin(g) * ry;
    const near = Math.sin(g) >= 0;
    p.dot(x, y, near ? C[5] : C[3], near ? 1 : 0.7);
    if (near && tier > 0) p.dot(x - Math.sign(Math.cos(g + 1.57)), y, C[4], 0.6);
    p.light(x, y, C[4], near ? 0.55 : 0.25);
    if (near && Math.sin(g * 3 + ph) > 0.85) sparkle(p, x, y, 1 + tier, WHITE, C[5], 0.35);
  }
  // a tiny open-book glyph at the centre that breathes
  const b = 0.5 + 0.5 * Math.sin(ph);
  const book = mix(C[4], C[6], b * 0.6);
  p.dot(-2, CY, book, 0.9); p.dot(-1, CY - 1, book, 0.9); p.dot(1, CY - 1, book, 0.9); p.dot(2, CY, book, 0.9);
  p.dot(0, CY, C[5], 0.9);
  p.light(0, CY - 1, C[5], 0.3 + 0.3 * b);
  // motes drifting up off it
  cycle(t, meta.duration, 3 + tier * 2, o.seed, (g) => g.range(0.9, 1.6), (age, life, R) => {
    const u = age / life, x = R.range(-rx, rx) + Math.sin(u * 6 + R.range(0, 6)) * 1.5, y = CY - 2 - u * R.range(6, 12);
    const k = Math.sin(u * Math.PI);
    p.dot(x, y, k > 0.7 ? C[6] : C[4], k);
    p.light(x, y, C[4], 0.35 * k);
  });
}
