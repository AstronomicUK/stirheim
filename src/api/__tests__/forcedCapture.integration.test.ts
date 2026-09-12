import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:5,WS:3,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:5}
const NG='33333333-3333-4333-8333-aaaaaaaaaaaa'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Forced henchman captures (Subjugator of Mankind, #229)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,captor:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,group:string,swords:string,shields:string,moulder:string,events:string[]=[]
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`forced-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Forced QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,captor,gm]=clients
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
 const file=(captured:unknown[],over:{size?:number;swordQty?:number;shieldQty?:number;rolls?:number[];dead?:number}={})=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
  injuries:[{subjectType:'group',subjectId:group,subjectName:'Warriors',rolls:over.rolls??[4],dead:over.dead??0,captured}],
  applied:{heroes:[],groups:[{id:group,patch:{size:over.size??1}}],item_patches:[{id:swords,quantity:over.swordQty??1},{id:shields,quantity:over.shieldQty??1}]}}})
 const fileCaptor=()=>captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',applied:{}}})
 const cases=async(client=victim)=>check(await client.from('captive_cases').select('*,proposals:captive_proposals(id,state,message)').eq('match_id',match).order('model_index'))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Forced capture',p_owner_changes,p_captor_changes,p_advances:[],p_expected:await expected()})
 const groupRow=async()=>check(await admin.from('henchman_groups').select('size,xp').eq('id',group).single())
 const qty=async(id:string)=>check(await admin.from('items').select('quantity').eq('id',id).single()).quantity

 it('rejects a report whose captured models cannot be verified against the battle log and its own losses',async()=>{
  expect((await file([cap(1,events[0]),cap(1,events[1])])).error?.message).toMatch(/casualty 2 of the group, not 1/)
  expect((await file([cap(1,events[0]),cap(2,events[0])])).error?.message).toMatch(/casualty 1 of the group, not 2|used twice/)
  expect((await file([cap(3,events[2])],{size:2})).error?.message).toMatch(/no unreverted Subjugator capture event/)
  expect((await file([cap(1,events[0],{kit:[kit()[0]]}),cap(2,events[1],{kit:[kit()[0]]})])).error?.message).toMatch(/removed 2 of shield .* account for 0; with no model dead/)
  expect((await file([cap(1,events[0]),cap(2,events[1])],{size:2})).error?.message).toMatch(/should be patched to 1 models/)
  expect((await file([cap(1,events[0],{kit:kit(2)}),cap(2,events[1],{kit:kit(2)})])).error?.message).toMatch(/removed only 2 of sword/)
  expect((await file([cap(1,events[0],{kit:[{sourceItemId:swords,itemId:'axe',quantity:1}]}),cap(2,events[1])])).error?.message).toMatch(/names axe but the source row is sword/)
  expect((await file([cap(1,events[0],{captorWarbandId:vw}),cap(2,events[1])])).error?.message).toMatch(/no unreverted Subjugator capture event/)
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',events[1]))
  expect((await file([cap(1,events[0]),cap(2,events[1])])).error?.message).toMatch(/no unreverted Subjugator capture event/)
  expect(await cases()).toHaveLength(0)
  expect((await groupRow()).size).toBe(3)
 })
 it('opens one durable case per captured model with the exact kit share, then releases one into the unchanged group and ransoms the other into a new group after the group advanced',async()=>{
  check(await file([cap(1,events[0]),cap(2,events[1])]));check(await fileCaptor())
  const opened=await cases();expect(opened.map((c:any)=>[c.subject_kind,c.source,c.model_index,c.captor_warband_id,c.state])).toEqual([['henchman','forced_capture',1,cw,'open'],['henchman','forced_capture',2,cw,'open']])
  expect(opened[0].model_snapshot).toMatchObject({reason:'subjugator',event_id:events[0],captor_name:'Master Moulder Skrit',group:{size:3,xp:2,unit_type_rules_id:'mercenaries_reikland_warriors'}})
  expect(opened[0].model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:1,source_item_id:swords}),expect.objectContaining({item_rules_id:'shield',quantity:1,notes:'Painted red'})])
  expect(check(await captor.from('app_notifications').select('title')).filter((n:any)=>/holds a captured Warriors henchman/.test(n.title))).toHaveLength(2)
  expect((await groupRow()).size).toBe(1);expect(await qty(swords)).toBe(1)
  // The victim asks for a free release; the captor accepts. The model rejoins Warriors with his sword and shield.
  const [first,second]=opened
  const rejoin=[{table:'henchman_groups',op:'update',id:group,data:{size:2}},{table:'items',op:'update',id:swords,data:{quantity:2}},{table:'items',op:'update',id:shields,data:{quantity:2}}]
  expect((await propose(victim,first.id,{kind:'release'},[rejoin[0],rejoin[1]],[])).error?.message).toMatch(/brings back exactly his own kit \(shield \[Painted red\] ×1, sword ×1\)/)
  expect((await propose(victim,first.id,{kind:'release'},[...rejoin,{table:'items',op:'update',id:swords,data:{quantity:3}}],[])).error?.message).toMatch(/same row twice/)
  expect((await propose(victim,first.id,{kind:'exchange',otherHeroId:moulder},rejoin,[])).error?.message).toMatch(/released, ransomed or sold/)
  expect((await propose(victim,first.id,{kind:'release'},rejoin,[{table:'warbands',op:'update',data:{gold:120}}])).error?.message).toMatch(/gold changes do not match/)
  const id=check(await propose(victim,first.id,{kind:'release'},rejoin,[]))
  expect(check(await captor.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/Released: Warriors \(model 1\) \(Disposable Reiklanders\) returns to Warriors\. kit restored: shield \[Painted red\], sword/)
  check(await captor.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await groupRow()).toEqual({size:2,xp:2});expect(await qty(swords)).toBe(2);expect(await qty(shields)).toBe(2)
  // Meanwhile the Warriors gained experience: the second model cannot rejoin them and forms his own group.
  check(await admin.from('henchman_groups').update({xp:5}).eq('id',group))
  expect((await propose(captor,second.id,{kind:'ransom',gold:20},[{table:'warbands',op:'update',data:{gold:80}},{table:'henchman_groups',op:'update',id:group,data:{size:3}},{table:'items',op:'update',id:swords,data:{quantity:3}},{table:'items',op:'update',id:shields,data:{quantity:3}}],[{table:'warbands',op:'update',data:{gold:120}}])).error?.message).toMatch(/has changed since the capture/)
  const fresh=[{table:'warbands',op:'update',data:{gold:80}},{table:'henchman_groups',op:'insert',id:NG,data:{name:'Warriors (returned)',unit_type_rules_id:'mercenaries_reikland_warriors',size:1,stats,xp:2,level_ups:0,stat_increases:{},campaign_state:{},model_names:[]}},{table:'items',op:'insert',data:{holder_type:'group',holder_id:NG,item_rules_id:'sword',quantity:1}},{table:'items',op:'insert',data:{holder_type:'group',holder_id:NG,item_rules_id:'shield',quantity:1,notes:'Painted red'}}]
  expect((await propose(captor,second.id,{kind:'ransom',gold:20,groupId:NG},[fresh[0],{...fresh[1],data:{...(fresh[1] as any).data,xp:5}},fresh[2],fresh[3]],[{table:'warbands',op:'update',data:{gold:120}}])).error?.message).toMatch(/exactly the captured model's snapshot/)
  const id2=check(await propose(captor,second.id,{kind:'ransom',gold:20,groupId:NG},fresh,[{table:'warbands',op:'update',data:{gold:120}}]))
  expect(check(await victim.from('captive_proposals').select('message').eq('id',id2).single()).message).toMatch(/Ransomed for 20 gc: Warriors \(model 2\) .* returns as a new group carrying his own profile\. Disposable Reiklanders gold 100 → 80\. Disposable Moulder gold 100 → 120/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id2,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('size,xp').eq('id',NG).single())).toEqual({size:1,xp:2})
  expect(check(await admin.from('warbands').select('gold').eq('id',vw).single()).gold).toBe(80)
  // Both reports are pinned; reversal of the release restores the roster and reopens the case.
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw})).error?.message).toMatch(/depends on this report|equipment has changed/)
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:first.id,p_reason:'The release was recorded in error'})).error?.message).toMatch(/has changed since this outcome was recorded/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:second.id,p_reason:'The ransom was recorded in error'}))
  expect(check(await admin.from('henchman_groups').select('id').eq('id',NG))).toHaveLength(0)
  expect(check(await admin.from('warbands').select('gold').eq('id',vw).single()).gold).toBe(100)
  expect((await cases()).map((c:any)=>c.state)).toEqual(['resolved','open'])
 })
 it('lets the captor sell the model for 5 × D6 and keep exactly his kit, and refuses to resolve a case whose event was later reverted',async()=>{
  check(await file([cap(1,events[0]),cap(2,events[1])]));check(await fileCaptor())
  const [first,second]=await cases()
  expect((await propose(captor,first.id,{kind:'sell',d6:3},[],[{table:'warbands',op:'update',data:{gold:115}}])).error?.message).toMatch(/gain exactly the captured model's kit/)
  expect((await propose(captor,first.id,{kind:'sell',d6:3},[{table:'henchman_groups',op:'update',id:group,data:{size:2}}],[{table:'warbands',op:'update',data:{gold:115}}])).error?.message).toMatch(/does not return/)
  const id=check(await propose(captor,first.id,{kind:'sell',d6:3},[],[{table:'warbands',op:'update',data:{gold:115}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'shield',quantity:1,notes:'Painted red'}}]))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('warbands').select('gold').eq('id',cw).single()).gold).toBe(115)
  expect(check(await admin.from('items').select('item_rules_id').eq('warband_id',cw).eq('holder_type','stash')).map((i:any)=>i.item_rules_id).sort()).toEqual(['shield','sword'])
  check(await admin.from('battle_events').update({reverted_at:new Date().toISOString()}).eq('id',events[1]))
  expect((await propose(captor,second.id,{kind:'sell',d6:1},[],[{table:'warbands',op:'update',data:{gold:120}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'shield',quantity:1,notes:'Painted red'}}])).error?.message).toMatch(/reverted in the battle log/)
 })

 it('keeps kit multiplicity and annotations: two swords per model and a distinct heirloom row survive release, refuse mismatched notes, and block return into a re-armed group',async()=>{
  // A pair with two plain swords each and one heirloom sword each (a separate annotated row).
  const pair=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Pair',unit_type_rules_id:'mercenaries_reikland_marksmen',size:2,stats,xp:0}).select('id').single()).id
  const plain=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:pair,item_rules_id:'sword',quantity:4}).select('id').single()).id
  const heirloom=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:pair,item_rules_id:'sword',quantity:2,notes:'Family heirloom'}).select('id').single()).id
  const ev=check(await admin.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:cw,at:'2026-09-12T18:05:00Z',kind:'attack',summary:'capture pair',payload:{attacker_warband_id:cw,attacker_id:moulder,attacker_kind:'hero',attacker_name:'Master Moulder Skrit',target_warband_id:vw,target_id:pair,target_kind:'group',target_name:'Pair',target_size:2,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:3,capture_reason:'subjugator'}}).select('id').single()).id
  const filePair=(kitRows:unknown[])=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
   injuries:[{subjectType:'group',subjectId:pair,subjectName:'Pair',rolls:[],dead:0,captured:[{modelIndex:1,eventId:ev,captorWarbandId:cw,reason:'subjugator',kit:kitRows}]}],
   applied:{heroes:[],groups:[{id:pair,patch:{size:1}}],item_patches:[{id:plain,quantity:2},{id:heirloom,quantity:1}]}}})
  expect((await filePair([{sourceItemId:plain,itemId:'sword',quantity:2},{sourceItemId:heirloom,itemId:'sword',quantity:1,notes:'Stolen'}])).error?.message).toMatch(/notes "Stolen" do not match the source row \("Family heirloom"\)/)
  check(await filePair([{sourceItemId:plain,itemId:'sword',quantity:2},{sourceItemId:heirloom,itemId:'sword',quantity:1}]));check(await fileCaptor())
  const [c]=await cases()
  expect(c.model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:2,notes:''}),expect.objectContaining({item_rules_id:'sword',quantity:1,notes:'Family heirloom'})])
  // Release: both rows come back at the right multiplicity; a merged plain-only claim is refused.
  expect((await propose(victim,c.id,{kind:'release'},[{table:'henchman_groups',op:'update',id:pair,data:{size:2}},{table:'items',op:'update',id:plain,data:{quantity:5}}],[])).error?.message).toMatch(/exactly his own kit \(sword ×2, sword \[Family heirloom\] ×1\)/)
  const id=check(await propose(victim,c.id,{kind:'release'},[{table:'henchman_groups',op:'update',id:pair,data:{size:2}},{table:'items',op:'update',id:plain,data:{quantity:4}},{table:'items',op:'update',id:heirloom,data:{quantity:2}}],[]))
  check(await captor.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await qty(plain)).toBe(4);expect(await qty(heirloom)).toBe(2)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Recorded before the sale was agreed'}))
  // The survivor re-arms with an axe: the returning model no longer matches and must form his own group.
  check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:pair,item_rules_id:'axe',quantity:1}))
  expect((await propose(victim,c.id,{kind:'release'},[{table:'henchman_groups',op:'update',id:pair,data:{size:2}},{table:'items',op:'update',id:plain,data:{quantity:4}},{table:'items',op:'update',id:heirloom,data:{quantity:2}}],[])).error?.message).toMatch(/has changed since the capture/)
  // Sale keeps both rows distinct in the captor's stash.
  const id2=check(await propose(captor,c.id,{kind:'sell',d6:2},[],[{table:'warbands',op:'update',data:{gold:110}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:2}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1,notes:'Family heirloom'}}]))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id2,p_action:'accept'}))
  expect(check(await admin.from('items').select('quantity,notes').eq('warband_id',cw).eq('holder_type','stash').order('quantity'))).toEqual([{quantity:1,notes:'Family heirloom'},{quantity:2,notes:''}])
 })
})
