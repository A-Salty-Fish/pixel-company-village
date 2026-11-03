// 像素公司村 — tap the ground: a ring of light snaps out and a few stars hop up and settle.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, Rng, TAU, WHITE, seg, ease } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Ground glint",
  size: [64, 48],
  origin: [32, 32],
  duration: 1.1,
  loop: false,
  fps: 30,
  options: { palette: ["#5a3a10", "#a8741e", "#f2c14a", "#ffe58a", "#fff8dc"], seed: 11 },
};

export function create(o) {
  const C = fit(o.palette, 5), R = new Rng(o.seed);
  const stars = Array.from({ length: 6 }, () => ({ a: R.range(0, TAU), s: R.range(10, 20), h: R.range(6, 14) }));
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const u = seg(t, 0, 0.45), k = 1 - seg(t, 0.2, 0.6);
      if (k > 0) p.ellipse(0, 0, 2 + ease.outCubic(u) * 14, 1 + ease.outCubic(u) * 5, C[3], k);
      if (t < 0.1) sparkle(p, 0, -1, 5 * (1 - t / 0.1), WHITE, C[4], 0.6);
      for (const s of stars) {
        const v = seg(t, 0.05, 1.05), x = Math.cos(s.a) * s.s * ease.outCubic(v), y = -Math.sin(v * Math.PI) * s.h + Math.sin(s.a) * 3 * v;
        const a = 1 - seg(t, 0.7, 1.05);
        if (a <= 0) continue;
        p.dot(x, y, v < 0.5 ? WHITE : C[3], a);
        p.light(x, y, C[3], 0.5 * a);
        if (v > 0.3 && v < 0.6) sparkle(p, x, y, 1, C[4], WHITE, 0.3 * a);
      }
    },
  };
}
