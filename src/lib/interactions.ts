import type { PersonWithState } from "./types";

export type FxKind = "seed" | "coffee" | "rod" | "quote" | "pair" | "nod" | "sit" | "scare" | "wave" | "stretch" | "clap";

const KINDNESS_KINDS = new Set<FxKind>(["seed", "coffee", "rod", "pair"]);

export function isKindnessKind(kind: FxKind) {
  return KINDNESS_KINDS.has(kind);
}

export type VillageFx = {
  id: number;
  kind: FxKind;
  actor: string;
  partner?: string;
  line: string;
  startedAt: number;
  duration: number;
};

const QUOTES = [
  "田埂上的风，比会议纪要轻。",
  "今天的云，走得比邮件慢。",
  "种子不看绩效，它只看有没有浇水。",
  "湖边的位子，留给想发呆的人。",
  "咖啡凉了也没关系，人还热着。",
  "篱笆外的鸟，不参加站会。",
  "把一天折成一小块田，就够种了。",
  "摸鱼的时候，鱼其实在看你。",
  "晚饭前的光，适合把锄头放下。",
  "村子很小，心事可以走一圈。",
];

/** Shape marks so work / fish / on-task are not hue-only. */
export const AXIS_MARK = {
  work: "■",
  fish: "～",
  task: "＝",
} as const;

const WORK_MAX = 3;

export function workRatio(work: number) {
  return clamp01(work / WORK_MAX);
}

export function fishRatio(fish: number) {
  return clamp01(fish / WORK_MAX);
}

export function taskRatio(onTask: number) {
  return clamp01(onTask);
}

export function signalTag(work: number, fish: number, onTask: number) {
  if (work >= 2 && onTask >= 0.68 && fish < 1.2) return "高产专注";
  if (fish >= 2 && fish > work) return "湖边放空";
  if (work >= 1.5 && fish >= 1.5) return "混合节奏";
  if (work >= 1.2 && fish >= 1.2) return "张弛有度";
  if (onTask >= 0.68 && work >= 1.2 && fish < 1.5) return "高产专注";
  if (fish >= 1.2 && work < 1.2) return "湖边放空";
  if (work < 1 && fish < 1) return "田边发呆";
  return "混合节奏";
}

export function quoteCount() {
  return QUOTES.length;
}

