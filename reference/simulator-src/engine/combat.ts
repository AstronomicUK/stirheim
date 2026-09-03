// Top-level orchestration: character + equipped weapons + defender + context -> full-phase result.
// Ties together buildAttackInput.ts (per-weapon modifiers), resolveSingleAttack (per-attack math)
// and turnAggregate.ts (the crit/parry-consumption DP).

import type { Character, CombatContext, DefenderProfile, HouseRules, Skill, Weapon, WeaponKind } from "../types";
import { defaultHouseRules } from "../types";
import { buildAttackInput, computeAttackCount, computeMaxParries, weaponsForPhase } from "./buildAttackInput";
import { resolveSingleAttack } from "./resolveAttack";
import { resolveTurn, type TurnResult } from "./turnAggregate";

/**
 * Resolves one phase for `attacker` fighting with `weapons`, in the order given. The shooting
 * phase and the hand-to-hand phase are separate things in Mordheim (each with its own one-crit
 * limit, 01:707), so only weapons of `phase` take part — a bow in a melee loadout is ignored, and
 * vice versa. Default phase: the first weapon's type. Pass the primary melee weapon first and any
 * off-hand weapon second — that determines attack-count allocation (see computeAttackCount) and
 * which attack gets first claim on the phase's one critical hit and the defender's Parry.
 */
export function resolveCharacterTurn(
  attacker: Character,
  weapons: Weapon[],
  defender: DefenderProfile,
  context: CombatContext,
  customSkills: Skill[] = [],
  houseRules: HouseRules = defaultHouseRules(),
  phase?: WeaponKind
): TurnResult {
  const inPhase = weaponsForPhase(weapons, phase ?? weapons[0]?.type ?? "melee");
  const attacks = inPhase.flatMap((weapon, index) => {
    const isPrimary = index === 0;
    const count = computeAttackCount(attacker, weapon, isPrimary, context, customSkills);
    const input = buildAttackInput({ attacker, weapon, defender, context, customSkills, houseRules });
    const resolved = resolveSingleAttack(input);
    return Array.from({ length: count }, () => resolved);
  });

  const maxParries = computeMaxParries(defender, customSkills);
  return resolveTurn(attacks, maxParries, defender.W);
}
