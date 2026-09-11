import {expect,it} from 'vitest'
import {injuryDistribution,injuryDistributionForWounds} from '../injury'
it('retains only OOA in Veskit injury probabilities, including multiple wounds',()=>{
 const mods={injuryRollModifier:0,concussion:false,trueGrit:false,hardToKill:false,ignoreKnockedDownAndStunned:true}
 const one=injuryDistribution(mods)
 expect(one.none).toBeCloseTo(2/3);expect(one.knockedDown).toBe(0);expect(one.stunned).toBe(0);expect(one.outOfAction).toBeCloseTo(1/3)
 expect(injuryDistributionForWounds(mods,2).outOfAction).toBeCloseTo(5/9)
 expect(injuryDistribution({...mods,injuryRollModifier:1}).outOfAction).toBeCloseTo(1/2)
})
