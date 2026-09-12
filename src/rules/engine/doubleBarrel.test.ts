import { expect, it } from 'vitest'
import { resolveSingleAttack, type AttackInput } from './resolveAttack'
import { resolveTurn } from './turnAggregate'
import { IMPOSSIBLE } from './dice'
const input:AttackInput={barrels:2,hitThreshold:4,woundThreshold:4,armourThreshold:IMPOSSIBLE,injuryRollModifier:0,concussion:false,trueGrit:false,hardToKill:false,critTriggerFaces:[],critTable:'standard',critTableRollModifier:0,parryEligible:false,parrySuccessProbGivenAttempt:0}
it('shares the hit probability across two wound rolls instead of rolling two attacks',()=>{
 const result=resolveTurn([resolveSingleAttack(input)],0,3)
 expect(result.anyHitProbability).toBeCloseTo(.5)
 expect(result.anyWoundProbability).toBeCloseTo(.5*(1-.5**2))
 expect(result.attacks).toBe(1)
 expect(Object.values(result.distribution).reduce((a,b)=>a+b,0)).toBeCloseTo(1)
})
it('applies Dodge and permission once to the shared shot',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,dodgeThreshold:4,firePermissionThreshold:4})],0,3)
 expect(result.anyHitProbability).toBeCloseTo(.25)
 expect(result.anyWoundProbability).toBeCloseTo(.5*.5*.5*.75)
})
it('allows both barrels to cause a critical against a high-wound target',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,automaticHits:true,critTriggerFaces:[6]})],0,4)
 // Both standard criticals cause at least two wounds, so OOA is possible only with two criticals.
 expect(result.outOfActionProbability).toBeGreaterThan(0)
 expect(result.criticalHitProbability).toBeCloseTo(1-(5/6)**2)
})
it('an impossible hit leaves the target untouched',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,hitThreshold:IMPOSSIBLE})])
 expect(result.anyWoundProbability).toBe(0)
 expect(result.distribution.none).toBe(1)
})

it('Ostland resolves Dodge separately for each of its two hits',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,separateBarrelHits:true,dodgeThreshold:4})],0,3)
 expect(result.anyWoundProbability).toBeCloseTo(.5*(1-.75**2))
 expect(Object.values(result.distribution).reduce((a,b)=>a+b,0)).toBeCloseTo(1)
})
it('Ostland retains the normal one-critical limit',()=>{
 const result=resolveTurn([resolveSingleAttack({...input,separateBarrelHits:true,automaticHits:true,critTriggerFaces:[6]})],0,4)
 expect(result.outOfActionProbability).toBe(0)
 expect(result.criticalHitProbability).toBeCloseTo(1-(5/6)**2)
})

it('a parry of a Nuln shared hit stops both wound rolls',()=>{
 const attack=resolveSingleAttack({...input,parryEligible:true,parrySuccessProbGivenAttempt:.5})
 expect(resolveTurn([attack],1,3).anyWoundProbability).toBeCloseTo(.5*.5*.75)
})
it('a single parry of Ostlander two hits leaves the second hit to resolve',()=>{
 const attack=resolveSingleAttack({...input,separateBarrelHits:true,parryEligible:true,parrySuccessProbGivenAttempt:1})
 expect(resolveTurn([attack],1,3).anyWoundProbability).toBeCloseTo(.5*.5)
 expect(resolveTurn([attack],2,3).anyWoundProbability).toBe(0)
})
