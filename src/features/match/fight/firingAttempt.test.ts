import { expect, it } from 'vitest'
import { startPhase, applyRoll, type AttackPlan } from './rollThrough'
import { firingAttemptStarted } from './firingAttempt'
const plan: AttackPlan = { weaponName:'Pistol', parry:{beatsOrMatches:false,reroll:false}, input:{hitThreshold:4,woundThreshold:4,armourThreshold:6,injuryRollModifier:0,concussion:false,trueGrit:false,hardToKill:false,critTriggerFaces:[6],critTable:'standard',critTableRollModifier:0,parryEligible:false,parrySuccessProbGivenAttempt:0} }
it('spends an automatic hit even though the first prompt is the wound roll',()=>{
 const state=startPhase([{...plan,input:{...plan.input,automaticHits:true}}],2,0)
 expect(state.pending?.kind).toBe('wound')
 expect(firingAttemptStarted(null,state)).toBe(true)
 expect(firingAttemptStarted(state,applyRoll(state,4))).toBe(false)
})
it('waits for successful firing permission and does not spend a refused shot',()=>{
 const state=startPhase([{...plan,input:{...plan.input,firePermissionThreshold:4}}],2,0)
 expect(state.pending?.kind).toBe('firePermission')
 expect(firingAttemptStarted(null,state)).toBe(false)
 expect(firingAttemptStarted(state,applyRoll(state,1))).toBe(false)
 expect(firingAttemptStarted(state,applyRoll(state,4))).toBe(true)
})
it('records an ordinary firing attempt once, including when the hit roll misses',()=>{
 const state=startPhase([plan],2,0)
 expect(firingAttemptStarted(null,state)).toBe(true)
 expect(firingAttemptStarted(state,applyRoll(state,1))).toBe(false)
})
