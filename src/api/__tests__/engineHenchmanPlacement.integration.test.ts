import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildEnginePlacementProposal } from '../engineCustody'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Engine of Chaos custody for Man-catcher henchmen (#229 / #95, migration 104)',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,dwarf:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,group:string,swords:string,shields:string,gaoler:string,stock:string,engine:string,event:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`engine-henchman-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Gaoler QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,dwarf,gm]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Dwarfs',type_rules_id:'black_dwarfs',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Gaolers',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'in_progress'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  group=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats,xp:2}).select('id').single()).id
  swords=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:group,item_rules_id:'sword',quantity:3}).select('id').single()).id
  shields=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:group,item_rules_id:'shield',quantity:3,notes:'Painted red'}).select('id').single()).id
  gaoler=check(await admin.from('heroes').insert({warband_id:cw,name:'Gaoler Zharrek',unit_type_rules_id:'black_dwarfs_gaoler',stats,xp:8,status:'active'}).select('id').single()).id
  check(await admin.from('items').insert({warband_id:cw,holder_type:'hero',holder_id:gaoler,item_rules_id:'man_catcher',quantity:1}))
  stock=check(await admin.from('items').insert({warband_id:cw,holder_type:'stash',item_rules_id:'engine_of_chaos',quantity:1}).select('id').single()).id
  engine=check(await admin.from('engine_of_chaos_units').select('id').eq('inventory_item_id',stock).single()).id
  // The Gaoler's Man-catcher takes a Warrior out of action (103 validates the weapon, the Engine and the target).
  event=check(await dwarf.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:cw,kind:'attack',summary:'Man-catcher capture',payload:{attacker_warband_id:cw,attacker_id:gaoler,attacker_kind:'hero',attacker_name:'Gaoler Zharrek',target_warband_id:vw,target_id:group,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:1,out_of_action:true,kill:true,outcome:'Out of action',turn:2,capture_reason:'man_catcher',out_of_action_weapon_id:'man_catcher'}}).select('id').single()).id
  check(await admin.from('matches').update({state:'awaiting_reports'}).eq('id',match))
  check(await reik.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
   injuries:[{subjectType:'group',subjectId:group,subjectName:'Warriors',rolls:[],dead:0,equipmentLost:[{sourceItemId:swords,quantity:1},{sourceItemId:shields,quantity:1}],
    captured:[{modelIndex:1,eventId:event,captorWarbandId:cw,reason:'man_catcher',kit:[{sourceItemId:swords,itemId:'sword',quantity:1},{sourceItemId:shields,itemId:'shield',quantity:1,notes:'Painted red'}]}]}],
   applied:{heroes:[],groups:[{id:group,patch:{size:2}}],item_patches:[{id:swords,quantity:2},{id:shields,quantity:2}]}}}))
 })
 afterEach(async()=>{
  // A standing outcome pins its reports: the GM releases it first; cases and custody rows go before
  // the match so the report guards pass; warbands go last (their cascade would otherwise touch cases
  // mid-delete). Every step is checked so a leak fails loudly.
  for(const c of check(await admin.from('captive_cases').select('id,state').eq('match_id',match)).filter((c:any)=>['held','resolved'].includes(c.state)))
   check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Test teardown release',p_release_only:true}))
  check(await admin.from('captive_cases').delete().eq('match_id',match))
  check(await admin.from('engine_prisoners').delete().in('holder_warband_id',[vw,cw]))
  check(await admin.from('battle_events').delete().eq('match_id',match))
  check(await admin.from('matches').delete().eq('id',match))
  if(campaign)check(await admin.from('campaigns').delete().eq('id',campaign))
  if(vw)check(await admin.from('warbands').delete().in('id',[vw,cw]))
  check(await admin.from('app_notifications').delete().in('user_id',users))
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
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Lock him up',p_owner_changes,p_captor_changes,p_advances:[],p_expected:await expected()})
 const prisoners=async()=>check(await admin.from('engine_prisoners').select('*').eq('engine_id',engine).order('placed_at'))
 const stash=async()=>check(await admin.from('items').select('item_rules_id,quantity,notes').eq('warband_id',cw).eq('holder_type','stash').neq('item_rules_id','engine_of_chaos').order('item_rules_id'))

 it('locks the Man-catcher captive in the Engine with exactly his snapshot kit, holds the case, and reverses cleanly',async()=>{
  const [c]=await cases();expect(c).toMatchObject({subject_kind:'henchman',source:'forced_capture',state:'open',captor_warband_id:cw,hero_name:'Warriors (model 1)'})
  expect(c.model_snapshot.reason).toBe('man_catcher')
  const [owner,captor]=[await detail(vw),await detail(cw)]
  const built=buildEnginePlacementProposal({item:c as CaptiveCase,owner,captor,engineId:engine})
  expect(built.large).toBe(false)
  expect(built.kit.map(k=>[k.itemId,k.quantity,k.notes??''])).toEqual([['sword',1,''],['shield',1,'Painted red']])
  const ownerChanges=diffRoster(owner,built.nextOwner),captorChanges=diffRoster(captor,built.nextCaptor)
  expect(ownerChanges).toEqual([])
  expect(captorChanges.map(x=>[x.table,x.op,x.data?.item_rules_id]).sort()).toEqual([['items','insert','shield'],['items','insert','sword']])
  // The victim's roster is already settled; the stash must gain exactly the snapshot kit.
  expect((await propose(reik,c.id,built.choice,[{table:'henchman_groups',op:'update',id:group,data:{size:3}}],captorChanges)).error?.message).toMatch(/already off his warband's roster/)
  expect((await propose(reik,c.id,built.choice,[],captorChanges.slice(0,1))).error?.message).toMatch(/must gain exactly the prisoner's equipment/)
  expect((await propose(reik,c.id,built.choice,[],[...captorChanges,{table:'warbands',op:'update',data:{gold:120}}])).error?.message).toMatch(/only confiscates the prisoner/)
  expect((await propose(reik,c.id,{kind:'engine_placement',engineId:crypto.randomUUID()},[],captorChanges)).error?.message).toMatch(/not in the captor's inventory/)
  const id=check(await propose(dwarf,c.id,built.choice,[],captorChanges))
  expect(check(await reik.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/^Locked in .+\. Warriors \(model 1\) \(Disposable Reiklanders\) stays captured and is imprisoned in the Engine of Chaos of Disposable Dwarfs, taking one place \(1 of 6 used\)\. His equipment is lost to Disposable Dwarfs: .*Shield.*Sword\. He left Warriors when the report was applied\. Ransom, exchange or sale need the placement reversed first\.$/)
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect((await cases())[0]).toMatchObject({state:'held',resolution_kind:'engine_placement'})
  expect(await stash()).toEqual([{item_rules_id:'shield',quantity:1,notes:'Painted red'},{item_rules_id:'sword',quantity:1,notes:''}])
  expect(check(await admin.from('henchman_groups').select('size').eq('id',group).single()).size).toBe(2)
  const [p]=await prisoners();expect(p).toMatchObject({state:'held',places:1,large:false,case_id:c.id,victim_warband_id:vw,name:'Warriors (model 1)'})
  expect(p.snapshot).toMatchObject({subject_kind:'henchman',model_index:1,henchman:{reason:'man_catcher',event_id:event},items:[{item_rules_id:'sword',quantity:1},{item_rules_id:'shield',quantity:1,notes:'Painted red'}]})
  // Held: no release/ransom/sale, report pinned, capture event pinned, Engine not removable.
  expect((await propose(reik,c.id,{kind:'release',groupId:group},[{table:'henchman_groups',op:'update',id:group,data:{size:3}}],[])).error?.message).toMatch(/not open for proposals/)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw})).error?.message).toMatch(/depends on this report/)
  expect((await gm.rpc('revert_battle_event',{p_event_id:event,p_note:'Undo the capture'})).error?.message).toMatch(/Withdraw the affected post-battle report/)
  const unit=check(await admin.from('engine_of_chaos_units').select('updated_at').eq('id',engine).single())
  expect((await dwarf.rpc('remove_engine_copy',{p_engine_id:engine,p_reason:'Sold the engine',p_expected_updated_at:unit.updated_at})).error?.message).toMatch(/unresolved custody/)
  // Reversal: stash gain undone, case open again, place freed; the ordinary release then works.
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Placement recorded against the wrong Engine'}))
  expect((await cases())[0]).toMatchObject({state:'open',resolution_kind:null})
  expect(await stash()).toEqual([])
  expect((await prisoners())[0].state).toBe('reversed')
  expect(check(await admin.from('engine_of_chaos_units').select('id,state').eq('inventory_item_id',stock))).toEqual([{id:engine,state:'present'}])
 })

 it('charges two places for a natively Large group snapshot and refuses when the Engine is full',async()=>{
  const [c]=await cases()
  check(await admin.from('captive_cases').update({model_snapshot:{...c.model_snapshot,group:{...c.model_snapshot.group,unit_type_rules_id:'ostlander_ogre'}}}).eq('id',c.id))
  const [c2]=await cases()
  const report=check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',vw).single()).id
  check(await admin.from('engine_prisoners').insert(Array.from({length:5},(_,i)=>({engine_id:engine,holder_warband_id:cw,exploration_report_id:report,name:`Filler ${i}`,large:false,places:1,snapshot:{anonymous:true}}))))
  const [owner,captor]=[await detail(vw),await detail(cw)]
  const built=buildEnginePlacementProposal({item:c2 as CaptiveCase,owner,captor,engineId:engine})
  expect(built.large).toBe(true)
  const captorChanges=diffRoster(captor,built.nextCaptor)
  expect((await propose(dwarf,c2.id,built.choice,[],captorChanges)).error?.message).toMatch(/is full: 5 of six places are taken and Warriors \(model 1\) needs 2/)
  check(await admin.from('engine_prisoners').delete().eq('name','Filler 0'))
  const id=check(await propose(dwarf,c2.id,built.choice,[],captorChanges))
  expect(check(await reik.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/taking two places \(Large\) \(6 of 6 used\)/)
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect((await prisoners()).find((p:any)=>p.case_id===c2.id)).toMatchObject({large:true,places:2,state:'held'})
 })
})
