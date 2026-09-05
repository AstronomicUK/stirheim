// Critical Hit charts — core rules 01:709-715 (Standard) and optional rules 03:4221-4276
// (weapon-category charts).
//
// A crit only triggers on a natural 6 rolled to wound (both melee and shooting), and NOT if
// the attacker needed a 6 to wound in the first place (01:705, handled in resolveAttack.ts,
// not here). Once triggered, a second D6 is rolled against the relevant table below to pick the
// specific result.
//
// "The wound is doubled to 2 wounds" matters even against a single-Wound model: every wound that
// gets through produces its own Injury roll and the highest result applies (01:770), so a 2-wound
// crit is resolved as two Injury dice in resolveAttack.ts. "Hits a vital part" takes one armour
// save before doubling (01:713); Bladestorm takes a save per wound. A few optional-chart results
// have further mechanical effects (auto-OOA, ignoring helmet saves, knock-down on Thrust) —
// called out per result below; everything marked `flavourOnly` has no probability-table effect.

export interface CritResult {
  label: string;
  ignoresArmourSave: boolean;
  /** Disables any helmet / Thick Skull stun-avoidance save for this Injury roll (Bludgeoning "Clubbed"). */
  ignoresHelmetSave?: boolean;
  injuryRollBonus: number;
  /** >1 means each wound takes its own armour save (Bladed "Bladestorm") instead of one save gating them all. */
  separateSaves?: number;
  /** Bludgeoning "Bludgeoned": skip the Injury chart — automatic OOA if the (normal) armour save fails, no effect at all if it succeeds. */
  autoOOAOnFailedSave?: boolean;
  /** Thrusting "Thrust": the target is knocked down whether or not the wound is saved (03:4275). */
  minSeverityKnockedDown?: boolean;
  /** Number of wounds inflicted if the hit gets through — drives the number of Injury rolls (highest applies). */
  woundsCaused: 1 | 2;
  /** Missile "Ricochet": informational only — v1 does not simulate the secondary hit (brief §3, §5.5). */
  ricochet?: boolean;
  /** Narrative-only effect with no probability-table impact for this tool, per the brief's own text. */
  flavourOnly?: string;
}

interface Band {
  maxFace: number;
  result: CritResult;
}

function pickBand(bands: Band[], modifiedFace: number): CritResult {
  for (const band of bands) {
    if (modifiedFace <= band.maxFace) return band.result;
  }
  return bands[bands.length - 1].result;
}

const STANDARD_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Hits a vital part", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 2 } },
  { maxFace: 4, result: { label: "Hits an exposed spot", ignoresArmourSave: true, injuryRollBonus: 0, woundsCaused: 2 } },
  { maxFace: 6, result: { label: "Master strike!", ignoresArmourSave: true, injuryRollBonus: 2, woundsCaused: 2 } },
];

const MISSILE_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Weak Spot", ignoresArmourSave: true, injuryRollBonus: 0, woundsCaused: 1 } },
  { maxFace: 4, result: { label: "Ricochet", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, ricochet: true } },
  { maxFace: 6, result: { label: "Master Shot", ignoresArmourSave: true, injuryRollBonus: 0, woundsCaused: 2 } },
];

const BLUDGEONING_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Hammered", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, flavourOnly: "Opponent may not fight this turn if he hasn't already." } },
  { maxFace: 4, result: { label: "Clubbed", ignoresArmourSave: true, ignoresHelmetSave: true, injuryRollBonus: 0, woundsCaused: 1 } },
  { maxFace: 5, result: { label: "Wild Sweep", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, flavourOnly: "Opponent loses a weapon for the rest of combat." } },
  { maxFace: 6, result: { label: "Bludgeoned", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, autoOOAOnFailedSave: true } },
];

const BLADED_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Flesh Wound", ignoresArmourSave: true, injuryRollBonus: 0, woundsCaused: 1 } },
  { maxFace: 4, result: { label: "Bladestorm", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 2, separateSaves: 2 } },
  { maxFace: 6, result: { label: "Sliced!", ignoresArmourSave: true, injuryRollBonus: 2, woundsCaused: 2 } },
];

const UNARMED_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Body Blow", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, flavourOnly: "Grants an extra to-hit/to-wound roll immediately." } },
  { maxFace: 4, result: { label: "Crushing Blow", ignoresArmourSave: false, injuryRollBonus: 1, woundsCaused: 1 } },
  { maxFace: 6, result: { label: "Mighty Blow", ignoresArmourSave: true, injuryRollBonus: 2, woundsCaused: 1 } },
];

const THRUSTING_BANDS: Band[] = [
  { maxFace: 2, result: { label: "Stab", ignoresArmourSave: false, injuryRollBonus: 1, woundsCaused: 1 } },
  { maxFace: 4, result: { label: "Thrust", ignoresArmourSave: false, injuryRollBonus: 0, woundsCaused: 1, minSeverityKnockedDown: true } },
  { maxFace: 6, result: { label: "Kebab!", ignoresArmourSave: true, injuryRollBonus: 2, woundsCaused: 1, flavourOnly: "Plus knockback." } },
];

export type CritTableKey = "standard" | "missile" | "bludgeoning" | "bladed" | "unarmed" | "thrusting";

const CRIT_TABLES: Record<CritTableKey, Band[]> = {
  standard: STANDARD_BANDS,
  missile: MISSILE_BANDS,
  bludgeoning: BLUDGEONING_BANDS,
  bladed: BLADED_BANDS,
  unarmed: UNARMED_BANDS,
  thrusting: THRUSTING_BANDS,
};

/**
 * Exact probability distribution over crit-table results, given the D6 roll used to pick a
 * result on `table`, shifted by `rollModifier` (e.g. Web of Steel's +1, melee only).
 */
export function critDistribution(table: CritTableKey, rollModifier: number): Array<{ result: CritResult; probability: number }> {
  const bands = CRIT_TABLES[table];
  const entries: Array<{ result: CritResult; probability: number }> = [];
  for (let roll = 1; roll <= 6; roll++) {
    const modified = roll + rollModifier;
    const result = pickBand(bands, modified);
    const existing = entries.find((e) => e.result === result);
    if (existing) existing.probability += 1 / 6;
    else entries.push({ result, probability: 1 / 6 });
  }
  return entries;
}

/** The result a specific D6 roll (plus modifier) lands on when picking from `table` — for walking a real roll through the chart. */
export function critResultForRoll(table: CritTableKey, roll: number, rollModifier: number): CritResult {
  return pickBand(CRIT_TABLES[table], roll + rollModifier);
}
