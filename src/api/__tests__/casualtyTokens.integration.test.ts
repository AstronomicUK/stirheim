import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Casualty tokens: one standing event per model going down',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,moulder:SupabaseClient,outsider:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,ow:string,campaign:string,match:string,group:string,skrit:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`casualty-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Casualty QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,moulder,outsider]=clients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Token Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Token Moulder',type_rules_id:'skaven_of_clan_moulder',gold:100},{owner_id:users[2],name:'Token Outsiders',type_rules_id:'mercenaries_marienburg',gold:100}]).select('id'));[vw,cw,ow]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[3],name:'Token campaign',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'in_progress'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  group=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:0}).select('id').single()).id
  skrit=check(await admin.from('heroes').insert({warband_id:cw,name:'Master Moulder Skrit',unit_type_rules_id:'skaven_of_clan_moulder_master_moulder',stats,xp:20,status:'active'}).select('id').single()).id
 })
 afterAll(async()=>{
  if(match){await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,cw,ow])
  for(const id of users)await admin.auth.admin.deleteUser(id)
 })
 const token=(n:number)=>`casualty:${match}:${vw}:${group}:manual:${n}`
 const payload=(n:number,extra:Record<string,unknown>={})=>({casualty_token:token(n),attacker_warband_id:cw,attacker_id:skrit,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:group,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:0,out_of_action:true,kill:false,outcome:'Captured (Subjugator of Mankind)',turn:2,capture_reason:'subjugator',capture_source:'table',metadata_only:true,manual_casualty_index:n,...extra})
 const mark=(client:SupabaseClient,n:number,extra:Record<string,unknown>={})=>client.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:payload(n,extra),p_summary:`Turn 2: Skrit captured a Warrior (model ${n+1}) at the table.`})
 const events=async()=>check(await admin.from('battle_events').select('id,reverted_at,payload').eq('match_id',match).order('at'))

 it('is idempotent per token, distinguishes two models felled by one Hero in one turn, and refuses outsiders and non-casualties',async()=>{
  const a=check(await mark(reik,0)),again=check(await mark(reik,0)),b=check(await mark(reik,1))
  expect(again).toBe(a);expect(b).not.toBe(a)
  expect((await events()).filter((e:any)=>!e.reverted_at)).toHaveLength(2)
  expect((await mark(outsider,2)).error?.message).toMatch(/your own warband|player at this table/)
  expect((await mark(reik,2,{out_of_action:false})).error?.message).toMatch(/must carry metadata_only/)
  expect((await mark(reik,2,{metadata_only:false})).error?.message).toMatch(/must carry metadata_only/)
  expect((await mark(reik,2,{manual_casualty_index:5})).error?.message).toMatch(/equal to the token index/)
  expect((await mark(reik,2,{kill:true})).error?.message).toMatch(/no kill/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(2),casualty_token:`casualty:${crypto.randomUUID()}:${vw}:${group}:manual:2`}})).error?.message).toMatch(/does not belong to this match/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(2),casualty_token:`casualty:${match}:${vw}:${group}:2`}})).error?.message).toMatch(/not a manual casualty token/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(2),target_id:skrit}})).error?.message).toMatch(/names a different target/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(2),casualty_token:`casualty:${match}:${cw}:${group}:manual:2`}})).error?.message).toMatch(/names a different target/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:cw,p_payload:payload(2)})).error?.message).toMatch(/recorded by the warband that suffered it/)
  expect((await moulder.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:payload(2)})).error?.message).toMatch(/your own warband/)
  expect((await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(2),attacker_warband_id:ow}})).error?.message).toMatch(/Both the victim and the attacking warband/)
  // An animal id keeps its own colons inside the token.
  const animalToken=`casualty:${match}:${vw}:animal:${skrit}:wardogs:1:manual:0`
  const animal=check(await reik.rpc('mark_casualty_event',{p_match_id:match,p_actor_warband_id:vw,p_payload:{...payload(0),casualty_token:animalToken,target_id:`animal:${skrit}:wardogs:1`,target_kind:'hero',target_name:'Wardog'}}))
  check(await reik.rpc('unmark_casualty_event',{p_match_id:match,p_token:animalToken}));expect((await events()).find((e:any)=>e.id===animal).reverted_at).not.toBeNull()
  // A raw insert with a standing token is refused by the index too.
  expect((await admin.from('battle_events').insert({match_id:match,actor_id:users[0],actor_warband_id:vw,kind:'attack',payload:payload(0),summary:'dup'})).error?.message).toMatch(/battle_events_casualty_token_key/)
 })
 it('unmarks through the revert path and lets the casualty be marked again afterwards',async()=>{
  const [a]=(await events()).filter((e:any)=>!e.reverted_at&&e.payload.casualty_token===token(0)).map((e:any)=>e.id)
  expect(check(await reik.rpc('unmark_casualty_event',{p_match_id:match,p_token:token(0),p_note:'Marked the wrong model'}))).toBe(a)
  expect(check(await reik.rpc('unmark_casualty_event',{p_match_id:match,p_token:token(0)}))).toBeNull()
  const row=(await events()).find((e:any)=>e.id===a);expect(row.reverted_at).not.toBeNull()
  const c=check(await mark(reik,0));expect(c).not.toBe(a)
  // Same content returns the standing marker; a changed attribution replaces it atomically (old reverted, new inserted).
  expect(check(await mark(reik,0))).toBe(c)
  const d=check(await mark(reik,0,{attacker_name:'Master Moulder Skrit (corrected)'}));expect(d).not.toBe(c)
  expect((await events()).find((e:any)=>e.id===c).reverted_at).not.toBeNull()
  expect((await events()).filter((e:any)=>!e.reverted_at).map((e:any)=>e.payload.casualty_token).sort()).toEqual([token(0),token(1)])
  // Concurrent marks of one new casualty collapse to a single event.
  const results=await Promise.all([mark(reik,2),mark(reik,2),mark(reik,2)])
  const ids=results.map(r=>check(r));expect(new Set(ids).size).toBe(1)
  expect((await events()).filter((e:any)=>!e.reverted_at)).toHaveLength(3)
 })
})
