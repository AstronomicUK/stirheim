import {toRosterWarband} from '../../domain/roster'
import {diffRoster} from '../../domain/rosterDiff'
import {resolveCaptive} from '../../rules/resolve/captives'
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Core captive dice provenance (#229)',()=>{
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

 it('rejects a fresh Hero 61 at the Cavalcade Thrall limit without applying the victim report',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'the_cursed_cavalcade'}).eq('id',cw))
  check(await admin.from('henchman_groups').insert({warband_id:cw,name:'Five Thralls',unit_type_rules_id:'cursed_cavalcade_captured_thrall',size:5,stats,xp:0}))
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  expect((await fileVictim()).error?.message).toMatch(/capture limit/)
  expect(check(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('active')
  expect(await cases()).toEqual([])
  check(await fileVictim('recovered'))
  expect(await cases()).toEqual([])
 })
 it('rejects three Hero captures in one report but accepts two',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'the_cursed_cavalcade'}).eq('id',cw))
  const more=check(await admin.from('heroes').insert([1,2].map(n=>({warband_id:vw,name:`Other ${n}`,unit_type_rules_id:'mercenaries_reikland_champions',stats,xp:8,status:'active'}))).select('id')) as {id:string}[]
  const ids=[hero,...more.map(h=>h.id)]
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  const file=(n:number)=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',injuries:ids.slice(0,n).map(id=>({subjectType:'hero',subjectId:id,subjectName:'Captured hero',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''})),applied:{heroes:ids.slice(0,n).map(id=>({id,patch:{status:'captured',flags:{captured:true}}}))}}})
  expect((await file(3)).error?.message).toMatch(/capture limit/)
  expect(await cases()).toEqual([])
  check(await file(2));expect(await cases()).toHaveLength(2)
 })
 it('preserves an edited app sale die through consent and final resolution, rejecting impossible originals',async()=>{
  check(await fileVictim())
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  const [c]=await cases()
  const sale=async(originalD6:unknown,d6=2)=>captor.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'sell',d6,originalD6},p_message:'User note',p_advances:[],p_expected:await expected(),
   p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'retired',flags:{}}}],p_captor_changes:[{table:'warbands',op:'update',data:{gold:110}}]})
  expect((await sale(9)).error?.message).toMatch(/original D6/)
  expect((await sale(1.5)).error?.message).toMatch(/original D6/)
  expect((await sale('2')).error?.message).toMatch(/original D6/)
  expect((await sale(2,2.5)).error?.message).toMatch(/whole number/)
  const id=check(await sale(6))
  expect(check(await admin.from('captive_proposals').select('message').eq('id',id).single()).message).toContain('D6: app rolled 6; player changed this to 2.')
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('captive_cases').select('resolution_message').eq('id',c.id).single()).resolution_message).toContain('app rolled 6; player changed this to 2')
  expect(check(await admin.from('warbands').select('gold').eq('id',cw).single()).gold).toBe(110)
 })
 it('builds and accepts a real Throne transformation without treating a Thrall as a gold hire',async()=>{
  check(await admin.from('warbands').update({type_rules_id:'the_cursed_cavalcade'}).eq('id',cw))
  check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1,notes:'Engraved heirloom'}))
  check(await fileVictim('captured',[cw]))
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}}))
  const [c]=await cases()
  async function rows(id:string){
   const warband=check(await admin.from('warbands').select('*').eq('id',id).single())
   const heroes=check(await admin.from('heroes').select('*').eq('warband_id',id))
   const groups=check(await admin.from('henchman_groups').select('*').eq('warband_id',id))
   const items=check(await admin.from('items').select('*').eq('warband_id',id))
   return {warband,heroes,groups,items,roster:toRosterWarband(warband,heroes,groups,items)}
  }
  const owner=await rows(vw),enemy=await rows(cw)
  const choice={kind:'throne' as const,d6:4,originalD6:1,groupId:crypto.randomUUID(),leaderId:''}
  const result=resolveCaptive(owner.roster,enemy.roster,hero,choice)
  const offer=async()=>captor.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:choice,p_message:result.message,p_advances:[],p_expected:await expected(),p_owner_changes:diffRoster(owner,result.owner),p_captor_changes:diffRoster(enemy,result.captor)})
  const capped=check(await admin.from('henchman_groups').insert({warband_id:cw,name:'Five existing Thralls',unit_type_rules_id:'cursed_cavalcade_captured_thrall',size:5,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:5},xp:0}).select('id').single()).id
  expect((await offer()).error?.message).toMatch(/five Captured Thralls/)
  check(await admin.from('henchman_groups').delete().eq('id',capped))
  const proposal=check(await offer())
  expect(check(await admin.from('henchman_groups').select('id').eq('warband_id',cw))).toHaveLength(0)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'}))
  const saved=await rows(cw)
  expect(saved.roster.henchmenGroups).toHaveLength(1)
  expect(saved.roster.henchmenGroups[0]).toMatchObject({unitTemplateId:'cursed_cavalcade_captured_thrall',size:1,xp:0})
  expect(saved.roster.gold).toBe(100)
  expect(saved.roster.stash).toContainEqual(expect.objectContaining({itemId:'sword',quantity:1,notes:'Engraved heirloom'}))
  expect((await rows(vw)).roster.heroes[0]).toMatchObject({status:'dead',equipment:[]})
  expect(check(await admin.from('captive_cases').select('resolution_message').eq('id',c.id).single()).resolution_message).toContain('app rolled 1; player changed this to 4')
  expect((await victim.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'})).error).not.toBeNull()
 })

})
