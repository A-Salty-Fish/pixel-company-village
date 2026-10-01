/**
 * PV-PM-031 — quiet nameplates stop clipping and stacking.
 * Priority is self, then pinned, then neighbor, then scored.
 * Far plates fade. The near set never passes eight, including self.
 * Set NAMEPLATE_CLEAR_ENABLED to false to skip separation.
 */

export const NAMEPLATE_CLEAR_ENABLED = true;
export const NEAR_PLATE_CAP = 8;

export type PlateRole = "self" | "pinned" | "neighbor" | "scored" | "other";

export type ClearInput = {
  id: string;
  role: PlateRole;
  x: number;
  y: number;
  w: number;
  h: number;
  dist: number;
};

export type ClearPlace = {
  draw: boolean;
  alpha: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

const ROLE_RANK: Record<PlateRole, number> = {
  self: 0,
  pinned: 1,
  neighbor: 2,
  scored: 3,
  other: 4,
};

export function plateRoleRank(role: PlateRole) {
  return ROLE_RANK[role];
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function distanceAlpha(dist: number, role: PlateRole) {
  if (role === "self" || role === "pinned") return 1;
  const t = Math.min(1, Math.max(0, dist) / 280);
  return Math.max(0.34, 1 - t * 0.66);
}

function fitInside(
  box: { x: number; y: number; w: number; h: number },
  viewW: number,
  viewH: number,
) {
  if (box.w <= 0 || box.h <= 0 || box.w > viewW - 4 || box.h > viewH - 4) return null;
  const clipX = (box.x < 0 ? -box.x : 0) + (box.x + box.w > viewW ? box.x + box.w - viewW : 0);
  const clipY = (box.y < 0 ? -box.y : 0) + (box.y + box.h > viewH ? box.y + box.h - viewH : 0);
  const clip = (clipX * box.h + clipY * box.w) / Math.max(1, box.w * box.h);
  if (clip > 0.45) return null;
  let x = box.x;
  let y = box.y;
  if (x < 2) x = 2;
  if (y < 2) y = 2;
  if (x + box.w > viewW - 2) x = viewW - 2 - box.w;
  if (y + box.h > viewH - 2) y = viewH - 2 - box.h;
  if (x < 2 || y < 2) return null;
  return { x, y, w: box.w, h: box.h, fade: clip > 0.02 ? 0.72 : 1 };
}

export function layoutClearPlates(
  plates: ClearInput[],
  options: { cap?: number; viewW: number; viewH: number; enabled?: boolean; gap?: number },
): Map<string, ClearPlace> {
  const enabled = options.enabled ?? NAMEPLATE_CLEAR_ENABLED;
  const cap = options.cap ?? NEAR_PLATE_CAP;
  const gap = options.gap ?? 3;
  const out = new Map<string, ClearPlace>();
  if (!enabled) {
    for (const plate of plates) {
      out.set(plate.id, { draw: true, alpha: 1, x: plate.x, y: plate.y, w: plate.w, h: plate.h });
    }
    return out;
  }
  const ordered = [...plates].sort((a, b) => {
    const rank = plateRoleRank(a.role) - plateRoleRank(b.role);
    if (rank !== 0) return rank;
    if (a.dist !== b.dist) return a.dist - b.dist;
    return a.id.localeCompare(b.id, "zh");
  });
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  for (const plate of ordered) {
    if (placed.length >= cap) {
      out.set(plate.id, { draw: false, alpha: 0, x: plate.x, y: plate.y, w: plate.w, h: plate.h });
      continue;
    }
    const fitted = fitInside(plate, options.viewW, options.viewH);
    if (!fitted) {
      out.set(plate.id, { draw: false, alpha: 0, x: plate.x, y: plate.y, w: plate.w, h: plate.h });
      continue;
    }
    let box = { x: fitted.x, y: fitted.y, w: fitted.w, h: fitted.h };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const hit = placed.find((other) => overlaps(box, other));
      if (!hit) break;
      const optionsBox = [
        { ...box, y: hit.y + hit.h + gap },
        { ...box, y: hit.y - box.h - gap },
        { ...box, x: hit.x + hit.w + gap },
        { ...box, x: hit.x - box.w - gap },
      ];
      let moved: { x: number; y: number; w: number; h: number } | null = null;
      for (const option of optionsBox) {
        const again = fitInside(option, options.viewW, options.viewH);
        if (!again) continue;
        const next = { x: again.x, y: again.y, w: again.w, h: again.h };
        if (!overlaps(next, hit)) {
          moved = next;
          break;
        }
      }
      if (!moved) break;
      box = moved;
    }
    if (placed.some((other) => overlaps(box, other))) {
      out.set(plate.id, { draw: false, alpha: 0, x: plate.x, y: plate.y, w: plate.w, h: plate.h });
      continue;
    }
    placed.push(box);
    out.set(plate.id, {
      draw: true,
      alpha: distanceAlpha(plate.dist, plate.role) * fitted.fade,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    });
  }
  return out;
}
