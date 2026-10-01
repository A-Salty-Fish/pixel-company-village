/**
 * PV-PM-051 — choosing a name focuses the map on that person right away.
 * Guest chrome (only 我是谁) gives way to the post-identity footer in the same turn.
 * Set IDENTITY_LAND_ENABLED to false to skip the focus.
 */

export const IDENTITY_LAND_ENABLED = true;
export const IDENTITY_LAND_MS = 1_000;

export function identityLandDue(input: { previous: string | null; next: string | null; enabled?: boolean }) {
  const enabled = input.enabled ?? IDENTITY_LAND_ENABLED;
  const next = input.next?.trim() ?? "";
  const previous = input.previous?.trim() ?? "";
  return enabled && next.length > 0 && next !== previous;
}
