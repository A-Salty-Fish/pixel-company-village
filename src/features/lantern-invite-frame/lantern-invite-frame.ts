/**
 * PV-PM-121 — the evening invite frames the lantern.
 * It does not open the three yard count cards, and it does not leave them open.
 * Set LANTERN_INVITE_FRAME_ENABLED to false to open the yard dock again.
 */

export const LANTERN_INVITE_FRAME_ENABLED = true;

/** Not a toy id, so the yard counts stay shut. */
export const LANTERN_INVITE_AIM = "lantern-frame";

export function lanternInviteFrameOn(enabled = LANTERN_INVITE_FRAME_ENABLED) {
  return enabled;
}

export function lanternInviteFrameMark(enabled = LANTERN_INVITE_FRAME_ENABLED): "1" | "0" {
  return enabled ? "1" : "0";
}

export function lanternInviteFollow(enabled = LANTERN_INVITE_FRAME_ENABLED) {
  if (!enabled) return { aimKind: "lantern", openYard: true };
  return { aimKind: LANTERN_INVITE_AIM, openYard: false };
}
