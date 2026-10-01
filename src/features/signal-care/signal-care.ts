/**
 * PV-PM-036 — signal card shows care count, bond count, and the last care date.
 * Dates only. The line is canned. Chat text is dropped, never shown.
 * Set SIGNAL_CARE_ENABLED to false to hide the block.
 */

export const SIGNAL_CARE_ENABLED = true;
export const SIGNAL_CARE_LINE = "只记次数和日期，不写说过的话。";
export const SIGNAL_CARE_EMPTY = "上次关照还没有日期。";

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export type SignalCareView = {
  careCount: number;
  bondCount: number;
  lastDate: string | null;
  line: string;
};

function careDateLabel(iso: string) {
  const match = YMD.exec(iso);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

/** Counts and one date. Anything that is not a calendar day is ignored. */
export function signalCareView(input: {
  days: readonly string[];
  bondCount: number;
  enabled?: boolean;
}): SignalCareView | null {
  if (input.enabled === false || (input.enabled == null && !SIGNAL_CARE_ENABLED)) return null;
  const unique = [...new Set(input.days.filter((day) => YMD.test(day)))].sort();
  const last = unique.length > 0 ? careDateLabel(unique[unique.length - 1] ?? "") : null;
  const bond = Number.isFinite(input.bondCount) ? Math.floor(input.bondCount) : 0;
  return {
    careCount: unique.length,
    bondCount: Math.max(0, Math.min(6, bond)),
    lastDate: last,
    line: SIGNAL_CARE_LINE,
  };
}

export function signalCareCopy(view: SignalCareView | null = signalCareView({ days: [], bondCount: 0 })) {
  if (!view) return [];
  const dateLine = view.lastDate ? `上次关照 ${view.lastDate}` : SIGNAL_CARE_EMPTY;
  return [`关照 ${view.careCount}`, `熟识 ${view.bondCount}`, dateLine, view.line];
}
