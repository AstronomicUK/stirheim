// To Wound chart — brief §4.7. Melee uses attacker's Strength; ranged uses the weapon's
// fixed Strength, not the shooter's.

import { IMPOSSIBLE, type Threshold } from "./dice";

const clampStat = (v: number) => Math.max(1, Math.min(10, Math.round(v)));

/**
 * To Wound chart. Rows = Strength 1..10, columns = Toughness 1..10.
 * Value = minimum D6 roll needed, or IMPOSSIBLE ("-" in the rulebook — cannot wound at all).
 *
 * Corrected 2026-09-01: the original project brief's S8-S10 rows plateaued early (e.g. S8 held
 * at "2" through T7), which doesn't match the continuous diagonal pattern every other row
 * follows. Verified against mordheimer.net's rulebook scan (rules/01-introduction-and-rules.md)
 * — S1-S7 matched exactly, S8-S10 didn't. Fixed to follow the same diagonal pattern as the rest
 * of the chart, per the verbatim source.
 */
const TO_WOUND: Threshold[][] = [
  /* S1  */ [4, 5, 6, 6, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE],
  /* S2  */ [3, 4, 5, 6, 6, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE],
  /* S3  */ [2, 3, 4, 5, 6, 6, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE],
  /* S4  */ [2, 2, 3, 4, 5, 6, 6, IMPOSSIBLE, IMPOSSIBLE, IMPOSSIBLE],
  /* S5  */ [2, 2, 2, 3, 4, 5, 6, 6, IMPOSSIBLE, IMPOSSIBLE],
  /* S6  */ [2, 2, 2, 2, 3, 4, 5, 6, 6, IMPOSSIBLE],
  /* S7  */ [2, 2, 2, 2, 2, 3, 4, 5, 6, 6],
  /* S8  */ [2, 2, 2, 2, 2, 2, 3, 4, 5, 6],
  /* S9  */ [2, 2, 2, 2, 2, 2, 2, 3, 4, 5],
  /* S10 */ [2, 2, 2, 2, 2, 2, 2, 2, 3, 4],
];

/** Minimum D6 roll needed for `strength` to wound `toughness`, before modifiers. IMPOSSIBLE if it can't wound at all. */
export function toWoundThreshold(strength: number, toughness: number): Threshold {
  const s = clampStat(strength);
  const t = clampStat(toughness);
  return TO_WOUND[s - 1][t - 1];
}
