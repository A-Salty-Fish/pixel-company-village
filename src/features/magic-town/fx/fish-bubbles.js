// 像素公司村 — a fish-loving farmer: bubbles wobble up and a little fish hops out of a ring of ripple.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, cycle, TAU, WHITE } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Fish bubbles",
  size: [44, 44],
  origin: [22, 40],
  duration: 3.2,
  loop: true,
  fps: 12,
  options: { palette: ["#0b2440", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"], fish: ["#a2401c", "#e8782a", "#ffb460", "#ffe0a8"], seed: 7, tier: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), F = fit(o.fish, 4), tier = o.tier ?? 1, T = meta.duration;
  // bubbles from beside the feet, swelling as they rise
  cycle(t, T, 4 + tier * 2, o.seed, (g) => g.range(1.2, 2), (age, life, R) => {
    const u = age / life, x = R.range(-12, 12) + Math.sin(age * 5 + R.range(0, TAU)) * 1.4, y = -6 - u * R.range(14, 24);
    const r = 0.6 + u * (0.6 + tier * 0.45), k = Math.sin(Math.min(1, u * 1.2) * Math.PI);
    if (r < 1.2) {
      p.dot(x, y, C[5], k);
    } else {
      p.ring(x, y, r, 1, C[4], 0.85 * k);
      p.dot(x - 0.6, y - 0.6, WHITE, k);
    }
    p.light(x, y, C[3], 0.18 * k);
    if (u > 0.92) p.dot(x, y, WHITE, 1);
  });
  // a fish leaps once a loop: arc up and back down beside the farmer
  const L = (t % T) / T;
  if (L > 0.35 && L < 0.75) {
    const u = (L - 0.35) / 0.4, x = 6 + u * 10, y = -4 - Math.sin(u * Math.PI) * 14, tilt = Math.cos(u * Math.PI);
    p.dot(x, y, F[2]); p.dot(x - 1, y + Math.round(tilt), F[1]); p.dot(x + 1, y - Math.round(tilt), F[3]);
    p.dot(x - 2, y + Math.round(tilt * 2), F[0]);
    p.light(x, y, F[2], 0.25);
    if (u < 0.12 || u > 0.88) {
      const sx = u < 0.5 ? 6 : 16;
      p.ellipse(sx, -3, 3, 1, C[4], 0.8);
    }
  }
}
