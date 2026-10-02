/**
 * PV-PM-079 — one short line on the map after entering.
 * Time of day, and the season when it still fits in twelve characters.
 * No scores and no chat. Set VILLAGE_WELCOME_ENABLED to false to stay quiet.
 */

import { skyWashBand, type SkyBand } from "@/features/sky-wash/sky-wash";

export const VILLAGE_WELCOME_ENABLED = true;
export const WELCOME_DELAY_MS = 400;
export const WELCOME_HOLD_MS = 5_000;
export const WELCOME_MAX_CHARS = 12;

const LINES: Record<SkyBand, Record<string, string>> = {
  dawn: {
    default: "早啊，田还凉",
    spring: "春天的露水",
    summer: "早啊，天已热",
    autumn: "早啊，叶还潮",
    winter: "早啊，田还冷",
  },
  day: {
    default: "村里正热闹",
    spring: "春田正热闹",
    summer: "日头正热闹",
    autumn: "秋田正热闹",
    winter: "冬日也热闹",
  },
  dusk: {
    default: "灯要亮了",
    spring: "傍晚收工啦",
    summer: "日头要下去",
    autumn: "灯笼该亮了",
    winter: "天色暗下来",
  },
  night: {
    default: "夜里也在",
    spring: "春夜也在",
    summer: "夏夜也在",
    autumn: "秋夜也在",
    winter: "冬夜也在",
  },
};

export function welcomeOn(enabled = VILLAGE_WELCOME_ENABLED) {
  return enabled;
}

export function welcomeLine(hour: number, seasonId = "", enabled = VILLAGE_WELCOME_ENABLED) {
  if (!enabled) return "";
  const band = skyWashBand(hour);
  const table = LINES[band];
  const line = table[seasonId] ?? table.default;
  return line ?? table.default ?? "";
}

export function welcomeVisible(input: { elapsedMs: number; dismissed: boolean; enabled?: boolean }) {
  const enabled = input.enabled ?? VILLAGE_WELCOME_ENABLED;
  if (!enabled || input.dismissed) return false;
  if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < WELCOME_DELAY_MS) return false;
  return input.elapsedMs < WELCOME_DELAY_MS + WELCOME_HOLD_MS;
}

export function welcomeCopy() {
  const lines = new Set<string>();
  for (const table of Object.values(LINES)) {
    for (const line of Object.values(table)) lines.add(line);
  }
  return [...lines];
}
