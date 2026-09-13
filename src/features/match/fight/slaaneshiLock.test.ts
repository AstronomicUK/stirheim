import {expect,it} from 'vitest'
import {resolveSingleAttack,type AttackInput} from '../../../rules/engine/resolveAttack'
import {resolveTurn} from '../../../rules/engine/turnAggregate'
import {applyRoll,startPhase} from './rollThrough'
const input:AttackInput={slaaneshiLock:true,hitThreshold:4,woundThreshold:4,armourThreshold:4,injuryRollModifier:0,concussion:false,trueGrit:false,hardToKill:false,critTriggerFaces:[],critTable:'standard',critTableRollModifier:0,parryEligible:false,parrySuccessProbGivenAttempt:0}
const plan={weaponName:'Slaaneshi Man-Catcher',input,parry:{beatsOrMatches:false,reroll:false}}
it('locks even a multi-wound target after an unsaved wound and stops to record the hold',()=>{
 let state=startPhase([plan,plan],3,0)
 state=applyRoll(applyRoll(applyRoll(state,4),4),1)
 expect(state).toMatchObject({done:true,pending:null,worst:'knockedDown',slaaneshiLock:true,woundsLost:1})
 expect(state.outcomes).toHaveLength(1)
 expect(state.outOfActionWeaponId).toBeUndefined()
})
it('does not lock a saved wound or failed attack',()=>{
 const saved=applyRoll(applyRoll(applyRoll(startPhase([plan],1,0),4),4),4)
 expect(saved.slaaneshiLock).toBeUndefined();expect(saved.worst).toBe('saved')
 expect(applyRoll(startPhase([plan],1,0),1).slaaneshiLock).toBeUndefined()
})
it('replaces the knocked-down automatic injury with a hold on an unsaved wound',()=>{
 let state=startPhase([{...plan,input:{...input,autoHitKnockedDown:true}}],1,0)
 state=applyRoll(applyRoll(state,4),1)
 expect(state).toMatchObject({done:true,worst:'knockedDown',slaaneshiLock:true})
})
it('matches hit × wound × failed save with zero OOA probability for fresh targets',()=>{
 for(const wounds of [1,3]){
  const result=resolveTurn([resolveSingleAttack(input)],0,wounds)
  expect(result.distribution.knockedDown).toBeCloseTo(1/8,12)
  expect(result.outOfActionProbability).toBe(0)
  expect(result.anyWoundProbability).toBeCloseTo(1/8,12)
 }
})

it('waits for every eligible save before deciding that a hold exists',()=>{
 const wardPlan={...plan,input:{...input,wardSaveThreshold:4}}
 let state=applyRoll(applyRoll(applyRoll(startPhase([wardPlan],1,0),4),4),1)
 expect(state.pending?.kind).toBe('ward');expect(state.slaaneshiLock).toBeUndefined()
 state=applyRoll(state,4);expect(state.slaaneshiLock).toBeUndefined()
})
it('keeps injury and critical modifiers from turning the lock into an injury result',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,critTriggerFaces:[6],critTable:'thrusting',injuryRollModifier:3,ignoreRolledKnockedDown:true})],0,1)
 expect(result.outOfActionProbability).toBe(0)
 expect(result.distribution.stunned).toBe(0)
 expect(result.distribution.knockedDown).toBeGreaterThan(0)
})
