import { expect,it } from 'vitest'
import { gatheringControl,gatheringRewardProblems } from '../gatheringControl'
import { controllerOf,deriveMapState } from '../mapCampaign'
const a={warbandId:'a',result:'won',status:'applied',reward:{ending:'dirk' as const,controllerId:'a'}}
const b={warbandId:'b',result:'lost',status:'applied',reward:{ending:'dirk' as const}}
it('waits for every applied report and removes the reward when one is withdrawn',()=>{
 expect(gatheringControl(['a','b'],[a]).controller).toBeUndefined()
 expect(gatheringControl(['a','b'],[a,b]).controller).toBe('a')
 expect(gatheringControl(['a','b'],[a,{...b,status:'returned'}]).controller).toBeUndefined()
})
it('requires consistent endings and a controller who actually won',()=>{
 expect(gatheringControl(['a','b'],[a,{...b,reward:{ending:'rout'}}]).warning).toBeTruthy()
 expect(gatheringControl(['a','b'],[{...a,reward:{ending:'dirk',controllerId:'b'}},b]).controller).toBeUndefined()
})
it('allows allied winners to agree on one controller, and refuses conflicting choices',()=>{
 const ally={warbandId:'c',result:'won',status:'applied',reward:{ending:'dirk' as const,controllerId:'a',reason:'Agreed'}}
 expect(gatheringControl(['a','b','c'],[a,b,ally]).controller).toBe('a')
 expect(gatheringControl(['a','b','c'],[a,b,{...ally,reward:{...ally.reward,controllerId:'c'}}]).warning).toBeTruthy()
})
it('does not grant the special takeover for a rout',()=>{
 expect(gatheringControl(['a','b'],[a,b].map(r=>({...r,reward:{ending:'rout'}})))).toEqual({controller:undefined})
})
it('requires an explicit horde agreement and participant choice',()=>{
 expect(gatheringRewardProblems({ending:'dirk',controllerId:'a'},true,['a','b','c'])).toHaveLength(1)
 expect(gatheringRewardProblems({ending:'dirk',controllerId:'foreign',reason:'Agreed'},true,['a','b'])).toHaveLength(1)
})
it('replaces existing footholds and permits later ordinary map changes',()=>{
 const before={kind:'adjust' as const,at:'1',districtId:'executioners-square',warbandId:'old',field:'foothold' as const,value:true,reason:'Previous control'}
 const claim={kind:'battle' as const,at:'2',matchId:'m',districtId:'executioners-square',participants:[],claimControl:'a'}
 expect(controllerOf(deriveMapState([before,claim]),'executioners-square')).toBe('a')
 expect(controllerOf(deriveMapState([before,claim,{...before,at:'3',warbandId:'b'}]),'executioners-square')).toBeNull()
 expect(controllerOf(deriveMapState([before]),'executioners-square')).toBe('old')
})
