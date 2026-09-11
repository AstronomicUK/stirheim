import { expect, it } from 'vitest'
import { resolveSingleAttack, type AttackInput } from '../../../rules/engine/resolveAttack'
import { resolveTurn } from '../../../rules/engine/turnAggregate'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import { applyRoll, startPhase } from './rollThrough'
const input: AttackInput = { chainShotKnockdown: true, hitThreshold: 4, woundThreshold: 4, armourThreshold: 4, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, parryEligible: false, parrySuccessProbGivenAttempt: 0 }
const begin = (extra: Partial<AttackInput> = {}) => startPhase([{ weaponName: 'Chain Shot', input: { ...input, ...extra }, parry: { beatsOrMatches: false, reroll: false } }], 3, 0)
it('knocks an unwounded multi-wound target down without losing a wound, even if normally immune', () => {
  let s = applyRoll(applyRoll(begin({ ignoreKnockedDownAndStunned: true }), 4), 1)
  expect(s.pending?.kind).toBe('chainKnockdown')
  s = applyRoll(s, 4)
  expect(s.done).toBe(true)
  expect(s.worst).toBe('knockedDown')
  expect(s.woundsLost).toBe(0)
})
it('offers the same test after a saved wound, but never on a miss, Dodge or unsaved wound', () => {
  let s = applyRoll(applyRoll(applyRoll(begin(), 4), 4), 4)
  expect(s.pending?.kind).toBe('chainKnockdown')
  s = applyRoll(s, 3)
  expect(s.worst).toBe('saved')
  expect(applyRoll(begin(), 1).done).toBe(true)
  expect(applyRoll(applyRoll(begin({ dodgeThreshold: 4 }), 4), 4).worst).toBe('dodged')
  expect(applyRoll(applyRoll(applyRoll(begin(), 4), 4), 1).worst).toBe('wounded')
})
it('matches the hand-calculated knock-down probability and preserves damage probability', () => {
  const result = resolveTurn([resolveSingleAttack(input)], 0, 3)
  // Hit 1/2; fail to wound 1/2 OR wound 1/2 and save 1/2; knock-down 1/2.
  expect(result.distribution.knockedDown).toBeCloseTo(3 / 16, 12)
  expect(result.anyWoundProbability).toBeCloseTo(1 / 8, 12)
  expect(Object.values(result.distribution).reduce((a, b) => a + b)).toBeCloseTo(1, 12)
  const dodged = resolveTurn([resolveSingleAttack({ ...input, dodgeThreshold: 4, firePermissionThreshold: 4 })], 0, 3)
  expect(dodged.distribution.knockedDown).toBeCloseTo(3 / 64, 12)
  const impossible = resolveTurn([resolveSingleAttack({ ...input, woundThreshold: IMPOSSIBLE, ignoreKnockedDownAndStunned: true })], 0, 3)
  expect(impossible.distribution.knockedDown).toBeCloseTo(1 / 4, 12)
})
it('retains knock-down mass through the ordinary and strengthened misfire branches', () => {
  const noWound = { ...input, woundThreshold: IMPOSSIBLE }
  const result = resolveTurn([resolveSingleAttack({ ...noWound, misfireEnhanced: noWound })], 0, 3)
  expect(result.distribution.knockedDown).toBeCloseTo((1 / 2 + 1 / 36) / 2, 12)
})
