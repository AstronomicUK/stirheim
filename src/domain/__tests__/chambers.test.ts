import {it,expect} from 'vitest'
import {recordBlackpowderShot} from '../blackpowderShot'
import {emptyBattleLiveState,parseBattleLiveState} from '../battle'
import {doubleBarrelState,reloadDoubleBarrels,correctChamberReload} from '../chambers'
const gun={warriorId:'hero',modelIndex:0,weaponKey:'gun1',name:'First pistol'}
const second={...gun,weaponKey:'gun2',name:'Second pistol'}
const fire=(key:string,turn:number,barrels:1|2)=>({id:`${key}:${turn}`,warriorId:'hero',weaponKey:key,weaponName:'Double-barrelled pistol',ownTurn:turn,barrels,modelIndex:0,reloadTurns:1,at:`2026-09-12T12:${String(turn).padStart(2,'0')}:00Z`,experimental:false})
it('keeps the other loaded barrel and requires declared reloads for spent ones',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[fire('gun1',1,1)]}
 expect(doubleBarrelState(s,gun,1)).toMatchObject({loaded:1,firedThisTurn:true})
 expect(doubleBarrelState(s,gun,2)).toMatchObject({loaded:1,block:null})
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

it('records declared barrels and rejects excess shots without applying legacy whole-gun cadence',()=>{
 const first=recordBlackpowderShot(emptyBattleLiveState(),fire('gun1',1,1),'Hero')
 expect(()=>recordBlackpowderShot(first,fire('gun1',2,2),'Hero')).toThrow(/not enough loaded/)
 const second=recordBlackpowderShot(first,fire('gun1',2,1),'Hero')
 expect(doubleBarrelState(second,gun,3).loaded).toBe(0)
 expect(recordBlackpowderShot(second,fire('gun1',2,1),'Hero')).toBe(second)
 expect(()=>recordBlackpowderShot(second,fire('gun1',3,1),'Hero')).toThrow(/not enough loaded/)
 const reloaded=reloadDoubleBarrels(second,[gun],3,'reload','2026-09-12T12:03:30Z')
 expect(()=>recordBlackpowderShot(reloaded,fire('gun1',3,1),'Hero')).toThrow(/Reloaded this Shooting phase/)
 const fired=recordBlackpowderShot(reloaded,fire('gun1',4,1),'Hero')
 expect(doubleBarrelState(fired,gun,5).loaded).toBe(0)
})

it('requires a pending misfire to be resolved before reloading',()=>{
 const s={...emptyBattleLiveState(),blackpowderShots:[{...fire('gun1',1,2),misfirePending:true}]}
 expect(()=>reloadDoubleBarrels(s,[gun],2,'reload','2026-09-12T12:02:30Z')).toThrow(/pending misfire/)
})
