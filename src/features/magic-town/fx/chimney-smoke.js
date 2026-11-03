// 像素公司村 — chimney smoke: soft puffs that swell, lean with the breeze and thin out.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, cycle } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Chimney smoke",
  size: [48, 64],
  origin: [12, 60],
  duration: 4,
  loop: true,
  fps: 12,
  options: { palette: ["#3b3742", "#5c5664", "#7b7484", "#a39cab", "#c9c3cf", "#e8e4ec"], seed: 4 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 6);
  cycle(t, meta.duration, 9, o.seed, (g) => g.range(2.4, 3.6), (age, life, R) => {
    const u = age / life, x = u * u * R.range(14, 22) + Math.sin(age * 1.6 + R.range(0, 6)) * 1.5, y = -u * R.range(40, 54);
    const r = 1.5 + u * R.range(3, 5), a = (1 - u) * Math.min(1, u * 6) * 0.6;
    p.disc(x, y, r, u < 0.3 ? C[3] : u < 0.6 ? C[4] : C[5], a);
    p.disc(x - r * 0.3, y - r * 0.3, r * 0.5, C[5], a * 0.6);
  });
}
