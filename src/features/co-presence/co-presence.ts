/**
 * PV-PM-032 — a few rate-limited co-presence beats. No dialogue, no chat text.
 * Brush-by, sit together, or look at the same lamp or lake.
 * Set CO_PRESENCE_ENABLED to false to leave neighbors still.
 */

export const CO_PRESENCE_ENABLED = true;
export const CO_PRESENCE_FIRST_MS = 45_000;
export const CO_PRESENCE_IDLE_MS = 10 * 60 * 1000;
export const CO_PRESENCE_COOLDOWN_MS = 120_000;

export const CO_LINES = {
  brush: "有人从旁边走过。",
  sit: "有人在旁边坐下。",
  look: "旁边的人也望向同一处。",
} as const;

export type CoPresenceId = keyof typeof CO_LINES;

export type CoPresenceEvent = {
  id: CoPresenceId;
  line: string;
  x: number;
  y: number;
  partner: string | null;
  anim: boolean;
};

const ORDER: CoPresenceId[] = ["brush", "sit", "look"];

export function pickCoPresence(input: {
  enabled?: boolean;
  toggle: boolean;
  idleMs: number;
  sinceLastMs: number;
  nearby: { name: string; x: number; y: number }[];
  self: { x: number; y: number } | null;
  lamp: { x: number; y: number };
  lake: { x: number; y: number };
  salt: number;
  reduced: boolean;
}): CoPresenceEvent | null {
  const enabled = input.enabled ?? CO_PRESENCE_ENABLED;
  if (!enabled || !input.toggle) return null;
  if (input.sinceLastMs < CO_PRESENCE_COOLDOWN_MS) return null;
  if (input.idleMs < CO_PRESENCE_FIRST_MS) return null;
  const id = ORDER[Math.abs(Math.floor(input.salt)) % ORDER.length] ?? "look";
  const other = input.nearby[0] ?? null;
  if (id === "look" || !other) {
    const spot = Math.abs(Math.floor(input.salt)) % 2 === 0 ? input.lamp : input.lake;
    return {
      id: "look",
      line: CO_LINES.look,
      x: spot.x,
      y: spot.y,
      partner: other?.name ?? null,
      anim: !input.reduced,
    };
  }
  return {
    id,
    line: CO_LINES[id],
    x: other.x,
    y: other.y,
    partner: other.name,
    anim: !input.reduced,
  };
}

export function coPresenceCopy() {
  return [CO_LINES.brush, CO_LINES.sit, CO_LINES.look, "相伴"];
}

const TOGGLE_KEY = "village:co-presence-v1";

export function readCoPresenceToggle() {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(TOGGLE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeCoPresenceToggle(on: boolean) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(TOGGLE_KEY, on ? "1" : "0");
  } catch {
    /* this browser only */
  }
}
