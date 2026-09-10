import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Exploration recruit report transactions',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,match:string,warbands:string[],group:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error
 })
 beforeEach(async()=>{
  campaign=crypto.randomUUID();match=crypto.randomUUID();group=crypto.randomUUID();warbands=[crypto.randomUUID(),crypto.randomUUID()]
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable recruit report QA',gm_id:owner}),await admin.from('warbands').insert(warbands.map(id=>({id,owner_id:owner,name:'Recruit QA',type_rules_id:'the_undead',gold:100}))),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:owner,state:'awaiting_reports'}),await admin.from('match_participants').insert(warbands.map(warband_id=>({match_id:match,warband_id})))])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',warbands)})
 const file=()=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[0],p_report:{won:false,result:'lost',routed:false,applied:{warband:{gold_delta:5,wyrdstone_delta:0},new_groups:[{id:group,name:'Zombies',unit_type_rules_id:'the_undead_zombies',size:3,stats:{M:4,WS:2,BS:0,S:3,T:3,W:1,I:1,A:1,Ld:5},xp:0,level_ups:0}]}}})
 const withdraw=()=>player.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[0]})
 it('applies, withdraws and re-files without duplicating a new group',async()=>{
  expect((await file()).error).toBeNull()
  expect((await admin.from('henchman_groups').select('size').eq('id',group).single()).data?.size).toBe(3)
  expect((await withdraw()).error).toBeNull()
  expect((await admin.from('henchman_groups').select('id').eq('id',group)).data).toEqual([])
  expect((await admin.from('warbands').select('gold').eq('id',warbands[0]).single()).data?.gold).toBe(100)
  expect((await file()).error).toBeNull()
  expect((await admin.from('henchman_groups').select('id').eq('warband_id',warbands[0])).data).toHaveLength(1)
 })
 it('saves henchman upkeep state through the report and protects a later settlement',async()=>{
  expect((await admin.from('henchman_groups').insert({id:group,warband_id:warbands[0],name:'Troll',unit_type_rules_id:'orc_mob_troll',size:1,stats:{M:6,WS:3,BS:1,S:5,T:4,W:3,I:1,A:3,Ld:4}})).error).toBeNull()
  const filed=await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[0],p_report:{won:false,result:'lost',routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},groups:[{id:group,patch:{campaign_state:{upkeepOwedAfter:match}}}]}}})
  expect(filed.error).toBeNull()
  expect((await admin.from('henchman_groups').select('campaign_state').eq('id',group).single()).data?.campaign_state).toEqual({upkeepOwedAfter:match})
  expect((await player.rpc('update_roster',{p_warband_id:warbands[0],p_reason:'Paid Troll upkeep',p_changes:[{table:'henchman_groups',op:'update',id:group,data:{campaign_state:{upkeepPaidAfter:match}}}]})).error).toBeNull()
  expect((await withdraw()).error?.message).toContain('henchman upkeep has changed')
  expect((await admin.from('henchman_groups').select('campaign_state').eq('id',group).single()).data?.campaign_state).toEqual({upkeepPaidAfter:match})
  expect((await admin.from('henchman_groups').update({campaign_state:{upkeepOwedAfter:match}}).eq('id',group)).error).toBeNull()
  expect((await withdraw()).error).toBeNull()
  expect((await admin.from('henchman_groups').select('campaign_state').eq('id',group).single()).data?.campaign_state).toEqual({})
 })
 it('refuses to erase later recruit changes and rolls back the withdrawal',async()=>{
  expect((await file()).error).toBeNull()
  expect((await admin.from('henchman_groups').update({size:4}).eq('id',group)).error).toBeNull()
  expect((await withdraw()).error?.message).toContain('exploration recruit has changed')
  expect((await admin.from('henchman_groups').select('size').eq('id',group).single()).data?.size).toBe(4)
  expect((await admin.from('warbands').select('gold').eq('id',warbands[0]).single()).data?.gold).toBe(105)
 })
})
