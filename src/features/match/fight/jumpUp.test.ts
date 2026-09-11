import { expect, it } from 'vitest'
import { injuryDistribution, injuryDistributionForWounds } from '../../../rules/engine/injury'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import { resolveSingleAttack, type AttackInput } from '../../../rules/engine/resolveAttack'
import { resolveTurn } from '../../../rules/engine/turnAggregate'
import { applyRoll, startPhase } from './rollThrough'

const input: AttackInput = { hitThreshold: 2, woundThreshold: 2, armourThreshold: IMPOSSIBLE, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, parryEligible: false, parrySuccessProbGivenAttempt: 0, ignoreRolledKnockedDown: true }
function injury(extra: Partial<AttackInput> = {}) {
  const start = startPhase([{ weaponName: 'Sword', input: { ...input, ...extra }, parry: { beatsOrMatches: false, reroll: false } }], 1, 0)
  return applyRoll(applyRoll(start, 4), 4)
}

it('Jump Up ignores a rolled knock-down, retaining wounds and an explicit log', () => {
  const state = applyRoll(injury(), 2)
  expect(state.done).toBe(true)
  expect(state.worst).toBe('ignored')
  expect(state.woundsLost).toBe(1)
  expect(state.log.map(row => row.text).join(' ')).toContain('Jump Up: ignores this rolled knocked-down result')
  expect(applyRoll(injury(), 3).worst).toBe('stunned')
  expect(applyRoll(injury(), 6).worst).toBe('outOfAction')
  expect(applyRoll(injury({ ignoreRolledKnockedDown: false }), 2).worst).toBe('knockedDown')
})

it('Jump Up leaves helmet and No Pain conversions knocked down', () => {
  const helmet = applyRoll(injury({ stunAvoidanceThreshold: 4 }), 3)
  expect(helmet.pending?.kind).toBe('stunSave')
  expect(applyRoll(helmet, 4).worst).toBe('knockedDown')
  expect(applyRoll(helmet, 1).worst).toBe('stunned')
  expect(applyRoll(injury({ stunnedBecomesKnockedDown: true }), 3).worst).toBe('knockedDown')
  expect(applyRoll(injury({ stunnedBecomesKnockedDown: true }), 2).worst).toBe('ignored')
})

it('Jump Up odds preserve converted knock-downs and total probability across multiple wounds', () => {
  const mods = { injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, ignoreRolledKnockedDown: true }
  const normal = injuryDistribution(mods)
  expect(normal.none).toBeCloseTo(1 / 3)
  expect(normal.knockedDown).toBe(0)
  expect(normal.stunned).toBeCloseTo(1 / 3)
  expect(injuryDistribution({ ...mods, stunAvoidanceThreshold: 4 }).knockedDown).toBeCloseTo(1 / 6)
  expect(injuryDistribution({ ...mods, stunnedBecomesKnockedDown: true }).knockedDown).toBeCloseTo(1 / 3)
  expect(injuryDistribution({ ...mods, concussion: true }).none).toBeCloseTo(1 / 6)
  expect(injuryDistribution({ ...mods, injuryRollModifier: 1 }).none).toBeCloseTo(1 / 6)
  expect(injuryDistribution({ ...mods, ignoreKnockedDownAndStunned: true }).none).toBeCloseTo(2 / 3)
  const multi = injuryDistributionForWounds(mods, 2)
  expect(multi.none).toBeCloseTo(1 / 9)
  expect(multi.outOfAction).toBeCloseTo(5 / 9)
  expect(Object.values(multi).reduce((sum, probability) => sum + probability, 0)).toBeCloseTo(1)
  expect(resolveTurn([resolveSingleAttack(input)], 0, 1).distribution.knockedDown).toBe(0)
})
