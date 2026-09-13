import {it,expect} from 'vitest'
import {recordBlackpowderShot} from '../blackpowderShot'
import {emptyBattleLiveState,parseBattleLiveState} from '../battle'
import {doubleBarrelState,reloadDoubleBarrels,correctChamberReload} from '../chambers'
const gun={warriorId:'hero',modelIndex:0,weaponKey:'gun1',name:'First pistol'}
const second={...gun,weaponKey:'gun2',name:'Second pistol'}
const fire=(key:string,turn:number,barrels:1|2)=>({id:`${key}:${turn}`,warriorId:'hero',weaponKey:key,weaponName:'Double-barrelled pistol',ownTurn:turn,barrels,modelIndex:0,reloadTurns:1,at:`2026-09-12T12:${String(turn).padStart(2,'0')}:00Z`,experimental:false})
it('allows the approved 2/1/2/1 cycle without a non-firing phase, including after refresh',()=>{
 let state=emptyBattleLiveState()
 for(const [index,barrels] of ([2,1,2,1,2] as const).entries()){
  const turn=index+1
  expect(doubleBarrelState(state,gun,turn)).toMatchObject({loaded:barrels,block:null})
  if(barrels===1)expect(()=>recordBlackpowderShot(state,{...fire('gun1',turn,2),alternatingChamberReload:true},'Hero')).toThrow(/not enough loaded/)
  state=recordBlackpowderShot(state,{...fire('gun1',turn,barrels),alternatingChamberReload:true},'Hero')
  expect(doubleBarrelState(state,gun,turn).block).toMatch(/already fired/)
  state=parseBattleLiveState(JSON.parse(JSON.stringify(state)))
 }
 expect(state.chamberReloads).toHaveLength(0)
 expect(doubleBarrelState(state,gun,8)).toMatchObject({loaded:2,block:null})
})
it('keeps ordinary reload blocks and misfire limits separate from the house-rule cycle',()=>{
 const normal=recordBlackpowderShot(emptyBattleLiveState(),fire('gun1',1,2),'Hero')
 expect(doubleBarrelState(normal,gun,2).loaded).toBe(0)
 const skilled=recordBlackpowderShot(emptyBattleLiveState(),{...fire('gun1',1,2),alternatingChamberReload:true},'Hero')
 for(const misfireDie of [1,2,3]){
  const jammed={...skilled,blackpowderShots:skilled.blackpowderShots.map(s=>({...s,misfireDie}))}
  expect(doubleBarrelState(jammed,gun,2).block).not.toBeNull()
 }
 expect(doubleBarrelState(skilled,{...gun,modelIndex:1},2).loaded).toBe(2)
})
it('tracks selected bonus chambers, caps at capacity and preserves correction history',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,2),fire('gun2',1,2)]}
 const next=reloadDoubleBarrels(s,[gun,second],2,'reload','2026-09-12T12:02:30Z',['gun1'])
 expect(doubleBarrelState(next,gun,3).loaded).toBe(2)
 expect(doubleBarrelState(next,second,3).loaded).toBe(1)
 expect(next.chamberReloads.map(r=>r.amount)).toEqual([2,1])
 expect(doubleBarrelState(correctChamberReload(next,next.chamberReloads[0].id,'Wrong weapon selected'),gun,3).loaded).toBe(0)
 const partial={...s,blackpowderShots:[fire('gun1',1,1)]}
 expect(reloadDoubleBarrels(partial,[gun],2,'reload','2026-09-12T12:02:30Z',['gun1']).chamberReloads[0].amount).toBe(1)
 expect(()=>reloadDoubleBarrels(s,[gun],2,'reload','2026-09-12T12:02:30Z',['gun2'])).toThrow(/selected physical/)
})
it('keeps the other loaded barrel and requires declared reloads for spent ones',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,1)]}
 expect(doubleBarrelState(s,gun,1)).toMatchObject({loaded:1,firedThisTurn:true})
 expect(doubleBarrelState(s,gun,2)).toMatchObject({loaded:1,block:expect.stringContaining('Prepare shot')})
 expect(doubleBarrelState(s,gun,3)).toMatchObject({loaded:1,block:null})
 expect(doubleBarrelState(s,second,2).loaded).toBe(2)
})
it('reloads one chamber in each pistol, once, and never permits firing in that phase',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,2),fire('gun2',1,2)]}
 expect(()=>reloadDoubleBarrels(s,[gun,second],1,'reload','2026-09-12T12:01:30Z')).toThrow(/has fired/)
 const next=reloadDoubleBarrels(s,[gun,second],2,'reload','2026-09-12T12:02:30Z')
 for(const g of [gun,second])expect(doubleBarrelState(next,g,2)).toMatchObject({loaded:1,reloadedThisTurn:true})
 expect(()=>reloadDoubleBarrels(next,[gun],2,'again','2026-09-12T12:02:40Z')).toThrow(/already reloaded/)
 expect(doubleBarrelState(next,gun,3).block).toBeNull()
 expect(doubleBarrelState(parseBattleLiveState(JSON.parse(JSON.stringify(next))),second,3).loaded).toBe(1)
})
it('keeps original reloads with correction reasons, and detects incompatible later records',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,2)]}
 const reloaded=reloadDoubleBarrels(s,[gun],2,'reload','2026-09-12T12:02:30Z')
 const later={...reloaded,blackpowderShots:[...s.blackpowderShots,fire('gun1',3,1)]}
 const corrected=correctChamberReload(later,reloaded.chamberReloads[0].id,'The model actually fired another weapon')
 expect(corrected.chamberReloads[0].correction).toContain('actually fired')
 expect(doubleBarrelState(corrected,gun,4).inconsistent).toBe(true)
})
it('never reloads one weapon twice through duplicate selection',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,2)]}
 expect(()=>reloadDoubleBarrels(s,[gun,gun],2,'reload','2026-09-12T12:02:00Z')).toThrow(/selected twice/)
})
it('keeps members of a henchman group independent even with the same fallback gun key',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,2)]}
 expect(doubleBarrelState(s,{...gun,modelIndex:1},2).loaded).toBe(2)
 const reloaded=reloadDoubleBarrels(s,[gun],2,'reload','2026-09-12T12:02:00Z')
 expect(doubleBarrelState(reloaded,{...gun,modelIndex:1},2)).toMatchObject({loaded:2,block:null})
})
it('rejects malformed reload events before changing the ledger',()=>{
 const s=emptyBattleLiveState()
 expect(()=>reloadDoubleBarrels(s,[gun],-1,'reload','2026-09-12T12:02:00Z')).toThrow(/own turn/)
 expect(()=>reloadDoubleBarrels(s,[gun],2,'','2026-09-12T12:02:00Z')).toThrow(/identifier/)
 expect(()=>reloadDoubleBarrels(s,[{...gun,modelIndex:-1}],2,'reload','2026-09-12T12:02:00Z')).toThrow(/valid model/)
})

