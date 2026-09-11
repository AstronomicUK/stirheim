import { expect, it } from 'vitest'
import { resolveSingleAttack, type AttackInput } from './resolveAttack'
import { resolveTurn } from './turnAggregate'
import { mixRangedAttacks } from './mixRangedAttacks'
const input: AttackInput = { hitThreshold: 4, woundThreshold: 4, armourThreshold: 5, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [6], critTable: 'standard', critTableRollModifier: 0, parryEligible: false, parrySuccessProbGivenAttempt: 0 }
it('preserves branch-specific saves and one-crit-per-phase state rather than averaging the wound profiles', () => {
  const ordinary = resolveSingleAttack(input)
  const stronger = resolveSingleAttack({ ...input, automaticHits: true, woundThreshold: 3, armourThreshold: 6 })
  const mixed = mixRangedAttacks([{ probability: 0.75, attack: ordinary }, { probability: 0.25, attack: stronger }])
  const result = resolveTurn([mixed, mixed], 0, 2)
  const possibilities = [[ordinary, ordinary, 0.75 * 0.75], [ordinary, stronger, 0.75 * 0.25], [stronger, ordinary, 0.25 * 0.75], [stronger, stronger, 0.25 * 0.25]] as const
  for (const key of ['outOfActionProbability', 'anyHitProbability', 'anyWoundProbability', 'criticalHitProbability', 'ricochetProbability'] as const) {
    const expected = possibilities.reduce((n, [a, b, weight]) => n + weight * resolveTurn([a, b], 0, 2)[key], 0)
    expect(result[key]).toBeCloseTo(expected, 12)
  }
  expect(Object.values(result.distribution).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
})
it('rejects incomplete probability mass and melee parry branches', () => {
  const attack = resolveSingleAttack(input)
  expect(() => mixRangedAttacks([{ probability: 0.5, attack }])).toThrow(/totalling/)
  expect(() => mixRangedAttacks([{ probability: 1, attack: { ...attack, parryEligible: true } }])).toThrow(/parried/)
})
