import { expect,it } from 'vitest'
import { forbiddenSquareRewards } from './forbiddenSquareRewards'
const base={role:'infiltrator' as const,placed:14,scored:11,weaponPolicy:'return' as const,weaponReason:'Agreed original ownership'}
it('uses the actual uncapped setup count and gives only carried-away shards',()=>{
 expect(forbiddenSquareRewards(base,['a','b'],'a')).toMatchObject({shards:11,problems:[],transfers:[]})
 expect(forbiddenSquareRewards({...base,role:'cultist'},['a','b'],'a').shards).toBe(0)
})
it('rejects overclaims and requires an explicit weapon-ownership agreement',()=>{
 expect(forbiddenSquareRewards({...base,scored:15,weaponReason:''},['a','b'],'a').problems).toHaveLength(2)
})
it('never transfers returned counters and rejects foreign or repeated source selections',()=>{
 const t={item_id:'item',from_warband_id:'b',quantity:1,expected:{},reason:'Recovered'}
 expect(forbiddenSquareRewards({...base,transfers:[t]},['a','b'],'a').transfers).toEqual([])
 expect(forbiddenSquareRewards({...base,weaponPolicy:'keep',transfers:[t,t]},['a','b'],'a').problems).toHaveLength(1)
 expect(forbiddenSquareRewards({...base,weaponPolicy:'keep',transfers:[{...t,from_warband_id:'c'}]},['a','b'],'a').problems).toHaveLength(1)
})
