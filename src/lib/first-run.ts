/** Seen-flag only. No sentences, no names, no chat. */
export const GUIDE_KEY = "village:guide-seen-v1";

export const GUIDE_LINES = [
  "先在体贴设置里选定「我是谁」。小事和院子都记在这个身份上。",
  "做完本周小事，地图上会多一枚对应的痕迹。",
  "关照或挥手之后，对方会点头或挥回来。这里不收录说过的话。",
  "减动开关在「村里新事」的「开关」里，点开就能看见。",
  "村里小玩和屋边角落各有十处，合上时也能看见进度。",
] as const;

export function guideSeen(raw: string | null) {
  return raw === "1";
}
