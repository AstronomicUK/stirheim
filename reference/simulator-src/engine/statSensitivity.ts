// Stat Gain Analyser — measures "+1 to each of WS/BS/S/T/A" as the cumulative per-phase chain
// (see chain.ts) in BOTH directions: attacking (the character attacks the reference opponent with
// the phase's weapons) and defending (a synthetic opponent with the reference WS/S/BS and a chosen
// weapon attacks the character). Toughness and Weapon Skill only ever pay off defensively, so
// without the defensive side the table would say "+1 T is worth nothing". Wounds count defensively
// too (a W2 model has to lose both before Injury is rolled). I and Ld are recorded on the character
// sheet but not modelled — flagged rather than silently dropped.

import type { Character, CombatContext, DefenderProfile, HouseRules, Skill, Stats, Weapon, WeaponKind } from "../types";
import { defaultHouseRules } from "../types";
import { characterToDefenderProfile } from "../domain/opponentScenario";
import { syntheticAttacker } from "./skillSensitivity";
import { phaseChain, type ChainMetric, type PhaseChain } from "./chain";

const MODELED_STATS: (keyof Stats)[] = ["WS", "BS", "S", "T", "W", "A"];
const NOT_MODELED_STATS: (keyof Stats)[] = ["I", "Ld"];

/** Which stats can matter in each direction for a given phase and loadout — used by the UI to label "no effect" cells honestly instead of showing 0.00. Strength only matters offensively if some weapon strikes at the wielder's own Strength (missile weapons have a fixed Strength; thrown weapons use the thrower's). */
export function statRelevance(stat: keyof Stats, phase: WeaponKind, weapons: Weapon[] = []): { offensive: boolean; defensive: boolean } {
  switch (stat) {
    case "WS":
      return { offensive: phase === "melee", defensive: phase === "melee" };
    case "BS":
      return { offensive: phase === "ranged", defensive: false };
    case "S":
      return { offensive: weapons.length === 0 || weapons.some((w) => w.strength === "user"), defensive: false };
    case "T":
    case "W":
      return { offensive: false, defensive: true };
    case "A":
      return { offensive: phase === "melee", defensive: false };
    default:
      return { offensive: false, defensive: false };
  }
}

export interface StatGainRow {
  stat: keyof Stats;
  modeled: boolean;
  /** Character attacking the opponent, after the +1. */
  attack: PhaseChain;
  /** Opponent attacking the character, after the +1 (lower is better). */
  defend: PhaseChain;
}

export interface StatGainBreakdown {
  /** The character as they are now. */
  baselineAttack: PhaseChain;
  baselineDefend: PhaseChain;
  rows: StatGainRow[];
}

export interface StatGainParams {
  character: Character;
  /** The character's weapons for this phase (other-phase weapons are ignored). */
  weapons: Weapon[];
  defender: DefenderProfile;
  /** The reference opponent's weapon when THEY attack the character (defensive side). */
  opponentWeapon: Weapon;
  /** The reference opponent's Strength / Ballistic Skill when attacking. */
  opponentS: number;
  opponentBS?: number;
  opponentA?: number;
  context: CombatContext;
  customSkills?: Skill[];
  houseRules?: HouseRules;
  phase: WeaponKind;
}

export function computeStatGainBreakdown({ character, weapons, defender, opponentWeapon, opponentS, opponentBS = 3, opponentA = 1, context, customSkills = [], houseRules = defaultHouseRules(), phase }: StatGainParams): StatGainBreakdown {
  const attacker = syntheticAttacker(defender.WS, opponentS, opponentBS, opponentA);
  const attackWith = (c: Character) => phaseChain(c, weapons, defender, context, customSkills, houseRules, phase);
  const defendWith = (c: Character) => phaseChain(attacker, [opponentWeapon], characterToDefenderProfile(c, weapons), context, customSkills, houseRules, opponentWeapon.type);

  const baselineAttack = attackWith(character);
  const baselineDefend = defendWith(character);

  const rows: StatGainRow[] = MODELED_STATS.map((stat) => {
    const modified: Character = { ...character, stats: { ...character.stats, [stat]: character.stats[stat] + 1 } };
    return { stat, modeled: true, attack: attackWith(modified), defend: defendWith(modified) };
  });
  for (const stat of NOT_MODELED_STATS) rows.push({ stat, modeled: false, attack: baselineAttack, defend: baselineDefend });

  return { baselineAttack, baselineDefend, rows };
}

/** Improvement in `metric` for a candidate vs the baseline: positive = better for the character in both directions. */
export function attackGain(baseline: PhaseChain, candidate: PhaseChain, metric: ChainMetric): number {
  return candidate[metric] - baseline[metric];
}

export function defendGain(baseline: PhaseChain, candidate: PhaseChain, metric: ChainMetric): number {
  return baseline[metric] - candidate[metric];
}
