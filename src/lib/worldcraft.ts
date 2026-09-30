/**
 * World-facing craft for nameplates, finished chores, proximity, and landmarks.
 * Pixels and canned labels only. No chat text.
 */

export type Pixel = { x: number; y: number; w: number; h: number; color: string };

export const PLATE_LOUD_ZOOM = 2;
export const PLATE_QUIET_ZOOM = 3;
export const PLATE_CAP = 8;
export const PLATE_QUIET_CAP = 4;
export const FIND_ME_HOLD_MS = 1600;
export const NOD_REACH = 96;
export const PORCH_REACH = 88;

export const PLATE_QUIET_LINE = "安静时远景收起名牌";
export const PLATE_LOUD_LINE = "远景先收起名牌";
export const FIND_ME_LABEL = "找我";

export const CHORE_STEPS = [
  { x: 480, y: 520 },
  { x: 540, y: 500 },
  { x: 600, y: 530 },
] as const;

export const GATE_POST = { x: 88, y: 128 };
export const POND_POST = { x: 96, y: 64 };
export const BENCH_POST = { x: 640, y: 420 };

/**
 * A plate shows when it is in the picked set, or when 「全显名牌」 is on.
 * Zoom alone does not uncover the rest of the village.
 */
export function showNameplate(_zoom: number, hot: boolean, showAll: boolean, _quiet: boolean) {
  return hot || showAll;
}

export type PlateSpot = { name: string; x: number; y: number };

/** Default panorama: self, then pins, then nearby people, never more than the cap. Quiet skips neighbors. */
export function selectPanoramaPlates(input: {
  people: PlateSpot[];
  selfName: string | null;
  pins: string[];
  hot: string[];
  showAll: boolean;
  quiet: boolean;
  reach?: number;
}) {
  if (input.showAll) return input.people.map((person) => person.name);
  const cap = input.quiet ? PLATE_QUIET_CAP : PLATE_CAP;
  const known = new Set(input.people.map((person) => person.name));
  const chosen: string[] = [];
  const add = (name: string | null | undefined) => {
    if (!name || chosen.includes(name) || !known.has(name) || chosen.length >= cap) return;
    chosen.push(name);
  };
  add(input.selfName);
  for (const name of input.hot) add(name);
  for (const name of input.pins) add(name);
  if (!input.quiet && input.selfName && known.has(input.selfName)) {
    const self = input.people.find((person) => person.name === input.selfName);
    if (self) {
      const reach = input.reach ?? NOD_REACH;
      const reach2 = reach * reach;
      const neighbors = input.people
        .filter((person) => person.name !== self.name)
        .map((person) => {
          const dx = person.x - self.x;
          const dy = person.y - self.y;
          return { name: person.name, dist: dx * dx + dy * dy };
        })
        .filter((person) => person.dist <= reach2)
        .sort((a, b) => a.dist - b.dist);
      for (const neighbor of neighbors) add(neighbor.name);
    }
  }
  return chosen;
}

export function plateLegend(quiet: boolean) {
  return quiet ? PLATE_QUIET_LINE : PLATE_LOUD_LINE;
}

export function chorePixels(input: { steps: number; watered: boolean; ribbon: boolean }): Pixel[] {
  const pixels: Pixel[] = [];
  const steps = Math.max(0, Math.min(CHORE_STEPS.length, Math.floor(input.steps)));
  for (let i = 0; i < steps; i += 1) {
    const step = CHORE_STEPS[i];
    pixels.push(
      { x: step.x - 4, y: step.y - 1, w: 5, h: 3, color: "#3a2412" },
      { x: step.x + 3, y: step.y + 2, w: 5, h: 3, color: "#5a3a1c" },
      { x: step.x - 1, y: step.y + 1, w: 2, h: 1, color: "#efe6d6" },
    );
  }
  if (input.watered) {
    pixels.push(
      { x: 416, y: 548, w: 8, h: 6, color: "#3a8fbc" },
      { x: 418, y: 544, w: 4, h: 4, color: "#d5e4ef" },
      { x: 424, y: 550, w: 4, h: 2, color: "#fff6d8" },
      { x: 412, y: 556, w: 2, h: 10, color: "#6a3d18" },
      { x: 408, y: 552, w: 8, h: 3, color: "#c4a060" },
    );
  }
  if (input.ribbon) {
    pixels.push(
      { x: GATE_POST.x, y: GATE_POST.y - 28, w: 2, h: 22, color: "#6a3d18" },
      { x: GATE_POST.x + 2, y: GATE_POST.y - 26, w: 16, h: 8, color: "#c44b3a" },
      { x: GATE_POST.x + 2, y: GATE_POST.y - 22, w: 16, h: 2, color: "#f4d7a1" },
      { x: GATE_POST.x + 18, y: GATE_POST.y - 20, w: 4, h: 6, color: "#8a2020" },
      { x: GATE_POST.x + 8, y: GATE_POST.y - 32, w: 6, h: 4, color: "#f2d15c" },
    );
  }
  return pixels;
}

