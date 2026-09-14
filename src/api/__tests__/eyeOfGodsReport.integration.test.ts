import {createClient,type SupabaseClient} from '@supabase/supabase-js'
import {beforeAll,afterAll,describe,it,expect} from 'vitest'
import {isolatedCampaign} from './isolatedCampaign'
import {applyEyeOfGods} from '../../features/postBattle/model/eyeOfGods'
import {emptyDraft} from '../../features/postBattle/model/state'
import {makeHero,makeWarband} from '../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../rules/data/warbandTemplates'
import type {ReportApplied} from '../../domain/report'
const check=(r:{error:unknown})=>{if(r.error)throw r.error}
describe.skipIf(process.env.SUPABASE_LOCAL!=='1')('Eye of the Gods report transaction',()=>{
 let admin:SupabaseClient,player:SupabaseClient,gm:SupabaseClient,fixture:Awaited<ReturnType<typeof isolatedCampaign>>,match:string
 const campaign=crypto.randomUUID(),band=crypto.randomUUID(),other=crypto.randomUUID(),heroId=crypto.randomUUID(),group=crypto.randomUUID(),item=crypto.randomUUID(),spawn=crypto.randomUUID()
 const hero=makeHero({id:heroId,unitTemplateId:'marauders_chieftain',name:'Eye QA Chief',xp:20,equipment:[],flags:{}})
 const roster=makeWarband({id:band,warbandTemplateId:'marauders_of_chaos',marauderTribe:'kurgan',heroes:[hero],hiredSwords:[],henchmenGroups:[]})
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const client=()=>createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}})
  player=client();gm=client();check(await player.auth.signInWithPassword({email:'player@stirheim.test',password:'stirheim-dev'}));check(await gm.auth.signInWithPassword({email:'gm@stirheim.test',password:'stirheim-dev'}))
  fixture=await isolatedCampaign(admin,{campaign,reikland:other,skaven:band,skritch:heroId,verminkin:group})
  check(await admin.from('warbands').update({type_rules_id:'marauders_of_chaos',marauder_tribe:'kurgan'}).eq('id',band))
  check(await admin.from('heroes').update({unit_type_rules_id:hero.unitTemplateId,stats:hero.stats,xp:20,skills:[],spells:[],injuries:[],flags:{}}).eq('id',heroId))
  check(await admin.from('items').insert({id:item,warband_id:band,holder_type:'hero',holder_id:heroId,item_rules_id:'sword',quantity:1}))
  const r=await gm.rpc('schedule_match',{p_campaign_id:campaign,p_warband_ids:[other,band],p_scenario_rules_id:'skirmish'});check(r);match=r.data;check(await gm.rpc('start_match',{p_match_id:match}));check(await gm.rpc('end_match',{p_match_id:match}))
 })
 afterAll(async()=>{await fixture?.cleanup()})
 async function report(mark?:string){
  const items=await admin.from('items').select('*').eq('warband_id',band);check(items)
  const applied:ReportApplied={heroes:[],groups:[],warband:{gold_delta:0,wyrdstone_delta:0,veteran_pool:null},pending_advances:[],stash_items:[],item_patches:[],remove_item_ids:[]}
  const draft={...emptyDraft(),result:mark?'won' as const:'lost' as const,chaosAftermath:{dice:[6,6] as [number,number],mark,spawnIds:{[heroId]:spawn}}}
  const result=applyEyeOfGods(draft,{roster,template:findWarbandTemplate(roster.warbandTemplateId),items:items.data!,matchId:match,myRating:100,opponentRating:100},applied)
  expect(result.problems).toEqual([])
  return {version:1,result:draft.result,won:!!mark,routed:false,xp_log:[],ooa:[],injuries:[],exploration:null,veteran_pool_roll:null,notes:result.notes.join('\n'),applied}
 }
 it('saves a Mark once and restores its Toughness and flags when the report is withdrawn',async()=>{
  const body=await report('crow');check(await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:body}))
  expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:body})).error).toBeTruthy()
  const saved=await admin.from('heroes').select('flags,stats').eq('id',heroId).single();check(saved);expect(saved.data!.flags).toMatchObject({chaosMark:'crow',eyeOfGodsMarked:true});expect(saved.data!.stats.T).toBe(hero.stats.T+1)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:band}))
  const restored=await admin.from('heroes').select('flags,stats').eq('id',heroId).single();check(restored);expect(restored.data!.flags).toEqual({});expect(restored.data!.stats.T).toBe(hero.stats.T)
 })
 it('creates one Spawn and loses the former hero’s kit atomically, then restores everything on withdrawal',async()=>{
  const body=await report();check(await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:body}))
  const saved=await admin.from('heroes').select('status,xp').eq('id',heroId).single();check(saved);expect(saved.data).toEqual({status:'retired',xp:0})
  const spawned=await admin.from('henchman_groups').select('unit_type_rules_id,size,xp').eq('id',spawn).single();check(spawned);expect(spawned.data).toEqual({unit_type_rules_id:'marauders_spawn_of_chaos',size:1,xp:0})
  expect((await admin.from('items').select('quantity').eq('id',item)).data).toEqual([])
  expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:band,p_report:body})).error).toBeTruthy()
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:band}))
  expect((await admin.from('henchman_groups').select('id').eq('id',spawn)).data).toEqual([])
  const restored=await admin.from('heroes').select('status,xp').eq('id',heroId).single();check(restored);expect(restored.data).toEqual({status:'active',xp:20})
  expect((await admin.from('items').select('quantity').eq('id',item).single()).data!.quantity).toBe(1)
 })
})
