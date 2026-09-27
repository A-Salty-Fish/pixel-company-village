import { windowDates, HISTORY_WINDOW_DAYS, shiftYmd } from "@/lib/quota-rules";
import type { ScorePayload, VillagePerson } from "@/lib/types";

export type HistoryPoint = {
  name: string;
  scored: boolean;
  work: number | null;
  fish: number | null;
  on_task: number | null;
  msgs: number | null;
};

export type HistoryBook = Record<string, HistoryPoint[]>;

export type HistoryDay = {
  date: string;
  present: boolean;
  scored: boolean | null;
  work: number | null;
  fish: number | null;
  on_task: number | null;
  msgs: number | null;
};

export function snapshotPeople(people: VillagePerson[]): HistoryPoint[] {
  return people.map((person) => {
    if (!person.scored) {
      return { name: person.name, scored: false, work: null, fish: null, on_task: null, msgs: null };
    }
    return {
      name: person.name,
      scored: true,
      work: person.work,
      fish: person.fish,
      on_task: person.on_task,
      msgs: person.msgs,
    };
  });
}

export function mergeHistoryDay(book: HistoryBook, payload: ScorePayload): HistoryBook {
  const next: HistoryBook = { ...book, [payload.date]: snapshotPeople(payload.people) };
  const end = Object.keys(next).sort().at(-1) ?? payload.date;
  const start = shiftYmd(end, -(HISTORY_WINDOW_DAYS - 1));
  const trimmed: HistoryBook = {};
  for (const [date, points] of Object.entries(next)) {
    if (date >= start && date <= end) trimmed[date] = points;
  }
  return trimmed;
}

export function personHistory(book: HistoryBook, name: string, endYmd: string): HistoryDay[] {
  return windowDates(endYmd).map((date) => {
    const point = book[date]?.find((row) => row.name === name);
    if (!point) {
      return { date, present: false, scored: null, work: null, fish: null, on_task: null, msgs: null };
    }
    return {
      date,
      present: true,
      scored: point.scored,
      work: point.work,
      fish: point.fish,
      on_task: point.on_task,
      msgs: point.msgs,
    };
  });
}

export function historyEndDate(book: HistoryBook, today: string) {
  const newest = Object.keys(book).sort().at(-1);
  if (!newest) return today;
  return newest > today ? newest : today;
}