it('records declared barrels, respects single-barrel Prepare shot and rejects excess shots',()=>{
 const first=recordBlackpowderShot(emptyBattleLiveState(),fire('gun1',1,1),'Hero')
 expect(()=>recordBlackpowderShot(first,fire('gun1',2,2),'Hero')).toThrow(/not enough loaded/)
 expect(()=>recordBlackpowderShot(first,fire('gun1',2,1),'Hero')).toThrow(/Prepare shot/)
 const second=recordBlackpowderShot(first,fire('gun1',3,1),'Hero')
 expect(doubleBarrelState(second,gun,3).loaded).toBe(0)
 expect(recordBlackpowderShot(second,fire('gun1',3,1),'Hero')).toBe(second)
 expect(()=>recordBlackpowderShot(second,fire('gun1',4,1),'Hero')).toThrow(/not enough loaded/)
 const reloaded=reloadDoubleBarrels(second,[gun],4,'reload','2026-09-12T12:04:30Z')
 expect(()=>recordBlackpowderShot(reloaded,fire('gun1',4,1),'Hero')).toThrow(/Reloaded this Shooting phase/)
 const fired=recordBlackpowderShot(reloaded,fire('gun1',5,1),'Hero')
 expect(doubleBarrelState(fired,gun,6).loaded).toBe(0)
})

it('requires a pending misfire to be resolved before reloading',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[{...fire('gun1',1,2),misfirePending:true}]}
 expect(()=>reloadDoubleBarrels(s,[gun],2,'reload','2026-09-12T12:02:30Z')).toThrow(/pending misfire/)
})

it('an ordinary pistol shot prevents only its model from reloading a different double gun',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[{...fire('ordinary-pistol',2,1),barrels:undefined,modelIndex:1},fire('gun1',1,2),{...fire('gun1',1,2),id:'member1-shot',modelIndex:1}]}
 expect(()=>reloadDoubleBarrels(s,[{...gun,modelIndex:1}],2,'reload1','2026-09-12T12:02:30Z')).toThrow(/has fired/)
 expect(doubleBarrelState(reloadDoubleBarrels(s,[gun],2,'reload0','2026-09-12T12:02:30Z'),gun,2).loaded).toBe(1)
})
