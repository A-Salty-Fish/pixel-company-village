/**
 * PV-PM-064 — a light sit loop at the path crossing when the plaza stays in view
 * and the player has been idle for more than 6 seconds.
 * Reduced motion stands still on the same spot.
 * Set PLAZA_SIT_ENABLED to false to leave the square empty.
 */

export const PLAZA_SIT_ENABLED = true;
export const PLAZA_IDLE_MS = 6_000;

/** Center of the north-south and mid east-west paths. */
export const PLAZA = { x: 608, y: 656 };

export function plazaInView(
  view: { x: number; y: number; w: number; h: number },
  plaza = PLAZA,
  pad = 24,
) {
  return plaza.x >= view.x - pad && plaza.x <= view.x + view.w + pad && plaza.y >= view.y - pad && plaza.y <= view.y + view.h + pad;
}

export function plazaSitMark(input: {
  idleMs: number;
  near: boolean;
  reduced: boolean;
  enabled?: boolean;
}): "sit" | "stand" | "off" {
  const enabled = input.enabled ?? PLAZA_SIT_ENABLED;
  if (!enabled || !input.near || input.idleMs < PLAZA_IDLE_MS) return "off";
  return input.reduced ? "stand" : "sit";
}

export function plazaSitSprite(mode: "sit" | "stand", t: number) {
  if (mode === "stand") return "cat_lbeige_down_idle_0";
  const frame = ((Math.floor(t * 4) % 8) + 8) % 8;
  return `cat_lbeige_down_sit_${frame}`;
}

export function plazaSitCopy() {
  return [] as string[];
}
