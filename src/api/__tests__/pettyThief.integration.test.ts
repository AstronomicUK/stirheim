import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner='22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Petty Thief transfers',()=>{
 let admin:SupabaseClient,player:SupabaseClient,campaign:string,match:string,warbands:string[],group:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  player=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  const r=await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'});if(r.error)throw r.error
 })
 beforeEach(async()=>{
  campaign=crypto.randomUUID();match=crypto.randomUUID();group=crypto.randomUUID();warbands=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()]
  for(const r of [await admin.from('campaigns').insert({id:campaign,name:'Disposable recruit report QA',gm_id:owner}),await admin.from('warbands').insert(warbands.map(id=>({id,owner_id:owner,name:'Recruit QA',type_rules_id:'mazzalupo',gold:100,wyrdstone:1}))),await admin.from('matches').insert({id:match,campaign_id:campaign,created_by:owner,state:'awaiting_reports'}),await admin.from('match_participants').insert(warbands.map(warband_id=>({match_id:match,warband_id}))),await admin.from('heroes').insert(warbands.slice(0,2).map((warband_id,i)=>({id:i===0?group:warband_id,warband_id,name:'Squire',unit_type_rules_id:'mazzalupo_squire',stats:{M:4,WS:2,BS:2,S:3,T:3,W:1,I:3,A:1,Ld:6}})))])if(r.error)throw r.error
 })
 afterEach(async()=>{await admin.from('campaigns').delete().eq('id',campaign);await admin.from('warbands').delete().in('id',warbands)})
 const file=(i=0,target=warbands[2])=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[i],p_report:{won:false,result:'lost',routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},petty_thief:{target_id:target,roll:5,squire_id:i===0?group:warbands[i],selection_roll:1}}}})
 const shards=async()=> (await admin.from('warbands').select('id,wyrdstone').in('id',warbands)).data!
 it('transfers an existing shard and returns it on withdrawal',async()=>{
  expect((await file()).error).toBeNull()
  expect(Object.fromEntries((await shards()).map(w=>[w.id,w.wyrdstone]))).toMatchObject({[warbands[0]]:2,[warbands[2]]:0})
  expect((await player.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:warbands[0]})).error).toBeNull()
  expect((await shards()).map(w=>w.wyrdstone)).toEqual([1,1,1])
 })
 it('serializes competing thefts of the last shard and logs the empty reserve',async()=>{
  const results=await Promise.all([file(0),file(1)])
  expect(results.map(r=>r.error)).toEqual([null,null])
  expect((await shards()).reduce((sum,w)=>sum+w.wyrdstone,0)).toBe(3)
  const reports=await admin.from('match_reports').select('applied,notes').eq('match_id',match)
  expect(reports.data!.map(r=>r.applied.petty_thief.transferred).sort()).toEqual([0,1])
  expect(reports.data!.some(r=>r.notes.includes('transferred 0 shard'))).toBe(true)
 })
 it('rejects theft from a warband outside the match',async()=>{
  expect((await file(0,crypto.randomUUID())).error?.message).toContain('invalid Petty Thief')
  expect((await shards()).map(w=>w.wyrdstone)).toEqual([1,1,1])
 })
})
