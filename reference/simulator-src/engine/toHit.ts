// To Hit charts — brief §4.1 (melee, opposed WS) and §4.2 (ranged, flat BS).

const clampStat = (v: number) => Math.max(1, Math.min(10, Math.round(v)));

/**
 * Melee To Hit chart (brief §4.1). Rows = attacker WS 1..10, columns = opponent WS 1..10.
 * Value = minimum D6 roll needed.
 */
const MELEE_TO_HIT: number[][] = [
  /* WS1  */ [4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  /* WS2  */ [3, 4, 4, 4, 5, 5, 5, 5, 5, 5],
  /* WS3  */ [3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  /* WS4  */ [3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  /* WS5  */ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
  /* WS6  */ [3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  /* WS7  */ [3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  /* WS8  */ [3, 3, 3, 3, 3, 3, 3, 4, 4, 4],
  /* WS9  */ [3, 3, 3, 3, 3, 3, 3, 3, 4, 4],
  /* WS10 */ [3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
];

/** Minimum D6 roll needed for `attackerWS` to hit `opponentWS` in melee, before modifiers. */
export function meleeToHitThreshold(attackerWS: number, opponentWS: number): number {
  const a = clampStat(attackerWS);
  const o = clampStat(opponentWS);
  return MELEE_TO_HIT[a - 1][o - 1];
}

/**
 * Ranged To Hit chart (brief §4.2). Index = shooter BS 1..10.
 * Value = minimum D6 roll needed (can be 0 or negative — "0 or less" always hits
 * unless a natural 1 is rolled; probabilityAtLeast() already encodes that).
 */
const RANGED_TO_HIT: number[] = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3];

/** Minimum D6 roll needed for `bs` to hit at close range with no modifiers. */
export function rangedToHitBaseThreshold(bs: number): number {
  const b = clampStat(bs);
  return RANGED_TO_HIT[b - 1];
}
