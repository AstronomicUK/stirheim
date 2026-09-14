import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,afterAll,describe,it,expect} from 'vitest'
import {isolatedCampaign} from './isolatedCampaign'
const check=(r:{error:unknown})=>{if(r.error)throw r.error}
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Abomination reward and reanimation',()=>{
 let admin:SupabaseClient,player:SupabaseClient,gm:SupabaseClient,fixture:Awaited<ReturnType<typeof isolatedCampaign>>,match:string
 const campaign=crypto.randomUUID(),band=crypto.randomUUID(),other=crypto.randomUUID(),hero=crypto.randomUUID(),group=crypto.randomUUID()
 const stats={M:4,WS:3,BS:3,S:3,T:4,W:4,I:3,A:1,Ld:8};const debt={reanimationOwed:1}
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const client=()=>createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  player=client();gm=client();check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}));check(await gm.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'}))
  fixture=await isolatedCampaign(admin,{campaign,reikland:other,skaven:band,skritch:hero,verminkin:group})
  check(await admin.from('warbands').update({gold:30,wyrdstone:2}).eq('id',band));check(await admin.from('warbands').update({wyrdstone:0}).eq('id',other));check(await admin.from('heroes').update({unit_type_rules_id:'restless_dead_liche',stats}).eq('id',hero));check(await admin.from('henchman_groups').update({unit_type_rules_id:'necrarchs_abomination',size:1,campaign_state:{}}).eq('id',group))
  const r=await gm.rpc('schedule_match',{p_campaign_id:campaign,p_warband_ids:[other,band],p_scenario_rules_id:'skirmish'});check(r);match=r.data;check(await gm.rpc('start_match',{p_match_id:match}));check(await gm.rpc('end_match',{p_match_id:match}))
 })
 afterAll(async()=>{await fixture?.cleanup()})
 it('awards once, reanimates once, blocks unsafe withdrawal, then reverses both after refund',async()=>{
  const report={version:1,result:'lost',won:false,routed:false,xp_log:[],ooa:[{subjectId:group,subjectType:'group',subjectName:'Abomination',count:1}],injuries:[],exploration:null,veteran_pool_roll:null,notes:'Local dependency test',applied:{abomination_rewards:[{group_id:group,model_index:0,recipient_id:other,model_name:'Victor'}],heroes:[{id:hero,patch:{stats:{...stats,W:3}}}],groups:[{id:group,patch:{campaign_state:debt}}],warband:{gold_delta:0,wyrdstone_delta:0},pending_advances:[],stash_items:[],item_patches:[],remove_item_ids:[]}}
  const invalid=structuredClone(report);invalid.applied.abomination_rewards[0].recipient_id=band
  expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:invalid})).error).toBeTruthy()
  expect((await player.rpc('apply_battle_report_before_powered',{p_report_id:crypto.randomUUID()})).error).toBeTruthy()
  check(await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:report}))
  expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:report})).error).toBeTruthy()
  check(await admin.from('warbands').update({wyrdstone:0}).eq('id',other))
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:band})).error).toBeTruthy()
  expect((await admin.from('henchman_groups').select('campaign_state').eq('id',group).single()).data!.campaign_state).toEqual(debt)
  check(await admin.from('warbands').update({wyrdstone:1}).eq('id',other))

  const h=await admin.from('heroes').select('stats').eq('id',hero).single();check(h);expect(h.data!.stats.W).toBe(3)
  expect((await admin.from('warbands').select('wyrdstone').eq('id',other).single()).data!.wyrdstone).toBe(1)
  const request=crypto.randomUUID();const args={p_group_id:group,p_request_id:request,p_undo:false,p_expected_state:debt};check(await player.rpc('reanimate_abomination',args));check(await player.rpc('reanimate_abomination',args))
  expect((await admin.from('warbands').select('wyrdstone').eq('id',band).single()).data!.wyrdstone).toBe(1)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:band})).error).toBeTruthy()
  const g=await admin.from('henchman_groups').select('campaign_state').eq('id',group).single();check(g)
  check(await player.rpc('reanimate_abomination',{p_group_id:group,p_request_id:request,p_undo:true,p_expected_state:g.data!.campaign_state}))
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:band}))
  const restored=await admin.from('heroes').select('stats').eq('id',hero).single();check(restored);expect(restored.data!.stats.W).toBe(4)
  const before=await admin.from('henchman_groups').select('campaign_state,size').eq('id',group).single();check(before);expect(before.data).toEqual({campaign_state:{},size:1})
  const w=await admin.from('warbands').select('gold').eq('id',band).single();check(w);expect(w.data!.gold).toBe(30)
  expect((await admin.from('warbands').select('wyrdstone').eq('id',other).single()).data!.wyrdstone).toBe(0)
  expect((await admin.from('warbands').select('wyrdstone').eq('id',band).single()).data!.wyrdstone).toBe(2)
 })
})
