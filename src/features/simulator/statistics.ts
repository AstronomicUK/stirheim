import { findWeapon } from '../../rules/data/weapons'
import { resolveSingleAttack } from '../../rules/engine/resolveAttack'
import type { Stats } from '../../rules/types'
import { defaultOffHand, defaultPrimary, loadoutFor, type Combatant } from '../match/fight/combatants'
import { computeOdds, type FightSetup } from '../match/fight/odds'

export type Direction = 'attacking' | 'defending'
export type AttackMeasure = 'any' | 'all'
export interface StageProbability { any: number; all: number }
export interface StageResult { hit: StageProbability; wound: StageProbability; combined: StageProbability; ooa: number; attacks: number; notes: string[] }
export type Upgrade = { stat: keyof Stats } | { skill: string }

/** A neutral reference, deliberately independent of any roster or selected Simulation opponent. */
export function referenceOpponent(model: Combatant): Combatant {
  return { ...model, id: 'statistics-reference', name: 'Reference opponent', typeName: 'Unarmoured warrior',
    stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    equipment: [{ itemId: 'hammer', quantity: 1 }], skillIds: [], traitIds: [], skillTableIds: [], woundsLost: 0, out: false }
}

export function upgradeCombatant(model: Combatant, upgrade: Upgrade): Combatant {
  return 'stat' in upgrade
    ? { ...model, stats: { ...model.stats, [upgrade.stat]: model.stats[upgrade.stat] + 1 } }
    : { ...model, skillIds: [...new Set([...model.skillIds, upgrade.skill])] }
}

export function reverseSetup(setup: FightSetup, incoming?: number): FightSetup {
  const source = setup.defender
  const attacker = incoming === undefined ? source : { ...source, stats: { ...source.stats, A: incoming } }
  const melee = setup.defenderKit.melee
  // Statistics examines incoming hand-to-hand blows; Simulation uses the selected phase.
  const primary = incoming !== undefined || setup.primary.type === 'melee' ? defaultPrimary(melee) : setup.defenderKit.ranged[0] ?? findWeapon('bow')!
  return { ...setup, attacker, attackerKit: setup.defenderKit, defender: setup.attacker, defenderKit: setup.attackerKit,
    primary, offHand: incoming === undefined && primary.type === 'melee' ? defaultOffHand(melee, primary) : null,
    woundsAlreadyLost: setup.attacker.woundsLost }
}

export function withUpgrade(setup: FightSetup, direction: Direction, upgrade: Upgrade): FightSetup {
  if (direction === 'attacking') {
    const attacker = upgradeCombatant(setup.attacker, upgrade)
    return { ...setup, attacker, attackerKit: loadoutFor(attacker) }
  }
  const defender = upgradeCombatant(setup.defender, upgrade)
  return { ...setup, defender, defenderKit: loadoutFor(defender) }
}

export function atOpponent(setup: FightSetup, direction: Direction, ws: number, power: number): FightSetup {
  if (direction === 'attacking') return { ...setup, defender: { ...setup.defender, stats: { ...setup.defender.stats, WS: ws, T: power } } }
  return { ...setup, attacker: { ...setup.attacker, stats: { ...setup.attacker.stats, WS: ws, S: power } } }
}

/** Raw roll stages exclude parries and saves; the engine's whole-phase OOA includes them. */
export function stageOdds(setup: FightSetup): StageResult {
  const odds = computeOdds(setup)
  const rolls = odds.weapons.map((w) => {
    const raw = resolveSingleAttack({ ...w.input, dodgeThreshold: undefined })
    const conditional = raw.pHit > 0 ? raw.pWound / raw.pHit : resolveSingleAttack({ ...w.input, automaticHits: true, dodgeThreshold: undefined }).pWound
    return { count: w.attacks, hit: raw.pHit, wound: conditional, combined: raw.pWound }
  })
  const aggregate = (key: 'hit' | 'wound' | 'combined'): StageProbability => odds.attacks === 0 ? { any: 0, all: 0 } : {
    any: 1 - rolls.reduce((p, r) => p * (1 - r[key]) ** r.count, 1),
    all: rolls.reduce((p, r) => p * r[key] ** r.count, 1),
  }
  return { hit: aggregate('hit'), wound: aggregate('wound'), combined: aggregate('combined'), ooa: odds.chain.outOfAction, attacks: odds.attacks, notes: odds.notes }
}
