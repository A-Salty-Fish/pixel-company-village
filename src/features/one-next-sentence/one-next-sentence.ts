/**
 * PV-PM-116 — after a name is chosen, one next-step sentence speaks.
 * The header does not repeat it. The next sentence waits until this one
 * is done or dismissed. Before a name is chosen, PV-PM-110 still keeps the field quiet.
 * Set ONE_NEXT_SENTENCE_ENABLED to false to let the sentences pile up again.
 */

export const ONE_NEXT_SENTENCE_ENABLED = true;

export const LOUD_NEXT = ["今日还空着", "去看村口", "门灯还亮着", "分享村子"] as const;

export const HEADER_SYNONYM = "今日摸一下村里";

export type NextSentenceId =
  | "home"
  | "line"
  | "suggest"
  | "gate"
  | "welcome"
  | "share"
  | "week"
  | "touch";

export type NextChoice = NextSentenceId | "hold" | "all" | "quiet";

export function oneNextSentenceOn(enabled = ONE_NEXT_SENTENCE_ENABLED) {
  return enabled;
}

export function oneNextSentenceMark(enabled = ONE_NEXT_SENTENCE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function chooseNextSentence(input: {
  hasSelf: boolean;
  home: boolean;
  line: boolean;
  suggest: boolean;
  gate: boolean;
  welcome: boolean;
  share: boolean;
  week: boolean;
  touch: boolean;
  hold?: boolean;
  done?: readonly string[];
  enabled?: boolean;
}): NextChoice {
  const enabled = input.enabled ?? ONE_NEXT_SENTENCE_ENABLED;
  if (!enabled || !input.hasSelf) return "all";
  if (input.home) return "home";
  if (input.hold) return "hold";
  const done = new Set(input.done ?? []);
  const order: Array<[NextSentenceId, boolean]> = [
    ["line", input.line && !done.has("line")],
    ["suggest", input.suggest && !done.has("suggest")],
    ["gate", input.gate && !done.has("gate")],
    ["welcome", input.welcome && !done.has("welcome")],
    ["share", input.share && !done.has("share")],
    ["week", input.week && !done.has("week")],
    ["touch", input.touch && !input.week && !done.has("touch")],
  ];
  for (const [id, on] of order) {
    if (on) return id;
  }
  return "quiet";
}

export function sentenceSpeaks(choice: NextChoice, id: NextSentenceId) {
  return choice === "all" || choice === id;
}

/** How many of the loud phrases appear in these visible strings. */
export function loudHitCount(texts: string[]) {
  let count = 0;
  for (const text of texts) {
    for (const phrase of LOUD_NEXT) {
      if (text.includes(phrase)) count += 1;
    }
  }
  return count;
}

/** A header invite that repeats the map's next step. */
export function headerRepeatsInvite(headerText: string) {
  if (headerText.includes(HEADER_SYNONYM)) return true;
  return LOUD_NEXT.some((phrase) => headerText.includes(phrase));
}
