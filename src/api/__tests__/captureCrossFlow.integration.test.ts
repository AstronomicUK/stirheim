import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildExchangeProposal } from '../captiveExchange'
import { buildCompanionCaptiveProposal } from '../companionCaptives'
import { buildKidnappedProposal } from '../pirates'
import type { CaptiveCase } from '../captives'
import { resolveCaptive } from '../../rules/resolve/captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
import { eventAdvances } from '../../rules/resolve/eventAdvances'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const captainStats={M:4,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8}
const crewStats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
/**
 * One three-warband battle exercising every capture path together: a Hero captured on a 61, two
 * Warriors and a Wardog taken by the Subjugator, a Warrior lost for good that the Pirates carry off,
 * and a Moulder Hero captured by the Reiklanders — then ransom, exchange (with a concurrent attempt
 * on the same partner), companion release, Kidnapped! Swabbie, report dependencies and reversal.
 */
describe.skipIf(!enabled)('Capture flows together in one battle (#229 cross-flow)',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,moulder:SupabaseClient,pirate:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let R:string,M:string,P:string,campaign:string,match:string
 let captain:string,handler:string,dogs:string,warriors:string,swords:string,skrit:string,packmaster:string
 const events:Record<string,string>={}
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`crossflow-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Crossflow QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,moulder,pirate,gm]=clients
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Crossflow Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Crossflow Moulder',type_rules_id:'skaven_of_clan_moulder',gold:100},{owner_id:users[2],name:'Crossflow Pirates',type_rules_id:'pirates',gold:100}]).select('id'));[R,M,P]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[3],name:'Crossflow',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:R,user_id:users[0]},{campaign_id:campaign,warband_id:M,user_id:users[1]},{campaign_id:campaign,warband_id:P,user_id:users[2]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[3],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([R,M,P].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  captain=check(await admin.from('heroes').insert({warband_id:R,name:'Captain Ulric',unit_type_rules_id:'mercenaries_reikland_captain',stats:{...stats,Ld:8},xp:12,status:'active',skills:['dodge']}).select('id').single()).id
  check(await admin.from('items').insert({warband_id:R,holder_type:'hero',holder_id:captain,item_rules_id:'sword',quantity:1}))
  handler=check(await admin.from('heroes').insert({warband_id:R,name:'Houndmaster Gert',unit_type_rules_id:'mercenaries_reikland_champions',stats,xp:8,status:'active'}).select('id').single()).id
  dogs=check(await admin.from('items').insert({warband_id:R,holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:1}).select('id').single()).id
  warriors=check(await admin.from('henchman_groups').insert({warband_id:R,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:4,stats,xp:2}).select('id').single()).id
  swords=check(await admin.from('items').insert({warband_id:R,holder_type:'group',holder_id:warriors,item_rules_id:'sword',quantity:4}).select('id').single()).id
  skrit=check(await admin.from('heroes').insert({warband_id:M,name:'Master Moulder Skrit',unit_type_rules_id:'skaven_of_clan_moulder_master_moulder',stats,xp:20,status:'active'}).select('id').single()).id
  packmaster=check(await admin.from('heroes').insert({warband_id:M,name:'Packmaster Vikt',unit_type_rules_id:'skaven_of_clan_moulder_packmaster',stats,xp:6,status:'active'}).select('id').single()).id
  check(await admin.from('heroes').insert({warband_id:P,name:'Captain Redbeard',unit_type_rules_id:'pirates_captain',stats:captainStats,xp:20,status:'active'}))
  check(await admin.from('henchman_groups').insert({warband_id:P,name:'Deck hands',unit_type_rules_id:'pirates_crew',size:2,stats:crewStats,xp:0}))
  const attack=(at:string,target_id:string,target_kind:string,target_name:string,target_size:number)=>({match_id:match,actor_id:users[1],actor_warband_id:M,at,kind:'attack',summary:target_name,payload:{attacker_warband_id:M,attacker_id:skrit,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:R,target_id,target_kind,target_name,target_size,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:2,capture_reason:'subjugator'}})
  const rows=check(await admin.from('battle_events').insert([attack('2026-09-12T18:00:00Z',warriors,'group','Warriors',4),attack('2026-09-12T18:01:00Z',warriors,'group','Warriors',4),attack('2026-09-12T18:02:00Z',`animal:${handler}:wardogs:1`,'hero','Wardog',1)]).select('id,at,summary'))
  for(const r of rows as any[])events[r.at]=r.id
 })
 afterAll(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(R)await admin.from('warbands').delete().in('id',[R,M,P])
  await admin.from('app_notifications').delete().in('user_id',users)
  for(const id of users)await admin.auth.admin.deleteUser(id)
 })
 const cases=async()=>check(await gm.from('captive_cases').select('*,proposals:captive_proposals(id,state,message)').eq('match_id',match).order('created_at').order('model_index'))
 const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id).order('created_at')),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id).order('created_at')),is=check(await admin.from('items').select('*').eq('warband_id',id).order('created_at'));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
 async function expected(a:string,b:string){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[a,b]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[a,b]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[a,b]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[a,b]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const send=async(client:SupabaseClient,c:CaptiveCase,built:{choice:unknown;nextOwner:any;nextCaptor:any;message:string},owner:any,captor:any)=>client.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:built.choice,p_message:built.message,p_owner_changes:diffRoster(owner,built.nextOwner),p_captor_changes:diffRoster(captor,built.nextCaptor),p_advances:[...eventAdvances(owner.roster,built.nextOwner),...eventAdvances(captor.roster,built.nextCaptor)],p_expected:await expected(c.victim_warband_id,c.captor_warband_id!)})
 const byKind=(all:any[],pick:(c:any)=>boolean)=>all.find(pick)

 it('opens every case from the three reports',async()=>{
  // Reiklanders: Captain captured (61), Warriors: model 1 and 2 taken by the Subjugator, model 3 lost for good (die 1), model 4 survives; the Wardog captured.
  check(await reik.rpc('submit_battle_report',{p_match_id:match,p_warband_id:R,p_report:{result:'lost',ooa:[{subjectType:'hero',subjectId:captain,subjectName:'Captain Ulric',count:1,by:['Master Moulder Skrit (Crossflow Moulder)']}],
   injuries:[{subjectType:'hero',subjectId:captain,subjectName:'Captain Ulric',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''},
             {subjectType:'group',subjectId:warriors,subjectName:'Warriors',rolls:[1],dead:1,equipmentLost:[{sourceItemId:swords,quantity:3}],captured:[{modelIndex:1,eventId:events['2026-09-12T18:00:00+00:00']??events['2026-09-12T18:00:00Z'],captorWarbandId:M,reason:'subjugator',kit:[{sourceItemId:swords,itemId:'sword',quantity:1}]},{modelIndex:2,eventId:events['2026-09-12T18:01:00+00:00']??events['2026-09-12T18:01:00Z'],captorWarbandId:M,reason:'subjugator',kit:[{sourceItemId:swords,itemId:'sword',quantity:1}]}]}],
   applied:{heroes:[{id:captain,patch:{status:'captured',flags:{captured:true}}}],groups:[{id:warriors,patch:{size:1}}],item_patches:[{id:swords,quantity:1},{id:dogs,quantity:0}],
            captured_companions:[{sourceItemId:dogs,holderId:handler,itemId:'wardogs',animalId:`animal:${handler}:wardogs:1`,eventId:events['2026-09-12T18:02:00+00:00']??events['2026-09-12T18:02:00Z'],captorWarbandId:M,reason:'subjugator'}]}}}))
  check(await moulder.rpc('submit_battle_report',{p_match_id:match,p_warband_id:M,p_report:{result:'won',ooa:[],
   injuries:[{subjectType:'hero',subjectId:packmaster,subjectName:'Packmaster Vikt',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}],
   applied:{heroes:[{id:packmaster,patch:{status:'captured',flags:{captured:true}}}]}}}))
  check(await pirate.rpc('submit_battle_report',{p_match_id:match,p_warband_id:P,p_report:{result:'won',applied:{}}}))
  const all=await cases()
  const summary=all.map((c:any)=>[c.subject_kind,c.source,c.model_index,c.state,c.captor_warband_id===M?'M':c.captor_warband_id===P?'P':c.captor_warband_id===R?'R':null]).sort()
  expect(summary).toEqual([
   ['companion','forced_capture_companion',1,'open','M'],
   ['henchman','forced_capture',1,'open','M'],['henchman','forced_capture',2,'open','M'],
   ['henchman','pirates_kidnapped',1,'open','P'],
   ['hero','captured',0,'open','M'],   // the sheet named Skrit's warband
   ['hero','captured',0,'unassigned',null], // the Packmaster: three enemies, nobody named
  ].sort())
  expect(byKind(all,c=>c.source==='pirates_kidnapped').model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:1,lost:1})])
 })
 it('ransoms the Captain through the core flow',async()=>{
  const c=byKind(await cases(),x=>x.subject_kind==='hero'&&x.hero_id===captain)
  const [owner,captor]=[await detail(R),await detail(M)]
  const preview=resolveCaptive(owner.roster,captor.roster,captain,{kind:'ransom',gold:30})
  const id=check(await send(moulder,c,{choice:{kind:'ransom',gold:30},nextOwner:preview.owner,nextCaptor:preview.captor,message:preview.message},owner,captor))
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('heroes').select('status').eq('id',captain).single()).status).toBe('active')
  expect(check(await admin.from('warbands').select('gold').in('id',[R,M])).map((w:any)=>w.gold).sort((a:number,b:number)=>a-b)).toEqual([70,130])
 })
 it('lets the Moulder name the Reiklanders as the Packmaster’s captor, then two exchanges race for him and exactly one wins',async()=>{
  const b=byKind(await cases(),x=>x.hero_id===packmaster)
  check(await moulder.rpc('assign_captive_captor',{p_case_id:b.id,p_captor_warband_id:R}))
  const all=await cases();const partner=byKind(all,x=>x.hero_id===packmaster)
  const [a1,a2]=all.filter((x:any)=>x.source==='forced_capture').sort((x:any,y:any)=>x.model_index-y.model_index)
  const [owner,captor]=[await detail(R),await detail(M)]
  const e1=buildExchangeProposal({caseA:a1,caseB:partner,owner,captor}),e2=buildExchangeProposal({caseA:a2,caseB:partner,owner,captor})
  const id1=check(await send(reik,a1,e1,owner,captor)),id2=check(await send(reik,a2,e2,owner,captor))
  const results=await Promise.all([moulder.rpc('respond_captive_proposal',{p_proposal_id:id1,p_action:'accept'}),moulder.rpc('respond_captive_proposal',{p_proposal_id:id2,p_action:'accept'})])
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  expect(results.filter(r=>r.error).map(r=>r.error!.message).join(' ')).toMatch(/no longer held|changed after this outcome was proposed|no longer open/)
  const after=await cases()
  expect(after.filter((x:any)=>x.source==='forced_capture'&&x.state==='resolved')).toHaveLength(1)
  expect(byKind(after,x=>x.hero_id===packmaster)).toMatchObject({state:'resolved',resolution_kind:'exchange'})
  expect(check(await admin.from('heroes').select('status').eq('id',packmaster).single()).status).toBe('active')
  expect(check(await admin.from('henchman_groups').select('size').eq('id',warriors).single()).size).toBe(2)
  expect(check(await admin.from('items').select('quantity').eq('id',swords).single()).quantity).toBe(2)
 })
 it('releases the Wardog, presses the lost Warrior into a Swabbie, and pins both source reports',async()=>{
  let all=await cases()
  const dog=byKind(all,x=>x.subject_kind==='companion')
  let [owner,captor]=[await detail(R),await detail(M)]
  const rel=buildCompanionCaptiveProposal({item:dog,owner,captor,choice:{kind:'release'}})
  const idDog=check(await send(moulder,dog,rel,owner,captor))
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:idDog,p_action:'accept'}))
  expect(check(await admin.from('items').select('quantity').eq('warband_id',R).eq('item_rules_id','wardogs').single()).quantity).toBe(1)
  const lost=byKind(all,x=>x.source==='pirates_kidnapped')
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:lost.id,p_d6:5}))
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:lost.id,p_dice:[1,1]}));check(await reik.rpc('record_kidnap_dice',{p_case_id:lost.id,p_dice:[6,6]}))
  all=await cases();const lostNow=byKind(all,x=>x.id===lost.id)
  ;[owner,captor]=[await detail(R),await detail(P)]
  const kid=buildKidnappedProposal({item:lostNow,owner,captor,winner:'pirates',kit:[],newGroupId:crypto.randomUUID()})
  expect(kid.outcome).toBe('swabbie')
  const idKid=check(await send(pirate,lostNow,kid,owner,captor))
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:idKid,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('unit_type_rules_id,size').eq('warband_id',P).order('created_at'))).toEqual([{unit_type_rules_id:'pirates_crew',size:2},{unit_type_rules_id:'pirates_swabbie',size:1}])
  expect(check(await admin.from('items').select('item_rules_id,quantity').eq('warband_id',P).eq('holder_type','stash'))).toEqual([{item_rules_id:'sword',quantity:1}])
  for(const w of [R,M,P])expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:w})).error?.message).toMatch(/depends on this report|equipment has changed/)
 })
 it('unwinds every outcome newest first (older ones refuse while later changes stand) so all three reports can be withdrawn again',async()=>{
  const all=await cases()
  const ex=byKind(all,x=>x.source==='forced_capture'&&x.state==='resolved')
  // The exchange was recorded before the Wardog release and the Swabbie touched the same rosters: it cannot be restored first.
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:ex.id,p_reason:'Recorded against the wrong Warrior'})).error?.message).toMatch(/has changed since this outcome was recorded/)
  // The Packmaster's case was resolved by the exchange proposal itself and reopens with it.
  const resolved=all.filter((x:any)=>x.state==='resolved'&&!x.resolved_by_proposal).sort((x:any,y:any)=>(y.resolved_at??'').localeCompare(x.resolved_at??''))
  expect(resolved.map((x:any)=>x.source)).toEqual(['pirates_kidnapped','forced_capture_companion','forced_capture','captured'])
  for(const c of resolved)check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Unwinding the whole battle for a refile'}))
  const after=await cases()
  expect(after.every((x:any)=>x.state==='open'||x.state==='unassigned')).toBe(true)
  expect(byKind(after,x=>x.hero_id===packmaster).state).toBe('open')
  expect(check(await admin.from('heroes').select('status').eq('id',packmaster).single()).status).toBe('captured')
  expect(check(await admin.from('heroes').select('status').eq('id',captain).single()).status).toBe('captured')
  expect(check(await admin.from('henchman_groups').select('size').eq('id',warriors).single()).size).toBe(1)
  expect(check(await admin.from('henchman_groups').select('id').eq('warband_id',P))).toHaveLength(1)
  expect(check(await admin.from('warbands').select('id,gold').in('id',[R,M,P])).every((w:any)=>w.gold===100)).toBe(true)
  for(const w of [P,M,R])check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:w}))
  expect(check(await admin.from('heroes').select('status').eq('id',captain).single()).status).toBe('active')
  expect(check(await admin.from('henchman_groups').select('size').eq('id',warriors).single()).size).toBe(4)
  expect(check(await admin.from('items').select('quantity').eq('id',swords).single()).quantity).toBe(4)
  expect(await cases()).toHaveLength(0)
 })
})
