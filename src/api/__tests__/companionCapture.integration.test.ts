import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildCompanionCaptiveProposal } from '../companionCaptives'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Captured equipment companions (Subjugator of Mankind, #229)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,captor:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,handler:string,other:string,dogs:string,moulder:string,events:string[]=[]
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`companion-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Companion QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,captor,gm]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Moulder',type_rules_id:'skaven_of_clan_moulder',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Companions',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  handler=check(await admin.from('heroes').insert({warband_id:vw,name:'Houndmaster Gert',unit_type_rules_id:'mercenaries_reikland_champions',stats,xp:8,status:'active'}).select('id').single()).id
  other=check(await admin.from('heroes').insert({warband_id:vw,name:'Youngblood Pim',unit_type_rules_id:'mercenaries_reikland_youngbloods',stats,xp:0,status:'active'}).select('id').single()).id
  dogs=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:2,notes:'Brindle pair'}).select('id').single()).id
  moulder=check(await admin.from('heroes').insert({warband_id:cw,name:'Master Moulder Skrit',unit_type_rules_id:'skaven_of_clan_moulder_master_moulder',stats,xp:20,status:'active'}).select('id').single()).id
  const payload=(n:number)=>({attacker_warband_id:cw,attacker_id:moulder,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:`animal:${handler}:wardogs:${n}`,target_kind:'hero',target_name:`Wardog ${n}`,target_size:1,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:2,capture_reason:'subjugator'})
  const rows=check(await admin.from('battle_events').insert([{match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:00:00Z',kind:'attack',payload:payload(1),summary:'dog 1'},{match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:01:00Z',kind:'attack',payload:payload(2),summary:'dog 2'}]).select('id,at'))
  events=[...rows].sort((a:any,b:any)=>a.at.localeCompare(b.at)).map((r:any)=>r.id)
 })
 afterEach(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('battle_events').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,cw])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const cap=(n:number,eventId:string,extra:Record<string,unknown>={})=>({sourceItemId:dogs,holderId:handler,itemId:'wardogs',animalId:`animal:${handler}:wardogs:${n}`,eventId,captorWarbandId:cw,reason:'subjugator',...extra})
 const file=(captured:unknown[],remaining=2-captured.length)=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],injuries:[],applied:{heroes:[],groups:[],item_patches:[{id:dogs,quantity:remaining}],captured_companions:captured}}})
 const fileCaptor=()=>captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}})
 const cases=async()=>check(await victim.from('captive_cases').select('*,proposals:captive_proposals(id,state,message)').eq('match_id',match).order('model_index'))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Companion',p_owner_changes,p_captor_changes,p_advances:[],p_expected:await expected()})
 const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id).order('created_at')),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id).order('created_at'));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
 const viaBuilder=async(c:CaptiveCase,client:SupabaseClient,choice:any)=>{
  const [owner,captorD]=[await detail(vw),await detail(cw)]
  const built=buildCompanionCaptiveProposal({item:c,owner,captor:captorD,choice})
  const r=await client.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:built.choice,p_message:built.message,p_owner_changes:diffRoster(owner,built.nextOwner),p_captor_changes:diffRoster(captorD,built.nextCaptor),p_advances:[],p_expected:await expected()})
  return {built,r}
 }
 const dogQty=async(holderId:string|null)=>{const q=admin.from('items').select('quantity,notes').eq('warband_id',vw).eq('item_rules_id','wardogs');const r=check(await (holderId?q.eq('holder_id',holderId):q.eq('holder_type','stash')));return r}

 it('rejects unverifiable companion captures and opens one case per captured animal with the item and handler recorded',async()=>{
  expect((await file([cap(1,events[1])])).error?.message).toMatch(/no matching unreverted capture event/)
  expect((await file([cap(1,events[0]),cap(1,events[0])],0)).error?.message).toMatch(/used twice/)
  expect((await file([cap(1,events[0]),cap(2,events[1])],1)).error?.message).toMatch(/removed only 1 Wardog/)
  expect((await file([cap(1,events[0],{animalId:`animal:${other}:wardogs:1`})])).error?.message).toMatch(/does not name this holder/)
  expect((await file([cap(1,events[0],{itemId:'sword',animalId:`animal:${handler}:sword:1`})])).error?.message).toMatch(/not an equipment companion/)
  check(await file([cap(1,events[0]),cap(2,events[1])],0));check(await fileCaptor())
  const opened=await cases()
  expect(opened.map((c:any)=>[c.subject_kind,c.source,c.model_index,c.hero_name,c.hero_id])).toEqual([['companion','forced_capture_companion',1,'Wardog of Houndmaster Gert',dogs],['companion','forced_capture_companion',2,'Wardog of Houndmaster Gert',dogs]])
  expect(opened[0].model_snapshot).toMatchObject({item:{item_rules_id:'wardogs',notes:'Brindle pair'},holder:{id:handler,name:'Houndmaster Gert'},animal_id:`animal:${handler}:wardogs:1`,event_id:events[0],kind_name:'Wardog'})
  expect(check(await admin.from('items').select('id').eq('id',dogs))).toHaveLength(0)
  expect(check(await captor.from('app_notifications').select('title')).filter((n:any)=>/captured Wardog/.test(n.title))).toHaveLength(2)
 })
 it('returns a released animal to its handler, to a chosen Hero or the stash once the handler is gone, and sells for 5 × D6',async()=>{
  check(await file([cap(1,events[0]),cap(2,events[1])],0));check(await fileCaptor())
  const [first,second]=await cases()
  // Wrong holder, wrong notes, two changes, or gold for a release are refused.
  expect((await propose(victim,first.id,{kind:'release'},[{table:'items',op:'insert',data:{holder_type:'hero',holder_id:other,item_rules_id:'wardogs',quantity:1,notes:'Brindle pair'}}],[])).error?.message).toMatch(/goes to Houndmaster Gert as exactly one wardogs/)
  expect((await propose(victim,first.id,{kind:'release'},[{table:'items',op:'insert',data:{holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:1}}],[])).error?.message).toMatch(/with its original notes/)
  expect((await propose(victim,first.id,{kind:'release'},[{table:'items',op:'insert',data:{holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:1,notes:'Brindle pair'}}],[{table:'warbands',op:'update',data:{gold:120}}])).error?.message).toMatch(/gold changes do not match/)
  const a=await viaBuilder(first,victim,{kind:'release'});expect(a.built.original).toBe(true);const idA=check(a.r)
  expect(check(await captor.from('captive_proposals').select('message').eq('id',idA).single()).message).toMatch(/Released: Wardog of Houndmaster Gert \(Disposable Reiklanders\) returns to Houndmaster Gert\./)
  check(await captor.rpc('respond_captive_proposal',{p_proposal_id:idA,p_action:'accept'}))
  expect(await dogQty(handler)).toEqual([{quantity:1,notes:'Brindle pair'}])
  // The handler dies; the second dog can only go to a chosen active Hero or the stash.
  check(await admin.from('heroes').update({status:'dead'}).eq('id',handler))
  expect((await propose(captor,second.id,{kind:'ransom',gold:10},[{table:'warbands',op:'update',data:{gold:90}},{table:'items',op:'insert',data:{holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:1,notes:'Brindle pair'}}],[{table:'warbands',op:'update',data:{gold:110}}])).error?.message).toMatch(/goes to the stash/)
  const b=await viaBuilder(second,captor,{kind:'ransom',gold:10,holderId:other});expect(b.built).toMatchObject({holderId:other,original:false});const idB=check(b.r)
  expect(check(await victim.from('captive_proposals').select('message').eq('id',idB).single()).message).toMatch(/Ransomed for 10 gc: .* returns to Youngblood Pim \(its original handler is gone\)\. Disposable Reiklanders gold 100 → 90\. Disposable Moulder gold 100 → 110/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:idB,p_action:'accept'}))
  expect(await dogQty(other)).toEqual([{quantity:1,notes:'Brindle pair'}])
  // Reverse the ransom, then sell the dog: gold only, the animal is gone; a bogus original die is refused.
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:second.id,p_reason:'They could not afford the ransom'}))
  expect(await dogQty(other)).toEqual([])
  expect((await propose(captor,second.id,{kind:'sell',d6:2,originalD6:0},[],[{table:'warbands',op:'update',data:{gold:110}}])).error?.message).toMatch(/original D6 must be 1 to 6/)
  const s=await viaBuilder(second,captor,{kind:'sell',d6:2,originalD6:5});const idS=check(s.r);expect(s.built.message).toMatch(/app rolled 5; player changed this to 2/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:idS,p_action:'accept'}))
  expect(check(await admin.from('warbands').select('gold').eq('id',cw).single()).gold).toBe(110)
  expect(check(await admin.from('items').select('id').eq('warband_id',cw).eq('item_rules_id','wardogs'))).toHaveLength(0)
  expect((await cases()).map((c:any)=>c.state)).toEqual(['resolved','resolved'])
  // Stash return when no Hero is chosen and the handler is gone.
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:second.id,p_reason:'Sold in error'}))
  const st=await viaBuilder((await cases())[1],victim,{kind:'release'});expect(st.built.holderId).toBeNull();const idT=check(st.r)
  check(await captor.rpc('respond_captive_proposal',{p_proposal_id:idT,p_action:'accept'}))
  expect(await dogQty(null)).toEqual([{quantity:1,notes:'Brindle pair'}])
 })

 it('ties each animal number to the item row that actually holds it when a Hero has several rows of the same companion',async()=>{
  // Gert also has a second Wardog row (one more dog, differently annotated): numbers run 1-2 on the first row, 3 on the second.
  const second=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:handler,item_rules_id:'wardogs',quantity:1,notes:'Old grey'}).select('id').single()).id
  const ev3=check(await admin.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:03:00Z',kind:'attack',summary:'dog 3',payload:{attacker_warband_id:cw,attacker_id:moulder,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:`animal:${handler}:wardogs:3`,target_kind:'hero',target_name:'Wardog 3',target_size:1,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:3,capture_reason:'subjugator'}}).select('id').single()).id
  const fileRows=(captured:unknown[],patches:unknown[])=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],injuries:[],applied:{heroes:[],groups:[],item_patches:patches,captured_companions:captured}}})
  // Number 3 claimed against the first row, or number 1 against the second, is refused.
  expect((await fileRows([{...cap(3,ev3)}],[{id:dogs,quantity:1}])).error?.message).toMatch(/not one of the animals on item row .* \(that row holds numbers 1 to 2\)/)
  expect((await fileRows([{...cap(1,events[0]),sourceItemId:second}],[{id:second,quantity:0}])).error?.message).toMatch(/that row holds numbers 3 to 3/)
  check(await fileRows([cap(1,events[0]),{...cap(3,ev3),sourceItemId:second}],[{id:dogs,quantity:1},{id:second,quantity:0}]))
  const opened=await cases()
  expect(opened.map((c:any)=>[c.model_index,c.hero_id,c.model_snapshot.item.notes])).toEqual([[1,dogs,'Brindle pair'],[3,second,'Old grey']])
 })
})
