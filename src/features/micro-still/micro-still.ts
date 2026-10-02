/**
 * Shared gate for this micro round.
 * Quiet village and reduced motion drop the new motions to a still frame at once.
 */

export function microMotionStill(quiet: boolean, reduced = false) {
  return Boolean(quiet) || Boolean(reduced);
}
