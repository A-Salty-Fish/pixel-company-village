import { VILLAGE_CAPACITY } from "@/lib/capacity";
import { loadRosterDocument } from "@/lib/operator-data";
import { isSafeName } from "@/lib/privacy";
import type { PersonScore, ScorePayload, VillagePerson } from "@/lib/types";

export { VILLAGE_CAPACITY };

type RosterFile = {
  names?: string[];
  display_names?: string[];
  all_display_names?: string[];
  scored_names?: string[];
  placeholder_names?: string[];
  all?: Array<{ name?: string }>;
};

function pushUnique(target: string[], seen: Set<string>, raw: unknown) {
  if (typeof raw !== "string") return;
  const name = raw.trim();
  if (!isSafeName(name) || seen.has(name)) return;
  seen.add(name);
  target.push(name);
}

export function rosterDisplayNames(): string[] {
  const file = loadRosterDocument() as RosterFile;
  const names: string[] = [];
  const seen = new Set<string>();
  const preferred = file.all_display_names ?? file.display_names ?? file.names;
  if (preferred?.length) {
    for (const n of preferred) pushUnique(names, seen, n);
    return names;
  }
  for (const n of file.scored_names ?? []) pushUnique(names, seen, n);
  for (const n of file.placeholder_names ?? []) pushUnique(names, seen, n);
  for (const row of file.all ?? []) pushUnique(names, seen, row?.name);
  return names;
}

function hasRadar(person: { work?: number; fish?: number; on_task?: number }) {
  return (person.work ?? 0) !== 0 || (person.fish ?? 0) !== 0 || (person.on_task ?? 0) !== 0;
}

function asScored(person: VillagePerson): PersonScore | null {
  if (person.scored === false) return null;
  if (
    typeof person.msgs !== "number" ||
    typeof person.work !== "number" ||
    typeof person.fish !== "number" ||
    typeof person.on_task !== "number"
  ) {
    return null;
  }
  if (!hasRadar(person)) return null;
  return {
    name: person.name,
    scored: true,
    msgs: person.msgs,
    work: person.work,
    fish: person.fish,
    on_task: person.on_task,
    ...(person.tags?.length ? { tags: person.tags } : {}),
  };
}

export function mergeVillagePeople(payload: ScorePayload): ScorePayload {
  const roster = rosterDisplayNames();
  const scoreMap = new Map<string, PersonScore>();
  for (const row of payload.people) {
    const scored = asScored(row);
    if (scored) scoreMap.set(scored.name, scored);
  }

  const people: VillagePerson[] = [];
  const used = new Set<string>();

  for (const name of roster) {
    const hit = scoreMap.get(name);
    if (hit) people.push(hit);
    else people.push({ name, scored: false });
    used.add(name);
  }

  for (const [name, hit] of scoreMap) {
    if (used.has(name)) continue;
    people.push(hit);
    used.add(name);
  }

  const seated = people.slice(0, Math.max(VILLAGE_CAPACITY, people.length));
  const n = seated.length;
  return {
    date: payload.date,
    disclaimer: payload.disclaimer,
    people: seated.map((person, i) => ({
      ...person,
      plot: n <= 1 ? 0 : Math.round((i * (VILLAGE_CAPACITY - 1)) / (n - 1)),
    })),
  };
}
