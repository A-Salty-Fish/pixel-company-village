// 像素公司村 — a heart pops out over the head, bobs once and bursts into small hearts.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, Rng, WHITE, seg, ease } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Heart pop",
  size: [72, 72],
  origin: [36, 64],
  duration: 1.8,
  loop: false,
  fps: 30,
  options: { palette: ["#4a0f24", "#8c1d3c", "#d8355a", "#ff6f8a", "#ffb0c0", "#ffffff"], seed: 13 },
};

const HEART = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];

function heart(p, x, y, s, C, a) {
  for (let j = 0; j < HEART.length; j++)
    for (let i = 0; i < HEART[j].length; i++) {
      if (HEART[j][i] !== "#") continue;
      const c = j === 1 && i === 1 ? C[5] : j < 2 ? C[3] : j < 4 ? C[2] : C[1];
      for (let q = 0; q < s; q++) for (let r = 0; r < s; r++) p.dot(x + (i - 3) * s + q, y + (j - 3) * s + r, c, a);
    }
}

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed);
  const bits = Array.from({ length: 7 }, () => ({ a: R.range(-Math.PI, 0), s: R.range(14, 24) }));
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const rise = ease.outBack(seg(t, 0, 0.35)), y = -36 - rise * 8 + Math.sin(t * 9) * (1 - seg(t, 0.3, 0.9));
      if (t < 0.95) {
        heart(p, 0, y, t < 0.12 ? 1 : 2, C, 1);
        p.glow(0, y, 14, C[3], 0.35);
      }
      if (t < 0.08) sparkle(p, 0, -36, 6, WHITE, C[4], 0.6);
      if (t >= 0.95) {
        const v = seg(t, 0.95, 1.8);
        if (v < 0.15) sparkle(p, 0, y, 7, WHITE, C[4], 0.6);
        for (const b of bits) {
          const x = Math.cos(b.a) * b.s * ease.outCubic(v), yy = y + Math.sin(b.a) * b.s * ease.outCubic(v) + v * v * 10;
          heart(p, x, yy, 1, C, 1 - v);
          p.light(x, yy, C[3], 0.3 * (1 - v));
        }
      }
    },
  };
}
