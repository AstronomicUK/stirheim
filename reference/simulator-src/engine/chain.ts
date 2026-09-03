// The per-phase "how far does the turn get" chain, cumulative across every attack of the phase:
// at least one hit -> at least one wound through the saves -> knocked down or worse -> stunned or
// worse -> out of action. Each step contains the next, so a row reads left to right, and an extra
// Attack lifts every column instead of only appearing in the last one. Both analysers show this
// chain for the baseline and for each candidate change.

import type { Character, CombatContext, DefenderProfile, HouseRules, Skill, Weapon, WeaponKind } from "../types";
import { defaultHouseRules } from "../types";
import { resolveCharacterTurn } from "./combat";
import { totalAttackCount } from "./buildAttackInput";

export interface PhaseChain {
  /** Attacks rolled this phase (all weapons of the phase). */
  attacks: number;
  /** P(at least one attack hits). */
  anyHit: number;
  /** P(at least one wound gets through armour, Parry, Step Aside and Ward) — the target lost at least one Wound. Equals "knocked down or worse" for a single-Wound target. */
  anyWound: number;
  knockedDownOrWorse: number;
  stunnedOrWorse: number;
  outOfAction: number;
  /** P(a critical hit is scored this phase) — the to-hit and to-wound rolls needed are already included. */
  anyCrit: number;
  /** P(out of action | a critical hit was scored). */
  ooaGivenCrit: number;
}

export type ChainMetric = "outOfAction" | "stunnedOrWorse" | "knockedDownOrWorse";

export const CHAIN_METRICS: { id: ChainMetric; label: string; short: string }[] = [
  { id: "outOfAction", label: "Out of action", short: "OOA" },
  { id: "stunnedOrWorse", label: "Stunned or worse", short: "Stunned+" },
  { id: "knockedDownOrWorse", label: "Knocked down or worse", short: "KD+" },
];

export function phaseChain(
  attacker: Character,
  weapons: Weapon[],
  defender: DefenderProfile,
  context: CombatContext,
  customSkills: Skill[] = [],
  houseRules: HouseRules = defaultHouseRules(),
  phase: WeaponKind
): PhaseChain {
  const turn = resolveCharacterTurn(attacker, weapons, defender, context, customSkills, houseRules, phase);
  const d = turn.distribution;
  return {
    attacks: totalAttackCount(attacker, weapons, context, customSkills, phase),
    anyHit: turn.anyHitProbability,
    anyWound: turn.anyWoundProbability,
    knockedDownOrWorse: 1 - d.none,
    stunnedOrWorse: d.stunned + d.outOfAction,
    outOfAction: d.outOfAction,
    anyCrit: turn.criticalHitProbability,
    ooaGivenCrit: turn.outOfActionGivenCriticalHit,
  };
}

export const EMPTY_CHAIN: PhaseChain = { attacks: 0, anyHit: 0, anyWound: 0, knockedDownOrWorse: 0, stunnedOrWorse: 0, outOfAction: 0, anyCrit: 0, ooaGivenCrit: 0 };