export function proximityNods(
  self: { name: string; x: number; y: number } | null,
  others: { name: string; x: number; y: number }[],
  reach = NOD_REACH,
) {
  if (!self) return [];
  const reach2 = reach * reach;
  const names: string[] = [];
  for (const other of others) {
    if (other.name === self.name) continue;
    const dx = other.x - self.x;
    const dy = other.y - self.y;
    if (dx * dx + dy * dy <= reach2) names.push(other.name);
  }
  return names;
}

export function nearPorch(
  person: { x: number; y: number },
  home: { x: number; y: number },
  reach = PORCH_REACH,
) {
  const dx = person.x - home.x;
  const dy = person.y - home.y;
  return dx * dx + dy * dy <= reach * reach;
}

export function benchPose(sit: { x: number; y: number }) {
  return { x: sit.x, y: sit.y + 8 };
}

export function benchFrame(sit: { x: number; y: number }): { back: Pixel[]; seat: Pixel[] } {
  const x = sit.x;
  const y = sit.y;
  return {
    back: [
      { x: x - 14, y: y - 16, w: 28, h: 4, color: "#5a3214" },
      { x: x - 14, y: y - 12, w: 3, h: 10, color: "#6a3d18" },
      { x: x + 11, y: y - 12, w: 3, h: 10, color: "#6a3d18" },
    ],
    seat: [
      { x: x - 14, y: y + 2, w: 28, h: 4, color: "#8a5528" },
      { x: x - 12, y: y + 6, w: 3, h: 5, color: "#6a3d18" },
      { x: x + 9, y: y + 6, w: 3, h: 5, color: "#6a3d18" },
    ],
  };
}

export function porchPixels(near: boolean, lampOn: boolean, reduced: boolean, t: number): Pixel[] {
  if (!near && !lampOn) return [];
  const flicker = lampOn && !reduced && Math.floor(t * 2) % 5 === 0;
  const glow = lampOn ? (flicker ? "#fff6d8" : "#f2d15c") : "#c4a060";
  return [
    { x: -8, y: -22, w: 3, h: 14, color: "#6a3d18" },
    { x: -12, y: -26, w: 11, h: 6, color: "#5a3214" },
    { x: -10, y: -24, w: 7, h: 3, color: glow },
  ];
}

export function landmarkPixels(home: { x: number; y: number } | null): Pixel[] {
  const pixels: Pixel[] = [
    { x: POND_POST.x, y: POND_POST.y, w: 3, h: 16, color: "#6a3d18" },
    { x: POND_POST.x - 6, y: POND_POST.y - 8, w: 14, h: 8, color: "#3a8fbc" },
    { x: POND_POST.x - 3, y: POND_POST.y - 6, w: 6, h: 3, color: "#d5e4ef" },
    { x: GATE_POST.x - 8, y: GATE_POST.y, w: 4, h: 18, color: "#8a8478" },
    { x: GATE_POST.x + 10, y: GATE_POST.y, w: 4, h: 18, color: "#8a8478" },
    { x: GATE_POST.x - 8, y: GATE_POST.y - 2, w: 22, h: 4, color: "#c4a060" },
    { x: BENCH_POST.x - 16, y: BENCH_POST.y - 18, w: 3, h: 14, color: "#6a3d18" },
    { x: BENCH_POST.x - 14, y: BENCH_POST.y - 18, w: 12, h: 8, color: "#f4d7a1" },
    { x: BENCH_POST.x - 12, y: BENCH_POST.y - 15, w: 8, h: 2, color: "#6a3d18" },
  ];
  if (home) {
    pixels.push(
      { x: home.x + 4, y: home.y - 18, w: 14, h: 8, color: "#c44b3a" },
      { x: home.x + 6, y: home.y - 12, w: 10, h: 8, color: "#f4d7a1" },
      { x: home.x + 9, y: home.y - 22, w: 4, h: 4, color: "#f2d15c" },
    );
  }
  return pixels;
}

export function findMeRing(x: number, y: number, reduced: boolean, t: number): Pixel[] {
  const pulse = reduced ? 0 : Math.floor(t) % 2;
  const arm = 8 + pulse * 2;
  const color = "#fff6d8";
  return [
    { x: x - arm, y: y - 28, w: 4, h: 2, color },
    { x: x + arm - 4, y: y - 28, w: 4, h: 2, color },
    { x: x - arm, y: y - 4, w: 4, h: 2, color },
    { x: x + arm - 4, y: y - 4, w: 4, h: 2, color },
  ];
}
