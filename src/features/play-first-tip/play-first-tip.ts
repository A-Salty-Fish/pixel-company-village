/**
 * PV-PM-103 — the first visit teaches one map action.
 * Reduce-motion stays in comfort settings. Set the flag false to keep the old lines.
 */

export const PLAY_FIRST_TIP_ENABLED = true;
export const PLAY_FIRST_TIP = "先在地图上找我，或去看村口。";
export const PLAY_LATER_TIP = "可以在地图上挥一挥手。";

const COMFORT_WORD = /减动|安静|减少动作/;
const PLAY_WORD = /找我|挥手|去看村口/;

export function playFirstTipOn(enabled = PLAY_FIRST_TIP_ENABLED) {
  return enabled;
}

/** Step 0 keeps the identity sentence from PV-D-020, then teaches one map action. */
export function softenFirstTip(line: string, step: number, enabled = PLAY_FIRST_TIP_ENABLED) {
  if (!enabled) return line;
  if (step === 0) {
    if (line.includes("我是谁") && !PLAY_WORD.test(line)) return `${line}${PLAY_FIRST_TIP}`;
    return PLAY_FIRST_TIP;
  }
  if (COMFORT_WORD.test(line)) return PLAY_LATER_TIP;
  return line;
}

export function firstTipTeachesPlay(line: string) {
  return PLAY_WORD.test(line);
}

export function firstTipTeachesComfort(line: string) {
  return COMFORT_WORD.test(line);
}
