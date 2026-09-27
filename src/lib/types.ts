export const ALLOWED_TAGS = ["mostly_on_task"] as const;
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

export type AnimationState =
  | "hard_work"
  | "focused"
  | "mixed"
  | "fishing"
  | "slacking"
  | "wander"
  | "default";

export type PersonScore = {
  name: string;
  scored: true;
  msgs: number;
  work: number;
  fish: number;
  on_task: number;
  tags?: AllowedTag[];
  plot?: number;
};

export type PlaceholderPerson = {
  name: string;
  scored: false;
  plot?: number;
};

export type VillagePerson = PersonScore | PlaceholderPerson;

export type ScorePayload = {
  date: string;
  people: VillagePerson[];
  disclaimer: string;
};

export type PersonWithState = VillagePerson & {
  state: AnimationState;
  speed: number;
  plot: number;
};
