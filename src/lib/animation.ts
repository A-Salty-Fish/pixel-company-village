import type { AnimationState, PersonScore, PersonWithState, VillagePerson } from "@/lib/types";

export const STATE_LABELS: Record<AnimationState, string> = {
  hard_work: "挥砍干活",
  focused: "专心浇水",
  mixed: "又挖又浇",
  fishing: "湖边抛竿",
  slacking: "树荫歇脚",
  wander: "村里溜达",
  default: "田边发呆",
};

export const STATE_ORDER: AnimationState[] = [
  "hard_work",
  "focused",
  "mixed",
  "fishing",
  "slacking",
  "wander",
  "default",
];

/**
 * First matching rule wins.
 * focused 的 on_task 阈值略降到 0.68，让接近 0.7 的人进入「专心浇水」。
 */
export function resolveState(person: Pick<PersonScore, "work" | "fish" | "on_task">): AnimationState {
  const { work, fish, on_task } = person;
  if (work >= 2.0 && work - fish >= 0.5) return "hard_work";
  if (work >= 1.2 && on_task >= 0.68 && fish < 1.5) return "focused";
  if (work >= 1.5 && fish >= 1.5) return "mixed";
  if (fish >= 2.0 && fish > work) return "fishing";
  if (fish >= 1.2 && work < 1.2) return "slacking";
  if (work < 1.0 && fish < 1.0) return "wander";
  return "default";
}

export function animationSpeed(msgs: number): number {
  return 1 + Math.min(0.35, msgs / 800);
}

export function withStates(people: VillagePerson[]): PersonWithState[] {
  return people.map((person, index) => {
    const plot = person.plot ?? index;
    if (!person.scored) {
      return {
        ...person,
        scored: false,
        plot,
        state: "default",
        speed: 0.55,
      };
    }
    return {
      ...person,
      scored: true,
      plot,
      state: resolveState(person),
      speed: animationSpeed(person.msgs),
    };
  });
}
