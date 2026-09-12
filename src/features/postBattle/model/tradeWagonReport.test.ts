import {expect,it} from 'vitest'
import {makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {emptyDraft} from './state'
import type {ReportContext} from './derive'
import {reportWagons,reportTradeWagon,applyTradeWagonToReport,afterTradeWagonCapture} from './tradeWagonReport'
import {reportAppliedSchema} from '../../../domain/report'
import type {HenchmanGroupRow,ItemRow} from '../../../domain'
const wagon={id:'wagon',warband_id:'merchant',name:'Trade Wagon',unit_type_rules_id:'merchant_trade_wagon',size:1,xp:0,level_ups:0} as HenchmanGroupRow
const item={id:'cargo',warband_id:'merchant',item_rules_id:'sword',quantity:2,holder_type:'stash',notes:''} as ItemRow
const ctx:ReportContext={roster:makeWarband({id:'merchant',warbandTemplateId:'merchant_caravans',wyrdstone:3}),template:undefined,items:[item],rawGroups:[wagon],matchId:'match',myRating:0,opponentRating:null,opponents:[{id:'winner',name:'Victors'},{id:'loser',name:'Losers'}],opponentResults:{loser:'lost'}}
const draft={...emptyDraft(),routed:true,routCause:'failed-test' as const,tradeWagon:{driverPresent:false,captorId:'winner',everyMerchantModelOut:false}}
it('requires the relevant facts and accepts a confirmed winner whose report is not yet filed',()=>{
 expect(reportWagons({...ctx,roster:makeWarband()})).toEqual([])
 expect(reportTradeWagon({...draft,tradeWagon:undefined},ctx).problems[0]).toContain('driving')
 expect(reportTradeWagon(draft,ctx)).toMatchObject({problems:[],snapshot:{cargo:{wyrdstone:3},wagon:{kind:'group'}},notes:[expect.stringContaining('Victors captures')]})
 expect(reportTradeWagon({...draft,tradeWagon:{...draft.tradeWagon,captorId:'loser'}},ctx).problems[0]).toContain('winning warband')
 expect(reportTradeWagon({...draft,routCause:'voluntary'},ctx).snapshot).toBeUndefined()
})
it('removes a no-op wagon patch but preserves and flags real wagon changes or cargo loss',()=>{
 const capture=reportTradeWagon(draft,ctx),applied=reportAppliedSchema.parse({heroes:[],warband:{gold_delta:0,wyrdstone_delta:0,veteran_pool:null},pending_advances:[],groups:[{id:'wagon',patch:{size:1,xp:0}}]})
 applyTradeWagonToReport(capture,applied,[wagon]);expect(applied.groups).toEqual([]);expect(applied.trade_wagon_capture).toBeDefined();expect(capture.problems).toEqual([])
 const changed=reportTradeWagon(draft,ctx),other=reportAppliedSchema.parse({heroes:[],warband:{gold_delta:0,wyrdstone_delta:0,veteran_pool:null},pending_advances:[],groups:[{id:'wagon',patch:{size:0}}],item_patches:[{id:'cargo',quantity:1}]})
 applyTradeWagonToReport(changed,other,[wagon]);expect(other.groups).toHaveLength(1);expect(changed.problems).toHaveLength(2)
})

it('removes captured stock from reward choices without changing the original snapshot or carried kit',()=>{
 const carried={...item,id:'carried',holder_type:'hero' as const,holder_id:'hero'}
 const original={...ctx,items:[item,carried]},capture=reportTradeWagon(draft,original)
 const available=afterTradeWagonCapture(original,capture)
 expect(available.items).toEqual([carried]);expect(available.roster.stash).toEqual([])
 expect(original.items).toHaveLength(2);expect(capture.snapshot?.cargo.items).toEqual([item])
 expect(afterTradeWagonCapture(original,reportTradeWagon({...draft,routed:false},original))).toBe(original)
})
