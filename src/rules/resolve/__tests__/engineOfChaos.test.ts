import {expect,it} from 'vitest'
import {canManCatcherCapture,enginePrisonLoad,hashutRewardPlan,resolveHashutReward} from '../engineOfChaos'
const prisoners=(count:number,large=false)=>Array.from({length:count},(_,i)=>({id:`c${i}`,large}))
it('counts Large captives as two places without inflating the number sacrificed',()=>{
 const held=prisoners(3,true)
 expect(enginePrisonLoad(held)).toEqual({models:3,used:6,free:0,overCapacity:false})
 expect(resolveHashutReward(hashutRewardPlan(held),[])).toEqual({xp:1,gold:0,xpRecipient:'leader'})
 expect(()=>hashutRewardPlan(prisoners(4,true))).toThrow('six places')
 expect(()=>enginePrisonLoad([{id:'same',large:false},{id:'same',large:false}])).toThrow('same captive')
})
it('requires the actual capture weapon and an available Engine and excludes animals and Large targets',()=>{
 const input={outOfAction:true,usedManCatcher:true,engineAvailable:true,targetLarge:false,targetAnimal:false}
 expect(canManCatcherCapture(input)).toBe(true)
 for(const change of [{outOfAction:false},{usedManCatcher:false},{engineAvailable:false},{targetLarge:true},{targetAnimal:true}])expect(canManCatcherCapture({...input,...change})).toBe(false)
})
it('awards the correct return reward and refuses missing or extra dice',()=>{
 expect(resolveHashutReward(hashutRewardPlan(prisoners(4)),[2])).toEqual({xp:2,gold:0,xpRecipient:'heroes'})
 expect(resolveHashutReward(hashutRewardPlan(prisoners(6)),[2,3],4)).toEqual({xp:5,gold:20,xpRecipient:'heroes'})
 expect(()=>resolveHashutReward(hashutRewardPlan(prisoners(6)),[2,3])).toThrow('D6')
 expect(()=>resolveHashutReward(hashutRewardPlan(prisoners(4)),[4])).toThrow('D3')
 expect(()=>resolveHashutReward(hashutRewardPlan(prisoners(2)),[],4)).toThrow('does not award gold')
 expect(()=>hashutRewardPlan([])).toThrow('at least one')
})
