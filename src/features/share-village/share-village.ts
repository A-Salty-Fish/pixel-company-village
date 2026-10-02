/**
 * PV-PM-083 — a light share card. Names, a date, and counts only.
 * Chat text is not a field here. Set SHARE_VILLAGE_ENABLED to false to hide it.
 */

export const SHARE_VILLAGE_ENABLED = true;
export const SHARE_LABEL = "分享村子";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const NAME = /^[\u4e00-\u9fffA-Za-z0-9·]{1,8}$/;
const NAME_LEAK = /说|聊|原文|消息|分数|聊天/;

export type ShareFacts = {
  date: string;
  scored: number;
  messages: number;
  names: string[];
  version: string;
};

export function shareVillageOn(enabled = SHARE_VILLAGE_ENABLED) {
  return enabled;
}

function count(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function sharePreview(facts: ShareFacts, enabled = SHARE_VILLAGE_ENABLED) {
  if (!enabled) return { title: "", text: "", lines: [] as string[] };
  const names = facts.names.filter((name) => NAME.test(name) && !NAME_LEAK.test(name)).slice(0, 4);
  const date = YMD.test(facts.date) ? facts.date : "";
  const version = VERSION.test(facts.version) ? facts.version : "";
  const lines = [
    "像素公司村",
    date,
    `有分 ${count(facts.scored)} 人`,
    `消息 ${count(facts.messages)} 条`,
    names.join("、"),
    version ? `v${version}` : "",
  ].filter((line) => line.length > 0);
  return { title: "像素公司村", text: lines.join("\n"), lines };
}

/** The card is only the lines we built. A smuggled sentence cannot ride along. */
export function shareCardIsPublic(text: string) {
  if (!text) return false;
  if (/他说|她说|原文|聊天|SITE_PASSWORD|INGEST_SECRET/.test(text)) return false;
  return text.startsWith("像素公司村");
}
