import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:5,WS:3,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:5}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Capture combat-log correction order (#229)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,group:string,swords:string,shields:string,moulder:string,events:string[]=[]
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`forced-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Forced QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,,gm]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Moulder',type_rules_id:'skaven_of_clan_moulder',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Subjugator',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  group=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:2}).select('id').single()).id
  swords=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:group,item_rules_id:'sword',quantity:3}).select('id').single()).id
  shields=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:group,item_rules_id:'shield',quantity:3,notes:'Painted red'}).select('id').single()).id
  moulder=check(await admin.from('heroes').insert({warband_id:cw,name:'Master Moulder Skrit',unit_type_rules_id:'skaven_of_clan_moulder_master_moulder',stats,xp:20,status:'active',skills:['skaven_of_clan_moulder_special_skills_subjugator_of_mankind']}).select('id').single()).id
  // Three out-of-action events against the group, in time order: two captures and one ordinary hit.
  const payload=(capture:boolean)=>({attacker_warband_id:cw,attacker_id:moulder,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:group,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:2,...(capture?{capture_reason:'subjugator'}:{})})
  const rows=check(await admin.from('battle_events').insert([
   {match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:00:00Z',kind:'attack',payload:payload(true),summary:'capture 1'},
   {match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:01:00Z',kind:'attack',payload:payload(true),summary:'capture 2'},
   {match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:02:00Z',kind:'attack',payload:payload(false),summary:'ordinary'},
  ]).select('id,at'));events=[...rows].sort((a:any,b:any)=>a.at.localeCompare(b.at)).map((r:any)=>r.id)
 })
 afterEach(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,cw])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const kit=(q=1)=>[{sourceItemId:swords,itemId:'sword',quantity:q},{sourceItemId:shields,itemId:'shield',quantity:q,notes:'Painted red'}]
 const cap=(modelIndex:number,eventId:string,extra:Record<string,unknown>={})=>({modelIndex,eventId,captorWarbandId:cw,reason:'subjugator',kit:kit(),...extra})
 const file=(captured:unknown[],over:{size?:number;swordQty?:number;shieldQty?:number;rolls?:number[];dead?:number;swordsLost?:number;shieldsLost?:number;unaccounted?:boolean}={})=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
  injuries:[{subjectType:'group',subjectId:group,subjectName:'Warriors',rolls:over.rolls??[4],dead:over.dead??0,captured,...(over.unaccounted?{}:{equipmentLost:[{sourceItemId:swords,quantity:over.swordsLost??2},{sourceItemId:shields,quantity:over.shieldsLost??2}]})}],
  applied:{heroes:[],groups:[{id:group,patch:{size:over.size??1}}],item_patches:[{id:swords,quantity:over.swordQty??1},{id:shields,quantity:over.shieldQty??1}]}}})

 it('protects source captures and group casualty numbering until the report is withdrawn',async()=>{
  check(await file([cap(1,events[0]),cap(2,events[1])]))
  for(const event of events){
   expect((await gm.rpc('revert_battle_event',{p_event_id:event,p_note:'Correcting the combat log'})).error?.message).toMatch(/Withdraw the affected post-battle report/)
  }
  const saved=check(await admin.from('battle_events').select('reverted_at').in('id',events))
  expect(saved.every((e:{reverted_at:string|null})=>e.reverted_at===null)).toBe(true)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw}))
  check(await gm.rpc('revert_battle_event',{p_event_id:events[0],p_note:'Report withdrawn; correcting the casualty'}))
  expect(check(await admin.from('battle_events').select('reverted_at').eq('id',events[0]).single()).reverted_at).toBeTruthy()
 })
})
