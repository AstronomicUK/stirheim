import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildExchangeProposal } from '../captiveExchange'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:5,WS:3,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:5}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Captive-for-captive exchange across case kinds (#229)',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,moulder:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,group:string,swords:string,skrit:string,packmaster:string,event:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`exchange-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Exchange QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,moulder,gm]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Moulder',type_rules_id:'skaven_of_clan_moulder',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Exchange',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  group=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:2}).select('id').single()).id
  swords=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:group,item_rules_id:'sword',quantity:3}).select('id').single()).id
  skrit=check(await admin.from('heroes').insert({warband_id:cw,name:'Master Moulder Skrit',unit_type_rules_id:'skaven_of_clan_moulder_master_moulder',stats,xp:20,status:'active'}).select('id').single()).id
  packmaster=check(await admin.from('heroes').insert({warband_id:cw,name:'Packmaster Vikt',unit_type_rules_id:'skaven_of_clan_moulder_packmaster',stats,xp:6,status:'active',skills:['dodge']}).select('id').single()).id
  check(await admin.from('items').insert({warband_id:cw,holder_type:'hero',holder_id:packmaster,item_rules_id:'whip',quantity:1}))
  event=check(await admin.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:00:00Z',kind:'attack',summary:'capture',payload:{attacker_warband_id:cw,attacker_id:skrit,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:group,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:2,capture_reason:'subjugator'}}).select('id').single()).id
  // Reikland lose a Warrior to the Subjugator; Moulder lose the Packmaster to a Captured (61) result.
  check(await reik.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'won',ooa:[],
   injuries:[{subjectType:'group',subjectId:group,subjectName:'Warriors',rolls:[],dead:0,equipmentLost:[{sourceItemId:swords,quantity:1}],captured:[{modelIndex:1,eventId:event,captorWarbandId:cw,reason:'subjugator',kit:[{sourceItemId:swords,itemId:'sword',quantity:1}]}]}],
   applied:{heroes:[],groups:[{id:group,patch:{size:2}}],item_patches:[{id:swords,quantity:2}]}}}))
  check(await moulder.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'lost',ooa:[],
   injuries:[{subjectType:'hero',subjectId:packmaster,subjectName:'Packmaster Vikt',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}],
   applied:{heroes:[{id:packmaster,patch:{status:'captured',flags:{captured:true}}}]}}}))
 })
 afterEach(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,cw])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const cases=async()=>check(await gm.from('captive_cases').select('*,proposals:captive_proposals(id,state,message)').eq('match_id',match))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id).order('created_at')),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id).order('created_at'));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Exchange',p_owner_changes,p_captor_changes,p_advances:[],p_expected:await expected()})

 it('exchanges a forced-captured henchman for a captured Hero through both release rules, resolves both cases, and reverses both',async()=>{
  const all=await cases();expect(all).toHaveLength(2)
  const a=all.find((c:any)=>c.subject_kind==='henchman'),b=all.find((c:any)=>c.subject_kind==='hero')
  expect([a.victim_warband_id,a.captor_warband_id,b.victim_warband_id,b.captor_warband_id]).toEqual([vw,cw,cw,vw])
  const [owner,captor]=[await detail(vw),await detail(cw)]
  const built=buildExchangeProposal({caseA:a as CaptiveCase,caseB:b as CaptiveCase,owner,captor})
  expect(built.message).toMatch(/Warriors \(model 1\) released and rejoins Warriors with his kit: Sword\. In return: Packmaster Vikt returns to Disposable Moulder with all equipment/)
  const ownerChanges=diffRoster(owner,built.nextOwner),captorChanges=diffRoster(captor,built.nextCaptor)
  // Gold, a self-reference, a partner held the same way round, or a Kidnapped! case are refused.
  expect((await propose(reik,a.id,built.choice,[...ownerChanges,{table:'warbands',op:'update',data:{gold:90}}],captorChanges)).error?.message).toMatch(/gold changes do not match/)
  expect((await propose(reik,a.id,{...built.choice,otherCaseId:a.id},ownerChanges,captorChanges)).error?.message).toMatch(/not found/)
  expect((await propose(reik,a.id,built.choice,ownerChanges,[])).error?.message).toMatch(/must become "active"/)
  const id=check(await propose(reik,a.id,built.choice,ownerChanges,captorChanges))
  const msg=check(await moulder.from('captive_proposals').select('message').eq('id',id).single()).message
  expect(msg).toMatch(/^Exchange of captives\. Warriors \(model 1\) \(Disposable Reiklanders\) returns to Warriors\. kit restored: sword\. In return: Packmaster Vikt \(Disposable Moulder\) becomes active\. Packmaster Vikt keeps all 1 equipment item\(s\)\.$/)
  expect((await reik.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'})).error?.message).toMatch(/other warband's player/)
  check(await moulder.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('size').eq('id',group).single()).size).toBe(3)
  expect(check(await admin.from('items').select('quantity').eq('id',swords).single()).quantity).toBe(3)
  expect(check(await admin.from('heroes').select('status,flags').eq('id',packmaster).single())).toEqual({status:'active',flags:{}})
  const after=await cases();expect(after.map((c:any)=>[c.subject_kind,c.state,c.resolution_kind])).toEqual(expect.arrayContaining([['henchman','resolved','exchange'],['hero','resolved','exchange']]))
  expect(after.find((c:any)=>c.id===b.id).resolved_by_proposal).toBe(id)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/depends on this report/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:a.id,p_reason:'The exchange fell through'}))
  expect(check(await admin.from('heroes').select('status').eq('id',packmaster).single()).status).toBe('captured')
  expect(check(await admin.from('henchman_groups').select('size').eq('id',group).single()).size).toBe(2)
  expect((await cases()).map((c:any)=>c.state)).toEqual(['open','open'])
 })
})
