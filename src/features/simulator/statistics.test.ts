import { describe, expect, it } from 'vitest'
import { findWeapon } from '../../rules/data/weapons'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import { loadoutFor } from '../match/fight/combatants'
import { combatContextFor, computeOdds, type FightSetup } from '../match/fight/odds'
import { combatantFromTemplate, defaultTemplateSide } from './model'
import { atOpponent, referenceOpponent, reverseSetup, stageOdds, withUpgrade } from './statistics'

function fixture(): FightSetup {
  const attacker = combatantFromTemplate({ ...defaultTemplateSide('mercenaries_reikland'), itemIds: ['hammer'] })!
  attacker.stats = { ...attacker.stats, WS: 3, S: 3, A: 2 }
  const defender = referenceOpponent(attacker)
  const houseRules = applyHouseRuleDefaults(undefined)
  return { attacker, defender, attackerKit: loadoutFor(attacker), defenderKit: loadoutFor(defender), primary: findWeapon('hammer')!, offHand: null, houseRules, context: combatContextFor(houseRules, {}) }
}

describe('Statistics stage probabilities', () => {
  it('separates conditional wound chances from combined hit-and-wound chances', () => {
    const result = stageOdds(fixture())
    expect(result.hit).toEqual({ any: 0.75, all: 0.25 })
    expect(result.wound).toEqual({ any: 0.75, all: 0.25 })
    expect(result.combined).toEqual({ any: 0.4375, all: 0.0625 })
  })
  it('changing selected WS affects combined odds but not the conditional wound table', () => {
    const setup = fixture()
    const low = stageOdds(atOpponent(setup, 'attacking', 1, 3))
    const high = stageOdds(atOpponent(setup, 'attacking', 10, 3))
    expect(low.hit.any).toBeGreaterThan(high.hit.any)
    expect(low.wound).toEqual(high.wound)
    expect(low.combined.any).toBeGreaterThan(high.combined.any)
  })
  it('aggregates different main-hand and off-hand wound probabilities using their own attack counts', () => {
    const setup = fixture()
    setup.attacker.equipment = [{ itemId: 'halberd', quantity: 1 }, { itemId: 'dagger', quantity: 1 }]
    setup.attackerKit = loadoutFor(setup.attacker)
    setup.primary = findWeapon('halberd')!
    setup.offHand = findWeapon('dagger')!
    const result = stageOdds(setup)
    expect(result.attacks).toBe(3)
    expect(result.wound.all).toBeCloseTo((2 / 3) ** 2 * 0.5)
    expect(result.wound.any).toBeCloseTo(1 - (1 / 3) ** 2 * 0.5)
  })
  it('uses incoming attacks and opponent Strength for defending, while upgrading the selected defender', () => {
    const setup = reverseSetup(fixture(), 3)
    const weak = stageOdds(atOpponent(setup, 'defending', 3, 2))
    const strong = stageOdds(atOpponent(setup, 'defending', 3, 5))
    expect(weak.attacks).toBe(3)
    expect(weak.wound.any).toBeLessThan(strong.wound.any)
    const improved = withUpgrade(setup, 'defending', { stat: 'T' })
    expect(improved.attacker.stats).toEqual(setup.attacker.stats)
    expect(stageOdds(improved).wound.any).toBeLessThan(stageOdds(setup).wound.any)
  })
  it('keeps raw stages before saves, but uses the whole engine for multi-Wound OOA', () => {
    const setup = fixture()
    const bare = stageOdds(setup)
    const tough = { ...setup, defender: { ...setup.defender, stats: { ...setup.defender.stats, W: 4 } } }
    const result = stageOdds(tough)
    expect(result.combined).toEqual(bare.combined)
    expect(result.ooa).toBeLessThan(bare.ooa)
    expect(result.ooa).toBe(computeOdds(tough).chain.outOfAction)
    const armoured = { ...setup.defender, equipment: [{ itemId: 'heavy_armour', quantity: 1 }, { itemId: 'shield', quantity: 1 }] }
    const saved = stageOdds({ ...setup, defender: armoured, defenderKit: loadoutFor(armoured) })
    expect(saved.combined).toEqual(bare.combined)
    expect(saved.ooa).toBeLessThan(bare.ooa)
  })
  it('applies actual skill effects to before/after calculations', () => {
    const setup = fixture()
    const improved = withUpgrade(setup, 'attacking', { skill: 'strike_to_injure' })
    expect(stageOdds(improved).ooa).toBeGreaterThan(stageOdds(setup).ooa)
  })
  it('shows zero for both measures when a move-or-fire weapon cannot attack', () => {
    const setup = fixture()
    setup.primary = findWeapon('crossbow')!
    setup.context.movedThisTurn = true
    const result = stageOdds(setup)
    expect(result.attacks).toBe(0)
    expect(result.hit).toEqual({ any: 0, all: 0 })
    expect(result.wound).toEqual({ any: 0, all: 0 })
  })
})
