import {expect,it} from 'vitest'
import type {ItemRow} from '../../../domain'
import {tradeWagonAbandonment,tradeWagonCargo,type TradeWagonFacts} from './tradeWagon'
const facts:TradeWagonFacts={merchantId:'merchant',wagonPresent:true,routed:true,routCause:'failed-test',driverPresent:false,captorId:'winner',winningWarbandIds:['winner'],everyMerchantModelOut:false}
it('abandons only a driverless wagon after a failed Rout test',()=>{
 expect(tradeWagonAbandonment(facts)).toMatchObject({abandoned:true,captorId:'winner',rareSearchBlocked:true,problems:[]})
 for(const change of [{wagonPresent:false},{routed:false},{routCause:'voluntary' as const},{driverPresent:true}])expect(tradeWagonAbandonment({...facts,...change}).abandoned).toBe(false)
 expect(tradeWagonAbandonment({...facts,routCause:undefined}).problems[0]).toContain('failed a Rout test')
 expect(tradeWagonAbandonment({...facts,driverPresent:undefined}).problems[0]).toContain('driving')
})
it('requires an actual winner and only waives the search restriction for a complete wipeout',()=>{
 for(const captorId of ['merchant','loser',undefined])expect(tradeWagonAbandonment({...facts,captorId}).problems[0]).toContain('winning warband')
 expect(tradeWagonAbandonment({...facts,everyMerchantModelOut:true}).rareSearchBlocked).toBe(false)
 expect(tradeWagonAbandonment({...facts,everyMerchantModelOut:undefined}).rareSearchBlocked).toBeNull()
})
it('takes only the merchant’s stored equipment and treasure, preserving original copies',()=>{
 const stored={id:'stash',warband_id:'merchant',holder_type:'stash',holder_id:null,quantity:2,item_rules_id:'sword',custom_name:null,notes:'Modified',created_at:'',updated_at:''} as ItemRow
 const cargo=tradeWagonCargo([stored,{...stored,id:'carried',holder_type:'hero',holder_id:'hero'},{...stored,id:'foreign',warband_id:'other'},{...stored,id:'empty',quantity:0}],'merchant',3)
 expect(cargo).toEqual({items:[stored],wyrdstone:3})
 expect(cargo.items[0]).not.toBe(stored)
 expect(cargo).not.toHaveProperty('gold')
 expect(()=>tradeWagonCargo([],'merchant',-1)).toThrow('wyrdstone')
})

it('carries a known failed test into the report and clears it when routing is corrected',async()=>{
 const {emptyBattleLiveState,parseBattleLiveState}=await import('../../../domain')
 const {setRouted}=await import('../../match/battle/sheet')
 const {seedFromBattleSheet,setRouted:reportRouted}=await import('./state')
 const {makeWarband}=await import('../../../rules/resolve/__tests__/fixtures')
 const state=parseBattleLiveState(JSON.parse(JSON.stringify(setRouted(emptyBattleLiveState(),true,'failed-test'))))
 const report=seedFromBattleSheet(makeWarband(),state)
 expect(report.routCause).toBe('failed-test')
 expect(reportRouted(report,true).routCause).toBe('failed-test')
 expect(reportRouted(report,false).routCause).toBeUndefined()
 expect(setRouted(state,false).routCause).toBeUndefined()
 expect(seedFromBattleSheet(makeWarband(),{...emptyBattleLiveState(),routed:true}).routCause).toBeUndefined()
})
