import { expect,it } from 'vitest'
import { resolveSingleAttack,type AttackInput } from '../../../rules/engine/resolveAttack'
import { resolveTurn } from '../../../rules/engine/turnAggregate'
import { applyRoll,startPhase } from './rollThrough'
const input:AttackInput={fishHookFallThreshold:3,hitThreshold:4,woundThreshold:2,armourThreshold:2,injuryRollModifier:2,concussion:false,trueGrit:false,hardToKill:false,critTriggerFaces:[5,6],critTable:'standard',critTableRollModifier:0,parryEligible:false,parrySuccessProbGivenAttempt:0}
const begin=(extra:Partial<AttackInput>={})=>startPhase([{weaponName:'Fish-hook Shot',input:{...input,...extra},parry:{beatsOrMatches:false,reroll:false}}],3,0)
it('replaces damage with a Strength test and knocks a multi-wound target down',()=>{
 let state=applyRoll(begin(),4)
 expect(state.pending?.kind).toBe('fishHookFall')
 state=applyRoll(state,3,true)
 expect(state.done).toBe(true);expect(state.worst).toBe('knockedDown');expect(state.woundsLost).toBe(0)
 expect(state.log.map(l=>l.text).join(' ')).toContain('entered by hand')
})
it('a failed test does no damage, six always fails, and a Dodge prevents the test',()=>{
 expect(applyRoll(applyRoll(begin(),4),4).worst).toBe('noWound')
 expect(applyRoll(applyRoll(begin({fishHookFallThreshold:10}),4),6).worst).toBe('noWound')
 let state=applyRoll(begin({dodgeThreshold:4}),4)
 expect(state.pending?.kind).toBe('dodge');state=applyRoll(state,4)
 expect(state.worst).toBe('dodged');expect(state.done).toBe(true)
 expect(applyRoll(begin(),1).done).toBe(true)
})
it('reports knock-down odds without wound, critical or OOA odds',()=>{
 const attack=resolveSingleAttack(input)
 expect(attack.pWound).toBe(0);expect(attack.pWoundTriggerEligible).toBe(0)
 const turn=resolveTurn([attack],0,3)
 expect(turn.distribution.knockedDown).toBeCloseTo(1/4)
 expect(turn.distribution.outOfAction).toBe(0)
 expect(resolveTurn([resolveSingleAttack({...input,dodgeThreshold:4,fishHookFallThreshold:2})],0,3).distribution.knockedDown).toBeCloseTo(1/12)
 expect(resolveTurn([resolveSingleAttack({...input,ignoreKnockedDownAndStunned:true})],0,3).distribution.knockedDown).toBe(0)
})


it('records Firepot smoke on a landed hit even if it fails to wound, but not misses or Dodges',()=>{
 const fire={fishHookFallThreshold:undefined,smokeOnHit:true,woundThreshold:5}
 const hit=applyRoll(applyRoll(begin(fire),4),1)
 expect(hit.smokeHit).toBe(true);expect(hit.woundsLost).toBe(0)
 expect(applyRoll(begin(fire),1).smokeHit).not.toBe(true)
 expect(applyRoll(applyRoll(begin({...fire,dodgeThreshold:4}),4),4).smokeHit).not.toBe(true)
})
