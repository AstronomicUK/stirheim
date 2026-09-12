import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Core captive equipment identity (#229)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,captor:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,tw:string,campaign:string,match:string,hero:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`captive-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Captive QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,captor]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable victims',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable captors',type_rules_id:'mercenaries_marienburg',gold:100},{owner_id:users[3],name:'Disposable third',type_rules_id:'mercenaries_middenheim',gold:100}]).select('id'));[vw,cw,tw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Captured',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]},{campaign_id:campaign,warband_id:tw,user_id:users[3]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  hero=check(await admin.from('heroes').insert({warband_id:vw,name:'Taken Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:12,status:'active'}).select('id').single()).id
 })
 afterEach(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,cw,tw])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const fileVictim=(outcome='captured',by?:string[])=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',
  ooa:by?[{subjectType:'hero',subjectId:hero,subjectName:'Taken Captain',count:1,by}]:[],
  injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Taken Captain',rolls:[61],outcome,injuryCode:outcome,injuryName:outcome==='captured'?'Captured':'Full recovery',effect:''}],
  applied:{heroes:[{id:hero,patch:outcome==='captured'?{status:'captured',flags:{captured:true}}:{}}]}}})
 const cases=async(client=victim)=>check(await client.from('captive_cases').select('*,proposals:captive_proposals(id,state,proposed_by_warband_id,message,reason)').eq('match_id',match))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }


 async function prepare(itemId:string,notes=''){
  const item=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:itemId,quantity:1,notes}).select('id').single())
  check(await fileVictim());check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  return {item,caseId:(await cases())[0].id}
 }
 const sell=async(caseId:string,itemId:string,received:unknown[])=>captor.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice:{kind:'sell',d6:2},p_message:'Sale',p_advances:[],p_expected:await expected(),p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'retired',flags:{}}},{table:'items',op:'delete',id:itemId}],p_captor_changes:[{table:'warbands',op:'update',data:{gold:110}},...received]})
 const stash=(item_rules_id:string,notes='')=>({table:'items',op:'insert',data:{holder_type:'stash',item_rules_id,quantity:1,notes}})
 it('preserves exact annotations and prevents merging annotated kit into an unannotated stash copy',async()=>{
  const {item,caseId}=await prepare('sword','Family heirloom')
  expect((await sell(caseId,item.id,[stash('sword')])).error?.message).toMatch(/same.*notes|annotations/)
  const stock=check(await admin.from('items').insert({warband_id:cw,holder_type:'stash',item_rules_id:'sword',quantity:1,notes:''}).select('id').single())
  expect((await sell(caseId,item.id,[{table:'items',op:'update',id:stock.id,data:{quantity:2}}])).error?.message).toMatch(/same.*notes|annotations/)
  const proposal=check(await sell(caseId,item.id,[stash('sword','Family heirloom')]))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'}))
  expect(check(await admin.from('items').select('notes,quantity').eq('warband_id',cw).eq('notes','Family heirloom'))).toEqual([{notes:'Family heirloom',quantity:1}])
 })
 it('transfers already-owned Enchanted Skins without treating them as an Amazon sacrifice bonus',async()=>{
  const {item,caseId}=await prepare('enchanted_skins')
  const proposal=check(await sell(caseId,item.id,[stash('enchanted_skins')]))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'}))
  expect(check(await admin.from('items').select('quantity').eq('warband_id',cw).eq('item_rules_id','enchanted_skins').single()).quantity).toBe(1)
 })
 it('keeps existing skins and adds exactly one legitimate Amazon sacrifice reward',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'lizardmen'}).eq('id',vw))
  check(await admin.from('warbands').update({type_rules_id:'amazons_lustria'}).eq('id',cw))
  const leader=check(await admin.from('heroes').insert({warband_id:cw,name:'Priestess',unit_type_rules_id:'amazons_lustria_serpent_priestess',stats,xp:20,status:'active'}).select('id').single())
  const {item,caseId}=await prepare('enchanted_skins')
  const proposal=check(await captor.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice:{kind:'sacrifice',leaderId:leader.id},p_message:'Sacrifice',p_advances:[],p_expected:await expected(),
   p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'dead',flags:{}}},{table:'items',op:'delete',id:item.id}],
   p_captor_changes:[{table:'heroes',op:'update',id:leader.id,data:{xp:21}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'enchanted_skins',quantity:2}}]}))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'}))
  expect(check(await admin.from('items').select('quantity').eq('warband_id',cw).eq('item_rules_id','enchanted_skins').single()).quantity).toBe(2)
  expect(check(await admin.from('heroes').select('xp').eq('id',leader.id).single()).xp).toBe(21)
 })

})
