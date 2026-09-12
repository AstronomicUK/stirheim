import {tradeWagonCaptureSchema} from '../tradeWagons'
import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,beforeEach,afterEach,describe,it,expect} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Trade Wagon capture snapshot validation',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,merchant:string,captor:string,match:string,report:string,wagon:string,cargo:string
 let snapshot:Record<string,any>
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});const auth=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(auth.error)throw auth.error})
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
 afterEach(async()=>{const state=await admin.from('trade_wagon_captures').select('state,settlement').eq('report_id',report).maybeSingle();if(state.data?.state==='settled'&&state.data.settlement?.kind==='ransom'){const undone=await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Disposable QA cleanup'});if(undone.error)throw undone.error}if(state.data?.state==='settled'&&state.data.settlement?.kind==='keep'){const undone=await player.rpc('undo_kept_trade_wagon',{p_report_id:report,p_reason:'Disposable QA cleanup'});if(undone.error)throw undone.error}const released=await admin.rpc('release_trade_wagon_capture',{p_report_id:report});if(released.error)throw released.error;await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',[merchant,captor])})
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
 it('reserves cargo outside spendable inventory and restores it without overwriting later treasure',async()=>{
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:snapshot})).error).toBeNull()
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toEqual([])
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:80,wyrdstone:0})
  expect((await admin.from('trade_wagon_captures').select('state').eq('report_id',report).single()).data?.state).toBe('pending')
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:snapshot})).error).not.toBeNull()
  await admin.from('trade_wagon_captures').update({state:'settled'}).eq('report_id',report)
  try {expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error?.message).toContain('Undo the agreed')}
  finally {await admin.from('trade_wagon_captures').update({state:'pending'}).eq('report_id',report)}
  await admin.from('warbands').update({gold:91,wyrdstone:2}).eq('id',merchant)
  expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error).toBeNull()
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:91,wyrdstone:5})
  expect((await admin.from('items').select('id,quantity,notes').eq('warband_id',merchant).order('notes')).data).toEqual([{id:cargo,quantity:2,notes:'Family blades'},{id:wagon,quantity:1,notes:'Two draft horses'}])
  expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error).toBeNull()
  expect((await admin.from('warbands').select('wyrdstone').eq('id',merchant).single()).data?.wyrdstone).toBe(5)
 })
 it('rolls back the whole release if an original cargo identity has been reused',async()=>{
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:snapshot})).error).toBeNull()
  const collision=await admin.from('items').insert({id:cargo,warband_id:captor,holder_type:'stash',item_rules_id:'axe',quantity:1});expect(collision.error).toBeNull()
  try {
   expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error?.message).toContain('identity is already in use')
   expect((await admin.from('items').select('id').eq('id',wagon)).data).toEqual([])
   expect((await admin.from('warbands').select('wyrdstone').eq('id',merchant).single()).data?.wyrdstone).toBe(0)
  }finally {await admin.from('items').delete().eq('id',cargo)}
 })
 it('makes a group-form wagon unavailable and restores its original group identity',async()=>{
  await admin.from('items').delete().eq('id',wagon)
  const group=await admin.from('henchman_groups').insert({id:wagon,warband_id:merchant,name:'Trade Wagon',unit_type_rules_id:'merchant_trade_wagon',size:1,stats:{M:0,WS:0,BS:0,S:0,T:8,W:4,I:0,A:0,Ld:0}}).select('*').single();expect(group.error).toBeNull()
  const value={...snapshot,wagon:{kind:'group',expected:group.data}}
  const attached=crypto.randomUUID()
  expect((await admin.from('items').insert({id:attached,warband_id:merchant,holder_type:'group',holder_id:wagon,item_rules_id:'sword',quantity:1})).error).toBeNull()
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:value})).error?.message).toContain('equipment attached')
  await admin.from('items').delete().eq('id',attached)
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:value})).error).toBeNull()
  expect((await admin.from('henchman_groups').select('size').eq('id',wagon).single()).data?.size).toBe(0)
  expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error).toBeNull()
  expect((await admin.from('henchman_groups').select('size').eq('id',wagon).single()).data?.size).toBe(1)
 })
 const reserveAndWinner=async()=>{
  const reserved=await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:snapshot});expect(reserved.error).toBeNull()
  const won=await admin.from('match_reports').insert({match_id:match,warband_id:captor,submitted_by:uid,won:true,result:'won',applied:{},undo:{}});expect(won.error).toBeNull()
 }
 const ransom=async(gold=25,overrides:Record<string,unknown>={})=>{
  const rows=await admin.from('warbands').select('id,updated_at').in('id',[merchant,captor]);if(rows.error)throw rows.error
  return player.rpc('settle_trade_wagon_ransom',{p_report_id:report,p_gold:gold,p_reason:'Agreed return of wagon and all cargo',p_merchant_updated:rows.data.find(w=>w.id===merchant)!.updated_at,p_captor_updated:rows.data.find(w=>w.id===captor)!.updated_at,...overrides})
 }
 it('settles a ransom once and undoes it back into pending reservation before release',async()=>{
  await reserveAndWinner()
  expect((await ransom()).error).toBeNull()
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:55,wyrdstone:3})
  expect((await admin.from('warbands').select('gold').eq('id',captor).single()).data?.gold).toBe(25)
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toHaveLength(2)
  expect((await ransom()).error?.message).toContain('no longer awaiting')
  expect((await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Agreed correction'})).error).toBeNull()
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toEqual([])
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:80,wyrdstone:0})
  expect((await admin.from('warbands').select('gold').eq('id',captor).single()).data?.gold).toBe(0)
 })
 it('rejects an unaffordable or stale ransom before returning any reserved cargo',async()=>{
  await reserveAndWinner()
  expect((await ransom(81)).error?.message).toContain('cannot afford')
  expect((await ransom(25,{p_merchant_updated:'2000-01-01T00:00:00Z'})).error?.message).toContain('warband changed')
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toEqual([])
 })
 it('refuses ransom undo after later spending or equipment edits',async()=>{
  await reserveAndWinner();expect((await ransom()).error).toBeNull()
  await admin.from('warbands').update({gold:24}).eq('id',captor)
  expect((await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Correction'})).error?.message).toContain('treasury changed')
  await admin.from('warbands').update({gold:25}).eq('id',captor)
  await admin.from('items').update({notes:'Later edit'}).eq('id',cargo)
  expect((await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Correction'})).error?.message).toContain('equipment changed')
  await admin.from('items').update({notes:'Family blades'}).eq('id',cargo)
 })
 it('requires a filed winning captor and permission to edit both warbands',async()=>{
  expect((await admin.rpc('reserve_trade_wagon_capture',{p_report_id:report,p_capture:snapshot})).error).toBeNull()
  expect((await ransom()).error?.message).toContain('winning battle report')
  const won=await admin.from('match_reports').insert({match_id:match,warband_id:captor,submitted_by:uid,won:true,result:'won',applied:{},undo:{}});expect(won.error).toBeNull()
  const outsider=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  const login=await outsider.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'});expect(login.error).toBeNull()
  expect((await outsider.rpc('settle_trade_wagon_ransom',{p_report_id:report,p_gold:25,p_reason:'Unauthorised QA attempt',p_merchant_updated:new Date().toISOString(),p_captor_updated:new Date().toISOString()})).error?.message).toContain('owner of both warbands')
  expect((await admin.from('items').select('id').eq('warband_id',merchant)).data).toEqual([])
 })
 it('ransoms and re-reserves the same group-form wagon without making a duplicate unit',async()=>{
  await admin.from('items').delete().eq('id',wagon)
  const group=await admin.from('henchman_groups').insert({id:wagon,warband_id:merchant,name:'Trade Wagon',unit_type_rules_id:'merchant_trade_wagon',size:1,stats:{M:0,WS:0,BS:0,S:0,T:8,W:4,I:0,A:0,Ld:0}}).select('*').single();expect(group.error).toBeNull()
  snapshot={...snapshot,wagon:{kind:'group',expected:group.data}}
  await reserveAndWinner();expect((await ransom()).error).toBeNull()
  expect((await admin.from('henchman_groups').select('id,size').eq('warband_id',merchant)).data).toEqual([{id:wagon,size:1}])
  expect((await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Correction'})).error).toBeNull()
  expect((await admin.from('henchman_groups').select('id,size').eq('warband_id',merchant)).data).toEqual([{id:wagon,size:0}])
 })
 const keep=async(vehicle='wagon',allowed=true)=>{
  const rows=await admin.from('warbands').select('id,updated_at').in('id',[merchant,captor]);if(rows.error)throw rows.error
  return player.rpc('keep_captured_trade_wagon',{p_report_id:report,p_vehicle:vehicle,p_vehicle_allowed:allowed,p_reason:'GM confirms campaign vehicle eligibility',p_merchant_updated:rows.data.find(w=>w.id===merchant)!.updated_at,p_captor_updated:rows.data.find(w=>w.id===captor)!.updated_at})
 }
 it('keeps original cargo and both horses, leaves gold alone, and restores the original wagon on reversal',async()=>{
  await reserveAndWinner()
  expect((await keep('wagon',false)).error?.message).toContain('Confirm')
  expect((await keep()).error).toBeNull()
  const received=await admin.from('items').select('id,item_rules_id,quantity,notes').eq('warband_id',captor)
  expect(received.data).toContainEqual({id:cargo,item_rules_id:'sword',quantity:2,notes:'Family blades'})
  expect(received.data?.find(i=>i.id===wagon)).toMatchObject({item_rules_id:'wagon_stagecoach',quantity:1,notes:expect.stringContaining('two draft horses')})
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',captor).single()).data).toEqual({gold:0,wyrdstone:3})
  expect((await admin.from('warbands').select('gold,wyrdstone').eq('id',merchant).single()).data).toEqual({gold:80,wyrdstone:0})
  expect((await keep()).error?.message).toContain('no longer awaiting')
  await admin.from('items').update({quantity:1}).eq('id',cargo)
  expect((await player.rpc('undo_kept_trade_wagon',{p_report_id:report,p_reason:'Correction'})).error?.message).toContain('equipment changed')
  await admin.from('items').update({quantity:2}).eq('id',cargo)
  expect((await player.rpc('undo_kept_trade_wagon',{p_report_id:report,p_reason:'Correction'})).error).toBeNull()
  expect((await admin.from('items').select('id').eq('warband_id',captor)).data).toEqual([])
  expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error).toBeNull()
  expect((await admin.from('items').select('item_rules_id,notes').eq('id',wagon).single()).data).toEqual({item_rules_id:'trade_wagon',notes:'Two draft horses'})
 })
 it('converts a group wagon into one ordinary Stage Coach and undoes without duplicating a group',async()=>{
  await admin.from('items').delete().eq('id',wagon)
  const group=await admin.from('henchman_groups').insert({id:wagon,warband_id:merchant,name:'Trade Wagon',unit_type_rules_id:'merchant_trade_wagon',size:1,stats:{M:0,WS:0,BS:0,S:0,T:8,W:4,I:0,A:0,Ld:0}}).select('*').single();expect(group.error).toBeNull()
  snapshot={...snapshot,wagon:{kind:'group',expected:group.data}}
  await reserveAndWinner();expect((await keep('stagecoach')).error).toBeNull()
  expect((await admin.from('items').select('custom_name').eq('warband_id',captor).eq('item_rules_id','wagon_stagecoach')).data).toEqual([{custom_name:'Captured Stage Coach'}])
  expect((await admin.from('henchman_groups').select('size').eq('id',wagon).single()).data?.size).toBe(0)
  expect((await player.rpc('undo_kept_trade_wagon',{p_report_id:report,p_reason:'Correction'})).error).toBeNull()
  expect((await admin.rpc('release_trade_wagon_capture',{p_report_id:report})).error).toBeNull()
  expect((await admin.from('henchman_groups').select('size').eq('id',wagon).single()).data?.size).toBe(1)
 })
 it('exposes validated pending and settled captures to the owner without allowing direct edits',async()=>{
  await reserveAndWinner()
  const read=await player.from('trade_wagon_captures').select('*').eq('report_id',report).single()
  expect(read.error).toBeNull()
  expect(tradeWagonCaptureSchema.parse(read.data)).toMatchObject({state:'pending',settlement:null,snapshot:{cargo:{wyrdstone:3}}})
  await player.from('trade_wagon_captures').update({state:'settled'}).eq('report_id',report)
  expect((await admin.from('trade_wagon_captures').select('state').eq('report_id',report).single()).data?.state).toBe('pending')
  expect((await ransom()).error).toBeNull()
  const settled=await player.from('trade_wagon_captures').select('*').eq('report_id',report).single()
  expect(settled.error).toBeNull()
  expect(tradeWagonCaptureSchema.parse(settled.data)).toMatchObject({state:'settled',settlement:{kind:'ransom',gold:25}})
 })
 it('blocks rare searches through pending and ransomed capture, but not ordinary trade or the next battle',async()=>{
  await reserveAndWinner()
  const blocked=()=>player.rpc('trade_wagon_rare_search_blocked',{p_warband_id:captor})
  expect((await blocked()).data).toBe(true)
  const attempt=()=>player.rpc('record_rare_item_trade',{p_warband_id:captor,p_match_id:match,p_changes:[],p_wyrdstone_sold:false,p_heroes_searched:[],p_reason:'Rare item search'})
  expect((await attempt()).error?.message).toContain('Local traders refuse')
  expect((await player.rpc('record_trade',{p_warband_id:captor,p_match_id:match,p_changes:[],p_wyrdstone_sold:false,p_heroes_searched:[],p_reason:'Common purchase'})).error).toBeNull()
  expect((await ransom()).error).toBeNull();expect((await blocked()).data).toBe(true)
  const next=crypto.randomUUID()
  expect((await admin.from('matches').insert({id:next,campaign_id:campaign,created_by:uid,state:'scheduled',created_at:'2099-01-01T00:00:00Z'})).error).toBeNull()
  expect((await admin.from('match_participants').insert({match_id:next,warband_id:captor,accepted_at:new Date().toISOString()})).error).toBeNull()
  expect((await blocked()).data).toBe(true)
  expect((await admin.from('matches').update({state:'in_progress',started_at:'2099-01-01T00:00:00Z'}).eq('id',next)).error).toBeNull()
  expect((await blocked()).data).toBe(false)
  expect((await attempt()).error).toBeNull()
 })
 it('allows rare searches when all Merchant models were out of action',async()=>{
  snapshot={...snapshot,merchant_all_ooa:true,rare_search_blocked:false}
  await reserveAndWinner()
  expect((await player.rpc('trade_wagon_rare_search_blocked',{p_warband_id:captor})).data).toBe(false)
  expect((await player.rpc('record_rare_item_trade',{p_warband_id:captor,p_match_id:match,p_changes:[],p_wyrdstone_sold:false,p_heroes_searched:[],p_reason:'Allowed search'})).error).toBeNull()
 })
 it('protects both settled reports but allows withdrawal after the ransom is undone',async()=>{
  await reserveAndWinner();expect((await ransom()).error).toBeNull()
  expect((await admin.from('match_reports').update({undo:null}).eq('match_id',match).eq('warband_id',captor)).error?.message).toContain('Undo the agreed Trade Wagon settlement')
  expect((await admin.from('match_reports').update({result:'lost',won:false}).eq('match_id',match).eq('warband_id',captor)).error?.message).toContain('Undo the agreed Trade Wagon settlement')
  expect((await admin.from('match_reports').delete().eq('match_id',match).eq('warband_id',captor)).error?.message).toContain('Undo the agreed Trade Wagon settlement')
  expect((await admin.from('match_reports').update({result:'won',won:true}).eq('id',report)).error?.message).toContain('Undo the agreed Trade Wagon settlement')
  // Unrelated report edits do not invalidate the capture's result dependency.
  expect((await admin.from('match_reports').update({result:'won'}).eq('match_id',match).eq('warband_id',captor)).error).toBeNull()
  expect((await player.rpc('undo_trade_wagon_ransom',{p_report_id:report,p_reason:'Correct the battle result'})).error).toBeNull()
  expect((await admin.from('match_reports').delete().eq('match_id',match).eq('warband_id',captor)).error).toBeNull()
  expect((await ransom()).error?.message).toContain('winning battle report')
 })
 it('rejects a recorded losing captor and a changed wagon',async()=>{
  await admin.from('items').update({notes:'Later modification'}).eq('id',wagon)
  expect((await validate()).error?.message).toContain('Trade Wagon changed')
  const inserted=await admin.from('match_reports').insert({match_id:match,warband_id:captor,submitted_by:uid,won:false,result:'lost',applied:{}});expect(inserted.error).toBeNull()
  expect((await validate()).error?.message).toContain('did not win')
 })
})
