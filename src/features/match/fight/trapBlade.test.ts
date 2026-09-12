import { expect, it } from 'vitest'
import type { BrokenWeapon } from '../../../domain'
import { applyRoll, startPhase, type AttackPlan } from './rollThrough'
const heldWeapon: BrokenWeapon = { itemId: 'item', warbandId: 'band', holderId: 'hero', holderType: 'hero', weaponId: 'sword', name: 'Sword', quantity: 1, copyIndex: 0, expected: { item_rules_id: 'sword', custom_name: null, quantity: 2, notes: null } }
const plan: AttackPlan = { weaponName: 'Sword', heldWeapon, swordBreakerParry: true, parry: { beatsOrMatches: false, reroll: false }, input: { hitThreshold: 4, woundThreshold: 4, armourThreshold: 7, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, parryEligible: true, parrySuccessProbGivenAttempt: 1 / 3 } }
it('only a successful parry offers Trap Blade; 4+ records the physical copy', () => {
 let state = applyRoll(startPhase([plan], 3, 1), 4)
 expect(state.pending?.kind).toBe('parry')
 state = applyRoll(state, 5)
 expect(state.pending?.kind).toBe('trapBlade'); expect(state.pending?.who).toBe('defender')
 const broken = applyRoll(state, 4, false)
 expect(broken.brokenWeapons).toEqual([heldWeapon]); expect(broken.woundsLost).toBe(0); expect(broken.worst).toBe('parried')
 expect(applyRoll(state, 3).brokenWeapons).toBeUndefined()
 expect(applyRoll(applyRoll(startPhase([plan], 3, 1), 4), 3).pending?.kind).toBe('wound')
})
it('does not invent a breakable item for natural attacks or another parrying weapon', () => {
 for (const altered of [{ ...plan, heldWeapon: undefined }, { ...plan, swordBreakerParry: false }]) {
  expect(applyRoll(applyRoll(startPhase([altered], 3, 1), 4), 5).pending).toBeNull()
 }
})
it('retains other hits already rolled in the phase when a weapon breaks', () => {
 let state = startPhase([plan, plan], 3, 1)
 state = applyRoll(applyRoll(state, 4), 4)
 state = applyRoll(applyRoll(state, 5), 4)
 expect(state.brokenWeapons).toEqual([heldWeapon])
 expect(state.pending?.kind).toBe('wound')
 expect(applyRoll(state, 1).done).toBe(true)
})
it('keeps separate copies in a single physical stack distinguishable', () => {
 const other = { ...plan, heldWeapon: { ...heldWeapon, copyIndex: 1 } }
 let state = startPhase([plan, other], 3, 2)
 state = applyRoll(applyRoll(state, 4), 4)
 state = applyRoll(applyRoll(state, 5), 4)
 state = applyRoll(applyRoll(state, 5), 4)
 expect(state.brokenWeapons?.map(w => w.copyIndex)).toEqual([0, 1])
})
