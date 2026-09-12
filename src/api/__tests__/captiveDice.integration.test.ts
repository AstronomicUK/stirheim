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
})
