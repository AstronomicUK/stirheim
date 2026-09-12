import { expect, it } from 'vitest'
import type { AttackInput } from '../../../rules/engine/resolveAttack'
import { applyRoll, startPhase } from './rollThrough'
const input: AttackInput = { ignitionThreshold: 5, hitThreshold: 4, woundThreshold: 4, armourThreshold: 2, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [6], critTable: 'standard', critTableRollModifier: 0, parryEligible: false, parrySuccessProbGivenAttempt: 0 }
const begin = (extra: Partial<AttackInput> = {}, attacks = 1) => startPhase(Array.from({ length: attacks }, () => ({ weaponName: 'Brazier Iron', input: { ...input, ...extra }, parry: { beatsOrMatches: false, reroll: false } })), 3, 0)
it('ignites from a hit even if the separate wound fails, preserving the app roll log', () => {
 let state = applyRoll(begin(), 4)
 expect(state.pending?.kind).toBe('ignition')
 state = applyRoll(state, 5, false)
 expect(state.targetOnFire).toBe(true); expect(state.pending?.kind).toBe('wound')
 state = applyRoll(state, 1)
 expect(state.done).toBe(true); expect(state.woundsLost).toBe(0); expect(state.targetOnFire).toBe(true)
 expect(state.log.map(l => l.text).join(' ')).toContain('Ignition: rolled 5 (rolled by the app)')
})
it('failed ignition continues damage and an armour save does not extinguish successful ignition', () => {
 let state = applyRoll(applyRoll(begin(), 4), 4)
 expect(state.targetOnFire).toBeFalsy(); expect(state.pending?.kind).toBe('wound')
 state = applyRoll(applyRoll(state, 4), 2)
 expect(state.worst).toBe('saved')
 const burning = applyRoll(applyRoll(applyRoll(applyRoll(begin(), 4), 6), 4), 2)
 expect(burning.worst).toBe('saved'); expect(burning.targetOnFire).toBe(true)
})
it('misses and dodged hits never ignite; a lower threshold is honoured', () => {
 expect(applyRoll(begin(), 1).targetOnFire).toBeUndefined()
 expect(applyRoll(applyRoll(begin({ dodgeThreshold: 4 }), 4), 4).targetOnFire).toBeUndefined()
 expect(applyRoll(applyRoll(begin({ ignitionThreshold: 2 }), 4), 2).targetOnFire).toBe(true)
})
it('retains fire across later failed ignition attempts without repeating a hit test', () => {
 let state = begin({}, 2)
 while (!state.done) state = applyRoll(state, state.pending?.kind === 'hit' ? 4 : state.pending?.kind === 'ignition' ? state.targetOnFire ? 1 : 5 : 1)
 expect(state.targetOnFire).toBe(true)
 expect(state.log.filter(l => l.text.startsWith('Ignition:'))).toHaveLength(2)
})

it('a final natural 1 saves a Cathayan backfire instead of hitting or igniting the intended target', () => {
 const result = applyRoll(begin({ volatileBackfire: true }), 1, false)
 expect(result.done).toBe(true); expect(result.worst).toBe('backfire'); expect(result.volatileBackfires).toBe(1)
 expect(result.woundsLost).toBe(0); expect(result.targetOnFire).toBeUndefined()
 expect(result.log.map(l => l.text).join(' ')).toContain('rolled 1 (rolled by the app)')
})
it('a permitted hit reroll replaces the original die; only the final 1 backfires', () => {
 let state = applyRoll(begin({ volatileBackfire: true, rerollToHit: true }), 1)
 expect(state.pending?.kind).toBe('hitReroll'); expect(state.volatileBackfires).toBeUndefined()
 expect(applyRoll(state, 1).volatileBackfires).toBe(1)
 state = applyRoll(state, 4)
 expect(state.pending?.kind).toBe('ignition'); expect(state.volatileBackfires).toBeUndefined()
})
it('two backfires in a phase require two separate self-hits', () => {
 let state = begin({ volatileBackfire: true }, 2)
 while (!state.done) state = applyRoll(state, 1)
 expect(state.volatileBackfires).toBe(2)
})

it('a Bolas natural 1 owes S3 self-damage without entangling or wounding the target', () => {
 const result = applyRoll(begin({ ignitionThreshold: undefined, entangleInsteadOfWound: true }), 1)
 expect(result.bolasBackfires).toBe(1); expect(result.volatileBackfires).toBeUndefined()
 expect(result.worst).toBe('backfire'); expect(result.woundsLost).toBe(0)
 expect(result.log.map(l => l.text).join(' ')).toContain('Strength 3 hit')
 const reroll = applyRoll(begin({ ignitionThreshold: undefined, entangleInsteadOfWound: true, rerollToHit: true }), 1)
 expect(reroll.bolasBackfires).toBeUndefined()
 expect(applyRoll(reroll, 4).worst).toBe('entangled')
})
