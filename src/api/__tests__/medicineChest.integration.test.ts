import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest'
const uid='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Medicine Chest report consumption',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,warband:string,chest:string,matches:string[]
 beforeAll(async()=>{admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error})
 beforeEach(async()=>{
  campaign=crypto.randomUUID();warband=crypto.randomUUID();chest=crypto.randomUUID();matches=[crypto.randomUUID(),crypto.randomUUID()]
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable Medicine Chest QA',gm_id:uid}),await admin.from('warbands').insert({id:warband,name:'Patients',owner_id:uid,type_rules_id:'mercenaries_reikland',gold:100}),await admin.from('items').insert({id:chest,warband_id:warband,holder_type:'stash',item_rules_id:'scenario_medicine_chest',quantity:2}),await admin.from('matches').insert(matches.map(id=>({id,campaign_id:campaign,created_by:uid,state:'awaiting_reports'}))),await admin.from('match_participants').insert(matches.map(match_id=>({match_id,warband_id:warband,accepted_at:new Date().toISOString()})))])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().eq('id',warband)})
 const file=(n=0,expected=2,quantity=1,patch=expected-quantity)=>player.rpc('submit_battle_report',{p_match_id:matches[n],p_warband_id:warband,p_report:{won:false,result:'lost',routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},medicine_chests:[{item_id:chest,quantity,expected_quantity:expected}],item_patches:[{id:chest,quantity:patch}]}}})
 const withdraw=(n=0)=>player.rpc('withdraw_battle_report',{p_match_id:matches[n],p_warband_id:warband})
 it('consumes one copy and restores its original stock on withdrawal',async()=>{
  expect((await file()).error).toBeNull();expect((await admin.from('items').select('quantity').eq('id',chest).single()).data?.quantity).toBe(1)
  expect((await withdraw()).error).toBeNull();expect((await admin.from('items').select('quantity').eq('id',chest).single()).data?.quantity).toBe(2)
 })
 it('rejects stale stock and requires reversing later consumption before earlier withdrawal',async()=>{
  expect((await file()).error).toBeNull()
  expect((await file(1)).error?.message).toContain('stock changed')
  expect((await file(1,1)).error).toBeNull()
  expect((await withdraw()).error?.message).toContain('equipment has changed')
  expect((await withdraw(1)).error).toBeNull();expect((await withdraw()).error).toBeNull()
  expect((await admin.from('items').select('quantity').eq('id',chest).single()).data?.quantity).toBe(2)
 })
 it('rejects a declared reroll without consuming the matching copy',async()=>{
  expect((await file(0,2,1,2)).error?.message).toContain('consume exactly')
  expect((await file(0,2,3,0)).error?.message).toContain('stock changed')
 })
})
