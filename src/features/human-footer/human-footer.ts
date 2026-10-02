/**
 * PV-PM-114 — the player footer is one human sentence.
 * License names and filenames stay out of the village.
 * Set the flag false to put the engineering lines back.
 */

export const HUMAN_FOOTER_ENABLED = true;
export const HUMAN_FOOTER_LINE = "分数是玩乐雷达，不是评价同事。这里不写说过的话。";

const ENGINEERING = ["work", "on_task", "CREDITS.md", "CC0"];

export function humanFooterOn(enabled = HUMAN_FOOTER_ENABLED) {
  return enabled;
}

export function humanFooterMark(enabled = HUMAN_FOOTER_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function footerLine(enabled = HUMAN_FOOTER_ENABLED) {
  return enabled ? HUMAN_FOOTER_LINE : "";
}

export function footerKeepsEngineering(text: string) {
  return ENGINEERING.some((word) => text.includes(word));
}
