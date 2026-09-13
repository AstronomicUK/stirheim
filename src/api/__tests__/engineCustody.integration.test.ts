import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildEnginePlacementProposal } from '../engineCustody'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Engine of Chaos custody (#229 / #95, migration 102)',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,dwarf:SupabaseClient,gm:SupabaseClient,stranger:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,hero:string,sword:string,dagger:string,stock:string,engine:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`engine-custody-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Custody QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,dwarf,gm,stranger]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable victims',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Dwarfs',type_rules_id:'black_dwarfs',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Custody',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  hero=check(await admin.from('heroes').insert({warband_id:vw,name:'Taken Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:12,status:'active'}).select('id').single()).id
  sword=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1}).select('id').single()).id
  dagger=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'dagger',quantity:2,notes:'Notched'}).select('id').single()).id
  stock=check(await admin.from('items').insert({warband_id:cw,holder_type:'stash',item_rules_id:'engine_of_chaos',quantity:1}).select('id').single()).id
  engine=check(await admin.from('engine_of_chaos_units').select('id').eq('inventory_item_id',stock).single()).id
 })
 afterEach(async()=>{
  // A standing outcome pins its reports: the GM releases it first; cases and custody rows go before
  // the match so the report guards pass; warbands go last (their cascade would otherwise touch cases
  // mid-delete). Every step is checked so a leak fails loudly.
  for(const c of check(await admin.from('captive_cases').select('id,state').eq('match_id',match)).filter((c:any)=>['held','resolved'].includes(c.state)))
   check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Test teardown release',p_release_only:true}))
  check(await admin.from('captive_cases').delete().eq('match_id',match))
  check(await admin.from('engine_prisoners').delete().in('holder_warband_id',[vw,cw]))
  check(await admin.from('matches').delete().eq('id',match))
  if(campaign)check(await admin.from('campaigns').delete().eq('id',campaign))
  if(vw)check(await admin.from('warbands').delete().in('id',[vw,cw]))
  check(await admin.from('app_notifications').delete().in('user_id',users))
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const fileVictim=()=>reik.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
  injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Taken Captain',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}],
  applied:{heroes:[{id:hero,patch:{status:'captured',flags:{captured:true}}}]}}})
 const fileDwarf=(exploration:Record<string,unknown>|null=null)=>dwarf.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',ooa:[],injuries:[],...(exploration?{exploration}:{}),applied:{heroes:[],groups:[]}}})
 const cases=async(client=gm)=>check(await client.from('captive_cases').select('*,proposals:captive_proposals(id,state,message,reason)').eq('match_id',match))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id).order('created_at')),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id).order('created_at'));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Lock him up',p_owner_changes,p_captor_changes,p_advances:[],p_expected:await expected()})
 const prisoners=async(client:SupabaseClient=admin)=>check(await client.from('engine_prisoners').select('*').eq('engine_id',engine).order('placed_at'))
 const heroItems=async()=>check(await admin.from('items').select('id,item_rules_id,quantity,notes').eq('holder_id',hero).order('created_at'))
 const stash=async()=>check(await admin.from('items').select('item_rules_id,quantity,notes').eq('warband_id',cw).eq('holder_type','stash').neq('item_rules_id','engine_of_chaos').order('item_rules_id'))
 async function builtPlacement(caseRow:CaptiveCase,engineId=engine){
  const [owner,captor]=[await detail(vw),await detail(cw)]
  const built=buildEnginePlacementProposal({item:caseRow,owner,captor,engineId})
  return {built,ownerChanges:diffRoster(owner,built.nextOwner),captorChanges:diffRoster(captor,built.nextCaptor)}
 }

 it('locks a captured Hero in the Engine by consent: kit confiscated, case held (not resolved), outcomes and edits blocked, then reversal restores the kit and keeps the Engine identity',async()=>{
  check(await fileVictim())
  const [c]=await cases();expect(c).toMatchObject({state:'open',captor_warband_id:cw,subject_kind:'hero'})
  const {built,ownerChanges,captorChanges}=await builtPlacement(c as CaptiveCase)
  expect(built.large).toBe(false)
  expect(ownerChanges.map(x=>[x.table,x.op]).sort()).toEqual([['items','delete'],['items','delete']])
  expect(captorChanges.map(x=>[x.table,x.op]).sort()).toEqual([['items','insert'],['items','insert']])
  // Refusals: anything but the confiscation, an incomplete confiscation, a stash gain that is not the kit, an unknown Engine.
  expect((await propose(reik,c.id,built.choice,[...ownerChanges,{table:'warbands',op:'update',data:{gold:90}}],captorChanges)).error?.message).toMatch(/only confiscates the prisoner/)
  expect((await propose(reik,c.id,built.choice,ownerChanges.slice(0,1),captorChanges)).error?.message).toMatch(/All of the prisoner's equipment is lost/)
  expect((await propose(reik,c.id,built.choice,ownerChanges,captorChanges.slice(0,1))).error?.message).toMatch(/must gain exactly the prisoner's equipment/)
  expect((await propose(reik,c.id,built.choice,ownerChanges,[...captorChanges,{table:'items',op:'insert',data:{holder_type:'stash',holder_id:null,item_rules_id:'shield',quantity:1,notes:''}}])).error?.message).toMatch(/may only gain what the prisoner carried/)
  expect((await propose(reik,c.id,{...built.choice,engineId:crypto.randomUUID()},ownerChanges,captorChanges)).error?.message).toMatch(/not in the captor's inventory/)
  expect((await propose(reik,c.id,built.choice,ownerChanges,captorChanges.map(x=>x.op==='insert'&&x.data?.item_rules_id==='dagger'?{...x,data:{...x.data,notes:''}}:x))).error?.message).toMatch(/may only gain what the prisoner carried/)
  const id=check(await propose(reik,c.id,built.choice,ownerChanges,captorChanges))
  const pr=check(await dwarf.from('captive_proposals').select('message,state').eq('id',id).single())
  expect(pr.state).toBe('proposed')
  expect(pr.message).toMatch(/^Locked in .+\. Taken Captain \(Disposable victims\) stays captured and is imprisoned in the Engine of Chaos of Disposable Dwarfs, taking one place \(1 of 6 used\)\. His equipment is lost to Disposable Dwarfs: .*Dagger.*×2.*Sword\. Ransom, exchange or sale need the placement reversed first\.$/)
  expect(await prisoners()).toHaveLength(0)
  check(await dwarf.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  // Custody, not an outcome.
  const held=(await cases())[0];expect(held).toMatchObject({state:'held',resolution_kind:'engine_placement'})
  expect(check(await admin.from('heroes').select('status').eq('id',hero).single()).status).toBe('captured')
  expect(await heroItems()).toEqual([])
  expect(await stash()).toEqual([{item_rules_id:'dagger',quantity:2,notes:'Notched'},{item_rules_id:'sword',quantity:1,notes:''}])
  const [p]=await prisoners();expect(p).toMatchObject({state:'held',places:1,large:false,case_id:c.id,victim_warband_id:vw,holder_warband_id:cw,name:'Taken Captain',proposal_id:id,exploration_report_id:null})
  expect(p.snapshot.items.map((i:any)=>[i.id,i.quantity]).sort()).toEqual([[dagger,2],[sword,1]].sort())
  expect(p.snapshot.hero.id).toBe(hero)
  expect(p.confiscated.map((x:any)=>x.data.item_rules_id).sort()).toEqual(['dagger','sword'])
  // Both players see the prisoner; a stranger does not.
  expect(await prisoners(reik)).toHaveLength(1);expect(await prisoners(dwarf)).toHaveLength(1);expect(await prisoners(stranger)).toHaveLength(0)
  expect((await reik.from('engine_prisoners').update({state:'freed'}).eq('id',p.id)).data).toBeNull()
  expect((await prisoners())[0].state).toBe('held')
  // While held: no ordinary outcome, no legacy status edit, no report withdrawal, no removal of the occupied Engine.
  expect((await propose(reik,c.id,{kind:'ransom',gold:0},[{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{}}}],[])).error?.message).toMatch(/not open for proposals/)
  expect((await reik.from('heroes').update({status:'active'}).eq('id',hero)).error?.message).toMatch(/locked in an Engine of Chaos/)
  // Withdrawal restores the Hero's status before it reaches the report guard, so the held-Hero guard answers first.
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw})).error?.message).toMatch(/locked in an Engine of Chaos\. Reverse the imprisonment/)
  const unit=check(await admin.from('engine_of_chaos_units').select('id,updated_at,history').eq('id',engine).single())
  expect(unit.history.some((h:any)=>h.event==='prisoner_placed'&&h.name==='Taken Captain')).toBe(true)
  expect((await dwarf.rpc('remove_engine_copy',{p_engine_id:engine,p_reason:'Sold the engine',p_expected_updated_at:unit.updated_at})).error?.message).toMatch(/unresolved custody/)
  expect((await dwarf.from('items').delete().eq('id',stock)).error?.message).toMatch(/unresolved custody/)
  // Reversal by the GM: kit back on the Hero (same rows), case open, place freed, Engine identity intact.
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Placement recorded against the wrong Engine'}))
  expect((await cases())[0]).toMatchObject({state:'open',resolution_kind:null})
  expect((await heroItems()).map((i:any)=>[i.id,i.quantity])).toEqual([[sword,1],[dagger,2]])
  expect(await stash()).toEqual([])
  expect((await prisoners())[0]).toMatchObject({state:'reversed',release_reason:'Placement recorded against the wrong Engine'})
  expect(check(await admin.from('engine_of_chaos_units').select('id,state,inventory_item_id').eq('inventory_item_id',stock))).toEqual([{id:engine,state:'present',inventory_item_id:stock}])
  const fresh=check(await admin.from('engine_of_chaos_units').select('updated_at').eq('id',engine).single())
  check(await dwarf.rpc('remove_engine_copy',{p_engine_id:engine,p_reason:'Sold the engine after all',p_expected_updated_at:fresh.updated_at}))
 })

 it('confiscates a hired sword’s kit without turning him into an ordinary Hero',async()=>{
  check(await admin.from('heroes').update({is_hired_sword:true,hired_sword_rules_id:'ogre_bodyguard',unit_type_rules_id:null,is_large:false}).eq('id',hero))
  check(await fileVictim())
  const [c]=await cases()
  const {built,ownerChanges,captorChanges}=await builtPlacement(c as CaptiveCase)
  expect(built.large).toBe(true)
  expect(built.nextOwner.heroes).toHaveLength(0)
  expect(built.nextOwner.hiredSwords.find(h=>h.id===hero)?.equipment).toEqual([])
  expect(ownerChanges.map(x=>[x.table,x.op]).sort()).toEqual([['items','delete'],['items','delete']])
  const proposal=check(await propose(reik,c.id,built.choice,ownerChanges,captorChanges))
  check(await dwarf.rpc('respond_captive_proposal',{p_proposal_id:proposal,p_action:'accept'}))
  expect((await prisoners())[0]).toMatchObject({large:true,places:2,state:'held'})
  expect(check(await admin.from('heroes').select('status,is_hired_sword').eq('id',hero).single())).toEqual({status:'captured',is_hired_sword:true})
 })

 it('charges two places for a natively Large captive and refuses a full Engine under the inventory lock',async()=>{
  check(await admin.from('heroes').update({unit_type_rules_id:'ostlander_ogre',is_large:false}).eq('id',hero))
  check(await fileVictim())
  const [c]=await cases()
  const report=check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',vw).single()).id
  // Five anonymous places already taken: the Ogre's two do not fit.
  const filler=check(await admin.from('engine_prisoners').insert(Array.from({length:5},(_,i)=>({engine_id:engine,holder_warband_id:cw,exploration_report_id:report,name:`Filler ${i}`,large:false,places:1,snapshot:{anonymous:true}}))).select('id'))
  const {built,ownerChanges,captorChanges}=await builtPlacement(c as CaptiveCase)
  expect(built.large).toBe(true)
  expect((await propose(reik,c.id,built.choice,ownerChanges,captorChanges)).error?.message).toMatch(/is full: 5 of six places are taken and Taken Captain needs 2/)
  check(await admin.from('engine_prisoners').delete().eq('id',filler[0].id))
  const id=check(await propose(reik,c.id,built.choice,ownerChanges,captorChanges))
  expect(check(await dwarf.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/taking two places \(Large\) \(6 of 6 used\)/)
  // The place count is re-checked under lock when the proposal is accepted.
  check(await admin.from('engine_prisoners').insert({engine_id:engine,holder_warband_id:cw,exploration_report_id:report,name:'Late arrival',large:false,places:1,snapshot:{anonymous:true}}))
  expect((await dwarf.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'})).error?.message).toMatch(/is full: 5 of six places/)
  check(await admin.from('engine_prisoners').delete().eq('name','Late arrival'))
  check(await dwarf.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect((await prisoners()).find((p:any)=>p.case_id===c.id)).toMatchObject({large:true,places:2,state:'held'})
  expect((await admin.from('engine_prisoners').insert({engine_id:engine,holder_warband_id:cw,exploration_report_id:report,name:'Bad row',large:true,places:1,snapshot:{}})).error?.message).toMatch(/places/)
 })

 it('uses the saved exploration count and original app die, rejecting duplicate gold and rerolls at placement',async()=>{
  check(await fileDwarf({locationId:'prisoners',goldFound:10,enginePrisoners:{count:3,originalRoll:1,maximumFinds:false}}))
  const report=check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',cw).single()).id
  const place=(roll:number)=>dwarf.rpc('place_anonymous_prisoners',{p_engine_id:engine,p_report_id:report,p_prisoners:[{name:'First prisoner'}],p_count_roll:roll})
  expect((await place(3)).error?.message).toMatch(/already awarded gold/)
  check(await admin.from('match_reports').update({exploration:{locationId:'prisoners',goldFound:0,enginePrisoners:{count:3,originalRoll:1,maximumFinds:false}}}).eq('id',report))
  expect((await place(2)).error?.message).toMatch(/D3 saved in the battle report/)
  check(await place(3))
  expect((await prisoners())[0].snapshot).toMatchObject({count_roll:3,exploration_dice:{count:3,originalRoll:1,maximumFinds:false}})
  expect((await prisoners())[0].history).toContainEqual(expect.objectContaining({event:'exploration_count',count:3,original_roll:1}))
  expect((await dwarf.rpc('place_anonymous_prisoners_102',{p_engine_id:engine,p_report_id:report,p_prisoners:[{name:'Bypass attempt'}],p_count_roll:3})).error?.code).toBe('42501')
 })

 it('records anonymous prisoners from the holder\'s own exploration within the location\'s count, fixes the D3 per report, and frees the report once they are reversed',async()=>{
  check(await fileDwarf({locationId:'straggler',locationName:'Straggler',benefits:['straggler'],diceAllowed:2,diceReason:'',rolls:[4,4],total:8,shards:1,locationText:null,subRoll:null,goldFound:0,itemsFound:[],notes:[]}))
  const report=check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',cw).single()).id
  const place=(client:SupabaseClient,list:unknown[],roll:number|null=null,engineId=engine,reportId=report)=>client.rpc('place_anonymous_prisoners',{p_engine_id:engineId,p_report_id:reportId,p_prisoners:list,p_count_roll:roll})
  expect((await place(stranger,[{name:'Lost soul'}])).error?.code).toBe('42501')
  expect((await place(dwarf,[{name:'Lost soul'}])).error?.message).toMatch(/already used the Straggler for insight/)
  check(await admin.from('match_reports').update({exploration:{locationId:'straggler',benefits:[]}}).eq('id',report))
  expect((await place(dwarf,[{name:'Lost soul'}],2)).error?.message).toMatch(/no D3 applies/)
  expect((await place(dwarf,[{name:'Lost soul',large:true}])).error?.message).toMatch(/ordinary humans/)
  expect((await place(dwarf,[{name:'Lost soul'},{name:'Second soul'}])).error?.message).toMatch(/yields 1 prisoner; 0 already locked up, so 2 more cannot be added/)
  const [straggler]=check(await place(dwarf,[{name:'Lost soul'}]))
  expect((await prisoners())[0]).toMatchObject({id:straggler,state:'held',places:1,exploration_report_id:report,case_id:null,victim_warband_id:null,snapshot:{anonymous:true,location:'straggler',allowed:1}})
  expect((await place(dwarf,[{name:'Another'}])).error?.message).toMatch(/1 already locked up/)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/still locked in an Engine of Chaos/)
  expect((await stranger.rpc('reverse_anonymous_placement',{p_prisoner_id:straggler,p_reason:'Not mine'})).error?.code).toBe('42501')
  check(await dwarf.rpc('reverse_anonymous_placement',{p_prisoner_id:straggler,p_reason:'Entered against the wrong report'}))
  expect((await prisoners())[0]).toMatchObject({state:'reversed',release_reason:'Entered against the wrong report'})
  expect((await dwarf.rpc('reverse_anonymous_placement',{p_prisoner_id:straggler,p_reason:'Again please'})).error?.message).toMatch(/no longer held/)
  // Prisoners (333): D3 fixed by the first placement, counted across every placement for the report.
  check(await admin.from('match_reports').update({exploration:{locationId:'prisoners'}}).eq('id',report))
  expect((await place(dwarf,[{name:'Merchant'}])).error?.message).toMatch(/Roll a D3/)
  expect((await place(dwarf,[{name:'Merchant'}],4)).error?.message).toMatch(/Roll a D3/)
  expect((await place(dwarf,[{name:'Merchant'},{name:'Wife'},{name:'Son'}],2)).error?.message).toMatch(/yields 2 prisoners; 0 already locked up, so 3 more cannot be added/)
  const ids=check(await place(gm,[{name:'Merchant'},{name:'Wife'}],2));expect(ids).toHaveLength(2)
  expect((await place(dwarf,[{name:'Son'}],3)).error?.message).toMatch(/already recorded as 2; the count cannot be re-rolled/)
  expect((await place(dwarf,[{name:'Son'}])).error?.message).toMatch(/yields 2 prisoners; 2 already locked up/)
  expect((await prisoners()).filter((p:any)=>p.state==='held').map((p:any)=>p.snapshot.count_roll)).toEqual([2,2])
  check(await admin.from('match_reports').update({exploration:{locationId:'fletcher'}}).eq('id',report))
  expect((await place(dwarf,[{name:'Apprentice'}])).error?.message).toMatch(/Straggler and Prisoners results place anonymous prisoners for now/)
  // The victim's report is not the holder's; a travelling Engine takes nobody.
  check(await fileVictim())
  const victimReport=check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',vw).single()).id
  expect((await place(dwarf,[{name:'Wrong report'}],null,engine,victimReport)).error?.message).toMatch(/own applied report/)
  check(await admin.from('match_reports').update({exploration:{locationId:'prisoners'}}).eq('id',report))
  check(await admin.from('engine_of_chaos_units').update({state:'away'}).eq('id',engine))
  expect((await place(dwarf,[{name:'Son'}],2)).error?.message).toMatch(/full|is away/)
  check(await admin.from('engine_of_chaos_units').update({state:'present'}).eq('id',engine))
  // Withdrawal waits for every held prisoner of the report.
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/still locked in an Engine of Chaos/)
  for(const id of ids)check(await dwarf.rpc('reverse_anonymous_placement',{p_prisoner_id:id,p_reason:'Report being corrected'}))
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw}))
 })
})
