/**
 * PV-PM-064 — a light sit loop when the camera or the player idles near the plaza.
 * Reduced motion stands still. Set PLAZA_SIT_ENABLED to false to leave everyone standing.
 */

export const PLAZA_SIT_ENABLED = true;
export const PLAZA_CENTER = { x: 608, y: 224 };
export const PLAZA_RADIUS = 168;
export const PLAZA_IDLE_MS = 6_000;

export type PlazaPerson = { name: string; x: number; y: number; idle: boolean };

export function pointNearPlaza(point: { x: number; y: number }, radius = PLAZA_RADIUS) {
  const dx = point.x - PLAZA_CENTER.x;
  const dy = point.y - PLAZA_CENTER.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function plazaSitPlan(input: {
  near: boolean;
  idleMs: number;
  reduced: boolean;
  enabled?: boolean;
}): "sit" | "still" | "off" {
  const enabled = input.enabled ?? PLAZA_SIT_ENABLED;
  if (!enabled || !input.near || input.idleMs < PLAZA_IDLE_MS) return "off";
  return input.reduced ? "still" : "sit";
}

export function villagerCanSit(state: string) {
  return state !== "hard_work" && state !== "fishing" && state !== "focused";
}

/** Prefer the chosen self, then the selected person, then a nearby idle villager. */
export function pickPlazaSitter(input: {
  plan: "sit" | "still" | "off";
  selfName: string | null;
  selectedName: string | null;
  people: readonly PlazaPerson[];
}): string | null {
  if (input.plan === "off") return null;
  const near = input.people.filter((person) => pointNearPlaza(person));
  if (input.selfName && near.some((person) => person.name === input.selfName)) return input.selfName;
  if (input.selectedName && near.some((person) => person.name === input.selectedName)) return input.selectedName;
  const idle = near.find((person) => person.idle);
  if (idle) return idle.name;
  return near[0]?.name ?? null;
}
