// 像素公司村 — not scored yet: one quiet star drifts over the head and blinks slowly.
// Written for the village against the pixelfx core contract (src/vendor/pixelfx, MIT).
import { fit, sparkle, TAU, WHITE } from "../../../vendor/pixelfx/core/index.js";

export const meta = {
  name: "Sleepy sparkle",
  size: [24, 24],
  origin: [12, 22],
  duration: 4,
  loop: true,
  fps: 12,
  options: { palette: ["#2b2f4a", "#4d5480", "#8a93c8", "#c8d0f4", "#ffffff"], seed: 2 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), ph = (t / meta.duration) * TAU;
  const x = Math.sin(ph) * 4, y = -14 + Math.cos(ph * 2) * 1.5, k = 0.45 + 0.35 * Math.sin(ph * 2 + 1);
  p.glow(x, y, 5, C[2], 0.18 * k);
  sparkle(p, x, y, k > 0.7 ? 2 : 1, C[3], WHITE, 0.25 * k);
  p.dot(x, y, k > 0.6 ? WHITE : C[3], Math.min(1, k + 0.2));
  // a second fainter speck lagging behind
  const x2 = Math.sin(ph - 1.2) * 4, y2 = -14 + Math.cos(ph * 2 - 2.4) * 1.5;
  p.dot(x2, y2 + 2, C[2], 0.5 * k);
}