export function quoteByIndex(index: number) {
  const safe = ((index % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[safe];
}

export function pickQuote(name: string, salt: number) {
  return quoteByIndex(Math.abs(hash(name) + salt));
}

export function kindnessFx(action: "seed" | "coffee" | "rod" | "water", actor: string): VillageFx {
  if (action === "water") return makeFx("pair", actor);
  return makeFx(action, actor);
}

export function emoteFx(actor: string, kind: "stretch" | "sit" | "clap" | "wave"): VillageFx {
  return makeFx(kind, actor);
}

export const SOCIAL_WAVE_REPLY = "对方也挥了回来。";
export const SOCIAL_KIND_REPLY = "对方点了点头，回了一颗小种子。";

const WAVE_BY_LEVEL = [
  SOCIAL_WAVE_REPLY,
  "对方挥得更慢一点，像认出你了。",
  "对方先点头，再挥回来。",
  "对方把帽子抬了抬，挥得很熟。",
] as const;

const KIND_BY_LEVEL: Partial<Record<FxKind, readonly string[]>> = {
  seed: [SOCIAL_KIND_REPLY, "对方把种子按好，多看了你一眼。", "对方记得这颗种子，点了点头。", "对方把种子按进熟土里。"],
  coffee: ["对方捧着杯子，也点了点头。", "对方把杯子捂热，再点头。", "对方记得你的咖啡，点了点头。", "对方把杯子递回来一点。"],
  rod: ["对方晃了晃钓竿，算是回礼。", "对方把钓竿靠好，点了点头。", "对方记得这根钓竿。", "对方把钓竿往你这边倾了倾。"],
  pair: ["对方也浇了两下，水光还在。", "对方跟着又浇了一下。", "对方记得一起浇过。", "对方把水光留在熟田里。"],
};

export type SocialReply = "wave" | "kind";

function familiarityStep(familiarity: number) {
  if (!Number.isFinite(familiarity)) return 0;
  return Math.max(0, Math.min(3, Math.floor(familiarity)));
}

/** Canned return for a wave or a kindness. Familiarity only picks a canned line. */
export function socialReplyFor(kind: FxKind, familiarity = 0): { reply: SocialReply; line: string } | null {
  const step = familiarityStep(familiarity);
  if (kind === "wave") return { reply: "wave", line: WAVE_BY_LEVEL[step] ?? SOCIAL_WAVE_REPLY };
  const lines = KIND_BY_LEVEL[kind];
  if (!lines) return isKindnessKind(kind) ? { reply: "kind", line: SOCIAL_KIND_REPLY } : null;
  return { reply: "kind", line: lines[step] ?? SOCIAL_KIND_REPLY };
}

/** A wave or kindness toward someone else gets one canned reply. Nothing is stored. */
export function withSocialReply(fx: VillageFx, selfName: string | null, familiarity = 0): VillageFx {
  const reply = socialReplyFor(fx.kind, familiarity);
  if (!selfName || fx.actor === selfName || !reply) return fx;
  return { ...fx, partner: selfName, line: `${fx.line} ${reply.line}` };
}

export function socialReplyMark(fx: VillageFx | null, selfName: string | null): SocialReply | null {
  if (!fx || !selfName || fx.partner !== selfName) return null;
  return socialReplyFor(fx.kind)?.reply ?? null;
}

export function rollOpeningEvent(name: string, people: PersonWithState[], random = Math.random) {
  if (random() > 0.42) return null;
  return rollPlayEvent(name, people, random);
}

export function rollPlayEvent(name: string, people: PersonWithState[], random = Math.random): VillageFx {
  const kinds: FxKind[] = ["seed", "coffee", "rod", "quote", "pair"];
  let kind = kinds[Math.floor(random() * kinds.length)];
  const others = people.filter((person) => person.name !== name);
  let partner: string | undefined;
  if (kind === "pair") {
    if (others.length === 0) kind = "quote";
    else partner = others[Math.floor(random() * others.length)].name;
  }
  return makeFx(kind, name, partner, Math.floor(random() * 99));
}

export function waveFx(name: string): VillageFx {
  return {
    id: Date.now(),
    kind: "wave",
    actor: name,
    line: "挥了挥手。",
    startedAt: Date.now(),
    duration: 1400,
  };
}

export function blockedKindnessFx(name: string, line: string): VillageFx {
  return {
    id: Date.now(),
    kind: "quote",
    actor: name,
    line,
    startedAt: Date.now(),
    duration: 2400,
  };
}

export function jokeFx(name: string, step: number): VillageFx {
  const kinds: FxKind[] = ["nod", "sit", "scare"];
  const kind = kinds[step % kinds.length];
  return makeFx(kind, name);
}

function makeFx(kind: FxKind, actor: string, partner?: string, salt = 0): VillageFx {
  const line =
    kind === "seed"
      ? "丢下一颗种子，田边冒出一棵新芽。"
      : kind === "coffee"
        ? "递来一杯热咖啡，耳朵热了一下。"
        : kind === "rod"
          ? "递来一根钓竿，湖风跟着响。"
          : kind === "pair"
            ? partner
              ? `和${partner}一起浇了几秒水。`
              : "浇了几秒水。"
            : kind === "nod"
              ? "点了点头。"
              : kind === "sit"
                ? "干脆在田边坐下了。"
                : kind === "scare"
                  ? "被田鼠吓得跳起来。"
                    : kind === "wave"
                      ? "挥了挥手。"
                      : kind === "stretch"
                        ? "伸了个懒腰。"
                        : kind === "clap"
                          ? "拍了拍手。"
                          : pickQuote(actor, salt);
  return {
    id: Date.now() + salt,
    kind,
    actor,
    partner,
    line,
    startedAt: Date.now(),
    duration: kind === "pair" ? 3200 : kind === "scare" ? 900 : 2400,
  };
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 33 + text.charCodeAt(i)) >>> 0;
  return h;
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
