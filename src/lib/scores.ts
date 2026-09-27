import { loadSeedDocument } from "@/lib/operator-data";
import {
  ALLOWED_TAGS,
  type AllowedTag,
  type PersonScore,
  type ScorePayload,
  type VillagePerson,
} from "@/lib/types";
import {
  isSafeName,
  MAX_BODY_BYTES,
  MAX_PEOPLE,
  MAX_STRING,
  payloadByteLength,
  rejectPrivateOrHuge,
} from "@/lib/privacy";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_DISCLAIMER = "代理信号≠绩效；摸鱼分是趣味雷达";

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pickNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    if (key in record) {
      const n = asFiniteNumber(record[key]);
      if (n !== null) return n;
    }
  }
  return null;
}

function normalizeTags(record: Record<string, unknown>): AllowedTag[] | undefined {
  const tags = new Set<AllowedTag>();
  const raw = record.tags;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && (ALLOWED_TAGS as readonly string[]).includes(item)) {
        tags.add(item as AllowedTag);
      }
    }
  }
  if (record.mostly_on_task === true) {
    tags.add("mostly_on_task");
  }
  return tags.size ? [...tags] : undefined;
}

function hasRadar(work: number, fish: number, onTask: number) {
  return work !== 0 || fish !== 0 || onTask !== 0;
}

function normalizePerson(raw: unknown): VillagePerson | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.name !== "string" || !isSafeName(record.name.trim())) {
    return null;
  }
  const name = record.name.trim();
  if (record.scored === false) return { name, scored: false };

  const msgs = pickNumber(record, ["msgs", "msg_count"]);
  const work = pickNumber(record, ["work", "work_signal"]);
  let onTask = pickNumber(record, ["on_task"]);
  const fish = pickNumber(record, ["fish", "fish_signal"]);
  const mostly = record.mostly_on_task;

  if (onTask === null && typeof mostly === "number") {
    onTask = mostly;
  } else if (onTask === null && typeof mostly === "boolean") {
    onTask = mostly ? 0.85 : 0.35;
  }

  if (msgs === null || work === null || fish === null || onTask === null) {
    return { name, scored: false };
  }
  const workN = clamp(work, 0, 5);
  const fishN = clamp(fish, 0, 5);
  const onTaskN = clamp(onTask, 0, 1);
  if (!hasRadar(workN, fishN, onTaskN)) {
    return { name, scored: false };
  }

  const person: PersonScore = {
    name,
    scored: true,
    msgs: Math.round(clamp(msgs, 0, 100_000)),
    work: workN,
    fish: fishN,
    on_task: onTaskN,
  };
  const tags = normalizeTags(record);
  if (tags) person.tags = tags;
  return person;
}

export function sanitizePayload(input: unknown):
  | { ok: true; payload: ScorePayload }
  | { ok: false; error: string } {
  if (payloadByteLength(input) > MAX_BODY_BYTES) {
    return { ok: false, error: "payload_too_large" };
  }
  const privacy = rejectPrivateOrHuge(input);
  if (privacy) {
    return { ok: false, error: privacy };
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_shape" };
  }

  const record = input as Record<string, unknown>;
  if (typeof record.date !== "string" || !DATE_RE.test(record.date)) {
    return { ok: false, error: "invalid_date" };
  }
  if (!Array.isArray(record.people) || record.people.length === 0) {
    return { ok: false, error: "people_required" };
  }
  if (record.people.length > MAX_PEOPLE) {
    return { ok: false, error: "too_many_people" };
  }

  const people: VillagePerson[] = [];
  for (const row of record.people) {
    const person = normalizePerson(row);
    if (!person) return { ok: false, error: "invalid_person" };
    people.push(person);
  }

  let disclaimer = DEFAULT_DISCLAIMER;
  if (typeof record.disclaimer === "string" && record.disclaimer.trim()) {
    if (record.disclaimer.length > MAX_STRING) {
      return { ok: false, error: "disclaimer_too_long" };
    }
    disclaimer = record.disclaimer.trim();
  }

  return {
    ok: true,
    payload: {
      date: record.date,
      people,
      disclaimer,
    },
  };
}

export function seedPayload(): ScorePayload {
  const sanitized = sanitizePayload(loadSeedDocument());
  if (!sanitized.ok) {
    return {
      date: "1970-01-01",
      people: [],
      disclaimer: DEFAULT_DISCLAIMER,
    };
  }
  return sanitized.payload;
}

export function publicScoreView(payload: ScorePayload): ScorePayload {
  return {
    date: payload.date,
    disclaimer: payload.disclaimer,
    people: payload.people.map((person) => {
      const radar = person as Partial<PersonScore>;
      const looksScored =
        person.scored !== false &&
        typeof radar.work === "number" &&
        typeof radar.fish === "number" &&
        typeof radar.on_task === "number" &&
        typeof radar.msgs === "number" &&
        (radar.work !== 0 || radar.fish !== 0 || radar.on_task !== 0);
      if (!looksScored) {
        return { name: person.name, scored: false as const, ...(person.plot !== undefined ? { plot: person.plot } : {}) };
      }
      const scored = person as PersonScore;
      const row: PersonScore = {
        name: scored.name,
        scored: true,
        msgs: scored.msgs,
        work: scored.work,
        fish: scored.fish,
        on_task: scored.on_task,
      };
      if (scored.tags?.length) row.tags = scored.tags;
      if (scored.plot !== undefined) row.plot = scored.plot;
      return row;
    }),
  };
}
