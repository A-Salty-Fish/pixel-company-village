/** Honest date lines and other canned UI copy. No chat text. */

export function scoreDateCopy(dataDate: string, today: string) {
  if (dataDate === today) {
    return {
      fresh: true as const,
      headline: `数据日 ${dataDate}`,
      detail: "和今天是同一天。",
    };
  }
  return {
    fresh: false as const,
    headline: `最近一次评分日 ${dataDate}`,
    detail: `不是日历上的今天（${today}）。`,
  };
}

export function waveHint(input: { hasIdentity: boolean; allowed: boolean; retryAfterMin: number }) {
  if (!input.hasIdentity) return "挥手需要先选定「我是谁」。";
  if (!input.allowed) {
    if (input.retryAfterMin > 0) return `这一小时已经挥过手了。大约还要 ${input.retryAfterMin} 分钟。`;
    return "这一小时已经挥过手了。";
  }
  return "还可挥 1 次。";
}

export const KINDNESS_MENU = [
  { id: "seed", label: "种子", confirm: "确认丢下种子？会用掉今天 1 次关照。" },
  { id: "coffee", label: "咖啡", confirm: "确认递一杯咖啡？会用掉今天 1 次关照。" },
  { id: "rod", label: "钓竿", confirm: "确认递一根钓竿？会用掉今天 1 次关照。" },
  { id: "water", label: "浇水", confirm: "确认一起浇几秒水？会用掉今天 1 次关照。" },
] as const;

export type KindnessMenuId = (typeof KINDNESS_MENU)[number]["id"];
