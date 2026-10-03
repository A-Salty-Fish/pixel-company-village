/**
 * PV-PM-119 — 「找我」 does not paste a second sentence.
 * If the camera already frames you, the button stays quiet.
 * If a receipt is still needed, it replaces the current sentence.
 * Set FIND_ME_ONE_LINE_ENABLED to false to let the receipt sit beside it.
 */

export const FIND_ME_ONE_LINE_ENABLED = true;

export type FindSentence = "silent" | "replace" | "add";

export function findMeOneLineOn(enabled = FIND_ME_ONE_LINE_ENABLED) {
  return enabled;
}

export function findMeOneLineMark(enabled = FIND_ME_ONE_LINE_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function selfInFrame(input: {
  self: { x: number; y: number } | null;
  camX: number;
  camY: number;
  spanW: number;
  spanH: number;
}) {
  if (!input.self) return false;
  return (
    input.self.x >= input.camX &&
    input.self.y >= input.camY &&
    input.self.x <= input.camX + input.spanW &&
    input.self.y <= input.camY + input.spanH
  );
}

/** silent: already in frame, do not speak. replace: one strip. add: the old side-by-side receipt. */
export function findMeSentence(input: { framed: boolean; enabled?: boolean }): FindSentence {
  const enabled = input.enabled ?? FIND_ME_ONE_LINE_ENABLED;
  if (!enabled) return "add";
  if (input.framed) return "silent";
  return "replace";
}

export function findMeCoversSentence(mode: FindSentence) {
  return mode === "replace";
}
