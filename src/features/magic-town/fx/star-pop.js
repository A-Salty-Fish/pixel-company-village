// 像素公司村 — a gold star spins up over the head, flashes, and rains glitter.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, Rng, WHITE, seg, ease, star } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Star pop",
  size: [80, 88],
  origin: [40, 80],
  duration: 2,
  loop: false,
  fps: 30,
  options: { palette: ["#5a3208", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"], seed: 17 },
};

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const dust = Array.from({ length: 18 }, () => ({ x: R.range(-18, 18), v: R.range(10, 28), d: R.range(0, 0.4), c: Math.min(2, Math.floor(R.range(0, 3))) }));
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const up = ease.outCubic(seg(t, 0, 0.5)), y = -30 - up * 18, fade = 1 - seg(t, 1.1, 1.4);
      const spin = t * 7, r1 = 6 + 2 * Math.sin(t * 12) * (1 - up);
      if (fade > 0) {
        p.poly(star(0, y, r1 * 0.45, r1, 5, -Math.PI / 2 + spin * (1 - up)), C[4], fade);
        p.poly(star(0, y - 1, r1 * 0.25, r1 * 0.55, 5, -Math.PI / 2 + spin * (1 - up)), C[6], fade);
        p.glow(0, y, 16, C[3], 0.45 * fade);
      }
      if (t > 0.5 && t < 0.62) sparkle(p, 0, y, 9, WHITE, C[5], 0.7);
      for (const d of dust) {
        const v = t - 0.55 - d.d;
        if (v < 0) continue;
        const a = 1 - seg(v, 0.6, 1.2);
        if (a <= 0) continue;
        const x = d.x * ease.outCubic(seg(v, 0, 0.3)), yy = y + v * d.v + v * v * 8;
        p.dot(x, yy, v < 0.3 ? WHITE : C[4 + d.c], a);
        p.light(x, yy, C[4], 0.4 * a);
      }
    },
  };
}
