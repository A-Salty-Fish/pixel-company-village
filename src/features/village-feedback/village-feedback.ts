/**
 * PV-PM-033 — wave, lamp, find-me, next beat, and toys share one feedback grammar.
 * Short receipt, map pulse, and a state token. No chat text.
 * Set VILLAGE_FEEDBACK_ENABLED to false to leave each action on its old line.
 */

export const VILLAGE_FEEDBACK_ENABLED = true;
export const VILLAGE_FEEDBACK_MS = 3200;

export type VillageFeedback = {
  toast: string;
  targetId: string;
  state: string;
};

export function villageFeedback(
  input: { toast: string; targetId: string; state: string },
  enabled = VILLAGE_FEEDBACK_ENABLED,
): VillageFeedback | null {
  if (!enabled) return null;
  const toast = input.toast.trim();
  const targetId = input.targetId.trim();
  const state = input.state.trim();
  if (!toast || toast.length > 80 || !targetId || !state) return null;
  return { toast, targetId, state };
}

/** Shared map pulse. Same brackets for every key action. */
export function feedbackPulsePixels(x: number, y: number, enabled = VILLAGE_FEEDBACK_ENABLED) {
  if (!enabled) return [];
  return [
    { x: x - 14, y: y - 14, w: 28, h: 3, color: "#fff6d8" },
    { x: x - 14, y: y + 12, w: 28, h: 3, color: "#fff6d8" },
    { x: x - 14, y: y - 12, w: 3, h: 26, color: "#f2d15c" },
    { x: x + 12, y: y - 12, w: 3, h: 26, color: "#f2d15c" },
  ];
}

export function feedbackCopy() {
  return ["邻里应了一下。", "门灯点上了。", "门灯灭了。", "找到了。", "镜头到了。", "到了。"];
}
