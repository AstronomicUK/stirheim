// Shared D6 helper — encodes the "natural 1 always fails, natural 6 always succeeds"
// convention once, for every roll type (to hit, to wound, armour save, injury-adjacent
// rolls where stated). See brief §4.1.

/** Sentinel for a roll that cannot succeed at all (e.g. a "-" cell on the To Wound chart). */
export const IMPOSSIBLE = null;
export type Threshold = number | typeof IMPOSSIBLE;

/**
 * Probability of meeting or beating `threshold` on a single D6, given natural-1-always-fails
 * and natural-6-always-succeeds. `threshold` is the minimum face value needed (after any
 * roll modifiers have already been folded into it).
 */
export function probabilityAtLeast(threshold: Threshold): number {
  if (threshold === IMPOSSIBLE) return 0;
  if (threshold <= 1) return 5 / 6; // every face except a natural 1
  if (threshold >= 7) return 1 / 6; // only a natural 6 can succeed
  return (7 - threshold) / 6;
}

/** Convenience: probability threshold is NOT met. */
export function probabilityBelow(threshold: Threshold): number {
  return 1 - probabilityAtLeast(threshold);
}

/** Clamp a modified D6 threshold back into the meaningful 1..7 range for display/lookup purposes. */
export function clampThreshold(threshold: number): number {
  return Math.max(1, Math.min(7, threshold));
}
