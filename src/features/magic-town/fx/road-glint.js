// 像素公司村 — the road catches a little starlight: specks that wink on in turn along a stretch of path.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, cycle, WHITE } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Road glint",
  size: [96, 20],
  origin: [48, 10],
  duration: 5,
  loop: true,
  fps: 12,
  options: { palette: ["#6a4a20", "#c89a3c", "#f5d27a", "#fff2c4"], seed: 9, along: "x" },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 4), vertical = o.along === "y";
  cycle(t, meta.duration, 7, o.seed, (g) => g.range(0.5, 1.1), (age, life, R) => {
    const u = age / life, k = Math.sin(u * Math.PI), a = R.range(-44, 44), b = R.range(-5, 5);
    const x = vertical ? b : a, y = vertical ? a : b;
    if (k > 0.75) sparkle(p, x, y, 1 + Math.round(R.range(0, 1.4)), C[3], WHITE, 0.4 * k);
    p.dot(x, y, k > 0.6 ? WHITE : C[2], k);
    p.light(x, y, C[2], 0.4 * k);
  });
}
