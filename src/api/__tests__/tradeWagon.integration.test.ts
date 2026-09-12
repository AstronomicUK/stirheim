import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Trade Wagon capture snapshot validation',()=>{
 let admin:SupabaseClient,campaign:string,merchant:string,captor:string,match:string,report:string,wagon:string,cargo:string
 let snapshot:Record<string,any>
 beforeAll(()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)})
 beforeEach(async()=>{
  ;[campaign,merchant,captor,match,report,wagon,cargo]=Array.from({length:7},()=>crypto.randomUUID())
  for(const result of [
   await admin.from('campaigns').insert({id:campaign,name:'Disposable Trade Wagon QA',gm_id:uid}),
   await admin.from('warbands').insert([{id:merchant,name:'Merchant QA',owner_id:uid,type_rules_id:'merchant_caravans',gold:80,wyrdstone:3},{id:captor,name:'Captor QA',owner_id:uid,type_rules_id:'mercenaries_reikland',gold:0,wyrdstone:0}]),
   await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}),
   await admin.from('match_participants').insert([merchant,captor].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))),
   await admin.from('items').insert([{id:wagon,warband_id:merchant,holder_type:'stash',item_rules_id:'trade_wagon',quantity:1,notes:'Two draft horses'},{id:cargo,warband_id:merchant,holder_type:'stash',item_rules_id:'sword',quantity:2,notes:'Family blades'}]),
   await admin.from('match_reports').insert({id:report,match_id:match,warband_id:merchant,submitted_by:uid,won:false,result:'lost',routed:true,applied:{}}),
  ])if(result.error)throw result.error
  const rows=await admin.from('items').select('*').eq('warband_id',merchant);if(rows.error)throw rows.error
  snapshot={match_id:match,merchant_id:merchant,captor_id:captor,failed_rout:true,driver_present:false,merchant_all_ooa:false,rare_search_blocked:true,wagon:{kind:'item',expected:rows.data.find(i=>i.id===wagon)},cargo:{items:[rows.data.find(i=>i.id===cargo)],wyrdstone:3}}
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',[merchant,captor])})
 const validate=(value:Record<string,any>=snapshot)=>admin.rpc('validate_trade_wagon_capture',{p_report_id:report,p_capture:value})
 it('accepts original cargo without transferring anything or taking gold',async()=>{
  expect((await validate()).error).toBeNull()
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:80,wyrdstone:3})
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toHaveLength(2)
 })
 it('rejects absent capture conditions and a captor outside the battle',async()=>{
  expect((await validate({...snapshot,driver_present:true})).error?.message).toContain('no Trade Wagon driver')
  expect((await validate({...snapshot,failed_rout:false})).error?.message).toContain('failed Rout')
  expect((await validate({...snapshot,captor_id:crypto.randomUUID()})).error?.message).toContain('participants')
  expect((await validate({...snapshot,rare_search_blocked:false})).error?.message).toContain('rare-item')
  expect((await validate({...snapshot,merchant_all_ooa:true,rare_search_blocked:false})).error).toBeNull()
 })
 it('rejects stale stock, duplicate cargo, omitted items and gold',async()=>{
  expect((await validate({...snapshot,cargo:{...snapshot.cargo,items:[]}})).error?.message).toContain('exactly once')
  expect((await validate({...snapshot,cargo:{...snapshot.cargo,items:[...snapshot.cargo.items,...snapshot.cargo.items]}})).error?.message).toContain('exactly once')
  expect((await validate({...snapshot,cargo:{...snapshot.cargo,gold:80}})).error?.message).toContain('gold is not')
  await admin.from('items').update({notes:'Changed after capture'}).eq('id',cargo)
  expect((await validate()).error?.message).toContain('Stored cargo changed')
 })
 it('accepts a group-form wagon and rejects changes to its original profile',async()=>{
  await admin.from('items').delete().eq('id',wagon)
  const inserted=await admin.from('henchman_groups').insert({id:wagon,warband_id:merchant,name:'Trade Wagon',unit_type_rules_id:'merchant_trade_wagon',size:1,stats:{M:0,WS:0,BS:0,S:0,T:8,W:4,I:0,A:0,Ld:0}}).select('*').single();expect(inserted.error).toBeNull()
  const value={...snapshot,wagon:{kind:'group',expected:inserted.data}}
  expect((await validate(value)).error).toBeNull()
  await admin.from('henchman_groups').update({size:0}).eq('id',wagon)
  expect((await validate(value)).error?.message).toContain('Trade Wagon changed')
 })
 it('rejects a recorded losing captor and a changed wagon',async()=>{
  await admin.from('items').update({notes:'Later modification'}).eq('id',wagon)
  expect((await validate()).error?.message).toContain('Trade Wagon changed')
  const inserted=await admin.from('match_reports').insert({match_id:match,warband_id:captor,submitted_by:uid,won:false,result:'lost',applied:{}});expect(inserted.error).toBeNull()
  expect((await validate()).error?.message).toContain('did not win')
 })
})
