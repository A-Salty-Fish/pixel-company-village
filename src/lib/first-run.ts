/** Seen-flag only. No sentences, no names, no chat. */
export const GUIDE_KEY = "village:guide-seen-v1";

export const GUIDE_LINES = [
  "先选定「我是谁」。",
  "做一件院里的事，或点一项本周小事。",
  "对一个人挥一次手，或送一次关照。",
  "减动开关在「村里新事」的「开关」里，点开就能看见。",
  "村里小玩和屋边角落各有十处，合上时也能看见进度。",
] as const;

export const VISIT_KEY = "village:visit-v1";

export type VisitFlags = {
  self: boolean;
  yard: boolean;
  social: boolean;
};

export function emptyVisit(): VisitFlags {
  return { self: false, yard: false, social: false };
}

export function guideSeen(raw: string | null) {
  return raw === "1";
}

export function readVisit(raw: string | null): VisitFlags {
  if (!raw) return emptyVisit();
  try {
    const value = JSON.parse(raw) as Partial<VisitFlags>;
    return {
      self: value.self === true,
      yard: value.yard === true,
      social: value.social === true,
    };
  } catch {
    return emptyVisit();
  }
}

export function visitComplete(flags: VisitFlags) {
  return flags.self && flags.yard && flags.social;
}

export function visitStep(flags: VisitFlags) {
  if (!flags.self) return "self" as const;
  if (!flags.yard) return "yard" as const;
  if (!flags.social) return "social" as const;
  return "done" as const;
}
