/** Shared kindness and wave rules. No chat text, no free-form notes. */

export const KINDNESS_ACTIONS = ["seed", "coffee", "rod", "water"] as const;
export type KindnessAction = (typeof KINDNESS_ACTIONS)[number];

export const HISTORY_WINDOW_DAYS = 30;

export type KindnessEntry = {
  days: string[];
  weekCounts: Record<string, number>;
};

export type ClockStamp = {
  ymd: string;
  weekKey: string;
  sunday: boolean;
};

export type KindnessView = {
  usedToday: boolean;
  weekCount: number;
  canSend: boolean;
  sundayBonus: boolean;
};

const TODAY_LINE = "今天已经关照过这位同事了。";
const WEEK_LINE = "这周两次关照都用过了。";

export function isKindnessAction(value: string): value is KindnessAction {
  return (KINDNESS_ACTIONS as readonly string[]).includes(value);
}

export function kindnessView(entry: KindnessEntry | undefined, clock: ClockStamp): KindnessView {
  const usedToday = Boolean(entry?.days.includes(clock.ymd));
  const weekCount = entry?.weekCounts[clock.weekKey] ?? 0;
  return {
    usedToday,
    weekCount,
    canSend: !usedToday && weekCount < 2,
    sundayBonus: clock.sunday && weekCount >= 2,
  };
}

export function undoKindness(entry: KindnessEntry | undefined, clock: ClockStamp): KindnessEntry | null {
  if (!entry?.days.includes(clock.ymd)) return null;
  const weekCounts = { ...entry.weekCounts };
  weekCounts[clock.weekKey] = Math.max(0, (weekCounts[clock.weekKey] ?? 1) - 1);
  return {
    days: entry.days.filter((day) => day !== clock.ymd),
    weekCounts,
  };
}

export function commitKindness(
  entry: KindnessEntry | undefined,
  clock: ClockStamp,
): { ok: true; entry: KindnessEntry; sundayBonus: boolean; weekCount: number } | { ok: false; line: string } {
  const status = kindnessView(entry, clock);
  if (!status.canSend) {
    return { ok: false, line: status.usedToday ? TODAY_LINE : WEEK_LINE };
  }
  const cutoff = shiftYmd(clock.ymd, -21);
  const next: KindnessEntry = {
    days: [...(entry?.days.filter((day) => day >= cutoff) ?? []), clock.ymd],
    weekCounts: { ...(entry?.weekCounts ?? {}) },
  };
  next.weekCounts[clock.weekKey] = (next.weekCounts[clock.weekKey] ?? 0) + 1;
  const weekCount = next.weekCounts[clock.weekKey];
  return {
    ok: true,
    entry: next,
    weekCount,
    sundayBonus: clock.sunday && weekCount >= 2,
  };
}

export function waveView(last: number | undefined, now: number) {
  const elapsed = last ? now - last : Number.POSITIVE_INFINITY;
  const allowed = elapsed >= 60 * 60 * 1000;
  const retryAfterMin = allowed ? 0 : Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000));
  return { allowed, retryAfterMin };
}

export function waveExhaustedLine(retryAfterMin: number) {
  if (retryAfterMin > 0) return `这一小时已经挥过手了。大约还要 ${retryAfterMin} 分钟。`;
  return "这一小时已经挥过手了。";
}

export function shiftYmd(ymd: string, deltaDays: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function windowDates(endYmd: string, days = HISTORY_WINDOW_DAYS) {
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    dates.push(shiftYmd(endYmd, -offset));
  }
  return dates;
}
