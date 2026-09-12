import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveCaptive } from '../../rules/resolve/captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
import { eventAdvances } from '../../rules/resolve/eventAdvances'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Captured cross-player cases (#229 core)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,captor:SupabaseClient,gm:SupabaseClient,third:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,tw:string,campaign:string,match:string,hero:string,third_in_match=false
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`captive-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Captive QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,captor,gm,third]=clients
 })
 beforeEach(async()=>{
  third_in_match=false
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
 const addThird=async()=>{check(await admin.from('match_participants').insert({match_id:match,warband_id:tw,accepted_at:new Date().toISOString()}));third_in_match=true}
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
 /** A 30 gc ransom, exactly as the resolver would diff it. */
 async function ransom(client:SupabaseClient,caseId:string,over:Record<string,unknown>={}){
  return client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice:{kind:'ransom',gold:30},p_message:'Taken Captain ransomed for 30 gc; returned with all equipment.',
   p_owner_changes:[{table:'warbands',op:'update',data:{gold:70}},{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{}}}],
   p_captor_changes:[{table:'warbands',op:'update',data:{gold:130}}],p_advances:[],p_expected:await expected(),...over})
 }
 const gold=async()=>check(await admin.from('warbands').select('id,gold').in('id',[vw,cw])).sort((a:any)=>a.id===vw?-1:1).map((w:any)=>w.gold)
 const heroStatus=async()=>check(await admin.from('heroes').select('status').eq('id',hero).single()).status

 it('opens a case from a filed capture, pre-fills the only enemy, notifies both players, and ignores other outcomes',async()=>{
  check(await fileVictim())
  const [c]=await cases();expect(c).toMatchObject({hero_name:'Taken Captain',state:'open',victim_warband_id:vw,captor_warband_id:cw,hero_id:hero})
  expect(check(await victim.from('app_notifications').select('title'))).toHaveLength(1)
  expect(check(await captor.from('app_notifications').select('title'))[0].title).toMatch(/holds Taken Captain captive/)
  expect(check(await third.from('captive_cases').select('id').eq('match_id',match))).toHaveLength(0)
  expect(check(await gm.from('captive_cases').select('id').eq('match_id',match))).toHaveLength(1)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw}))
  expect((await cases()).every((c:any)=>c.state==='withdrawn')).toBe(true)
  check(await fileVictim('recovered'));expect((await cases()).filter((c:any)=>c.state!=='withdrawn')).toHaveLength(0)
 })
 it('leaves the captor unassigned in a three-way battle unless the sheet names one enemy; only the victim or GM assigns',async()=>{
  await addThird();check(await fileVictim())
  let [c]=await cases();expect(c.state).toBe('unassigned');expect(c.captor_warband_id).toBeNull()
  expect((await captor.rpc('assign_captive_captor',{p_case_id:c.id,p_captor_warband_id:cw})).error?.message).toMatch(/captured warrior's player/)
  expect((await victim.rpc('assign_captive_captor',{p_case_id:c.id,p_captor_warband_id:vw})).error?.message).toMatch(/another warband/)
  check(await victim.rpc('assign_captive_captor',{p_case_id:c.id,p_captor_warband_id:tw}))
  ;[c]=await cases();expect(c).toMatchObject({state:'open',captor_warband_id:tw})
  expect(check(await third.from('app_notifications').select('title'))).toHaveLength(1)
  expect((await victim.rpc('assign_captive_captor',{p_case_id:c.id,p_captor_warband_id:cw,p_reason:'Wrong warband'})).error?.message).toMatch(/already recorded/)
  check(await gm.rpc('assign_captive_captor',{p_case_id:c.id,p_captor_warband_id:cw,p_reason:'The Marienburgers took him'}))
  ;[c]=await cases();expect(c.captor_warband_id).toBe(cw)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw}))
  check(await fileVictim('captured',['Sea dog (Disposable captors)']))
  const fresh=(await cases()).find((x:any)=>x.state==='open');expect(fresh.captor_warband_id).toBe(cw)
 })
 it('captor proposes, victim accepts: both rosters change together, the report is pinned, then reversal restores and reopens',async()=>{
  check(await fileVictim());const [c]=await cases()
  expect((await third.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'ransom',gold:30},p_message:'x',p_owner_changes:[],p_captor_changes:[],p_advances:[],p_expected:await expected()})).error?.message).toMatch(/player of one of the two warbands/)
  const proposalId=check(await ransom(captor,c.id))
  expect(await gold()).toEqual([100,100]);expect(await heroStatus()).toBe('captured')
  expect(check(await victim.from('app_notifications').select('title')).some((n:any)=>/outcome proposed by Disposable captors/.test(n.title))).toBe(true)
  expect((await captor.rpc('respond_captive_proposal',{p_proposal_id:proposalId,p_action:'accept'})).error?.message).toMatch(/other warband's player/)
  expect((await victim.rpc('respond_captive_proposal',{p_proposal_id:proposalId,p_action:'reject'})).error?.message).toMatch(/Say why/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:proposalId,p_action:'accept'}))
  expect(await gold()).toEqual([70,130]);expect(await heroStatus()).toBe('active')
  const [done]=await cases();expect(done).toMatchObject({state:'resolved',resolution_kind:'ransom'});expect(done.proposals[0].state).toBe('accepted')
  expect((await victim.rpc('respond_captive_proposal',{p_proposal_id:proposalId,p_action:'accept'})).error?.message).toMatch(/already been answered/)
  expect(check(await admin.from('match_reports').select('notes').eq('match_id',match).single()).notes).toMatch(/Ransom: Taken Captain \(Disposable victims\) becomes active\. Disposable victims gold 100 → 70\. Disposable captors gold 100 → 130/)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw})).error?.message).toMatch(/depends on this report/)
  expect((await captor.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'We misread the injury roll'})).error?.message).toMatch(/campaign GM, or a player of both/)
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'no'})).error?.message).toMatch(/Explain why/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'We misread the injury roll'}))
  expect(await gold()).toEqual([100,100]);expect(await heroStatus()).toBe('captured')
  const [reopened]=await cases();expect(reopened.state).toBe('open');expect(reopened.proposals[0].state).toBe('reversed')
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw}))
  expect(await heroStatus()).toBe('active');expect((await cases()).every((c:any)=>c.state==='withdrawn')).toBe(true)
 })
 it('rejects a stale proposal after either roster changes, and refuses automatic reversal once a roster moved on',async()=>{
  check(await fileVictim());const [c]=await cases()
  const proposalId=check(await ransom(captor,c.id))
  check(await admin.from('warbands').update({gold:120}).eq('id',cw))
  expect((await victim.rpc('respond_captive_proposal',{p_proposal_id:proposalId,p_action:'accept'})).error?.code).toBe('40001')
  expect(await heroStatus()).toBe('captured')
  const again=check(await ransom(victim,c.id,{p_captor_changes:[{table:'warbands',op:'update',data:{gold:150}}]}))
  expect((await cases())[0].proposals.find((p:any)=>p.id===proposalId).state).toBe('proposed')
  check(await captor.rpc('respond_captive_proposal',{p_proposal_id:again,p_action:'accept'}))
  const [done]=await cases();expect(done.state).toBe('resolved');expect(done.proposals.find((p:any)=>p.id===proposalId).state).toBe('stale')
  check(await admin.from('warbands').update({gold:999}).eq('id',cw))
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Try to roll it back'})).error?.message).toMatch(/has changed since/)
  expect((await captor.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Release it please',p_release_only:true})).error?.message).toMatch(/Only the campaign GM can release/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Reconciled by hand',p_release_only:true}))
  expect((await cases()).every((c:any)=>c.state==='withdrawn')).toBe(true);expect(await heroStatus()).toBe('active')
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw}))
 })
 it('serialises a concurrent accept and withdraw so exactly one wins, and replaces duplicate proposals from one side',async()=>{
  check(await fileVictim());const [c]=await cases()
  const first=check(await ransom(captor,c.id));const second=check(await ransom(captor,c.id))
  expect((await cases())[0].proposals.find((p:any)=>p.id===first).state).toBe('withdrawn')
  const results=await Promise.all([victim.rpc('respond_captive_proposal',{p_proposal_id:second,p_action:'accept'}),captor.rpc('respond_captive_proposal',{p_proposal_id:second,p_action:'withdraw',p_reason:'Changed my mind'})])
  expect(results.filter(r=>!r.error)).toHaveLength(1)
  const state=(await cases())[0].proposals.find((p:any)=>p.id===second).state
  expect(['accepted','withdrawn']).toContain(state)
  expect(await gold()).toEqual(state==='accepted'?[70,130]:[100,100])
 })
 it('lets the GM record an outcome directly, and closes a case when the warrior is freed another way',async()=>{
  check(await fileVictim());const [c]=await cases()
  check(await ransom(gm,c.id))
  expect(await gold()).toEqual([70,130]);expect((await cases())[0].state).toBe('resolved')
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Recorded against the wrong warrior'}))
  expect(await gold()).toEqual([100,100]);expect((await cases())[0].state).toBe('open')
  check(await admin.from('heroes').update({status:'active'}).eq('id',hero))
  const [closed]=await cases();expect(closed).toMatchObject({state:'resolved',resolution_kind:'external'})
  expect((await captor.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'ransom',gold:30},p_message:'x',p_owner_changes:[],p_captor_changes:[],p_advances:[],p_expected:await expected()})).error?.message).toMatch(/not open/)
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Undo the manual fix'})).error?.message).toMatch(/outside the proposal flow/)
  expect(third_in_match).toBe(false)
 })

 it('writes its own consent text and refuses payloads the outcome cannot produce',async()=>{
  check(await fileVictim());const [c]=await cases()
  const base={p_owner_changes:[{table:'warbands',op:'update',data:{gold:70}},{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{}}}],p_captor_changes:[{table:'warbands',op:'update',data:{gold:130}}]}
  // The message says 25 gc but the change says 30: the stored text describes the real change.
  const id=check(await ransom(captor,c.id,{p_message:'Ransom of 25 gc, honest.'}))
  const p=(await cases())[0].proposals.find((x:any)=>x.id===id)
  expect(check(await victim.from('captive_proposals').select('message,proposer_note').eq('id',id).single())).toMatchObject({proposer_note:'Ransom of 25 gc, honest.'})
  expect(check(await victim.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/gold 100 → 70.*gold 100 → 130/)
  expect(p.state).toBe('proposed')
  // Choice says 25 but the gold moves 30.
  expect((await captor.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'ransom',gold:25},p_message:'x',p_advances:[],p_expected:await expected(),...base})).error?.message).toMatch(/gold and wyrdstone changes do not match/)
  // Unrelated Hero deletion on the victim side.
  const other=check(await admin.from('heroes').insert({warband_id:vw,name:'Bystander',unit_type_rules_id:'mercenaries_reikland_champion',stats,xp:0,status:'active'}).select('id').single()).id
  expect((await ransom(captor,c.id,{p_owner_changes:[...base.p_owner_changes,{table:'heroes',op:'delete',id:other}]})).error?.message).toMatch(/cannot touch/)
  // Unrelated group mutation on the captor side.
  const grp=check(await admin.from('henchman_groups').insert({warband_id:cw,name:'Marksmen',unit_type_rules_id:'mercenaries_marienburg_marksmen',size:2,stats,xp:0}).select('id').single()).id
  expect((await ransom(captor,c.id,{p_captor_changes:[...base.p_captor_changes,{table:'henchman_groups',op:'update',id:grp,data:{size:5}}]})).error?.message).toMatch(/cannot touch/)
  // Archiving or renaming the other roster.
  expect((await ransom(captor,c.id,{p_owner_changes:[{table:'warbands',op:'update',data:{gold:70,archived:true}},base.p_owner_changes[1]]})).error?.message).toMatch(/only change the warband's gold and wyrdstone/)
  // Freeing the captive without paying, or a hero field the outcome never touches.
  expect((await ransom(captor,c.id,{p_captor_changes:[]})).error?.message).toMatch(/do not match/)
  expect((await ransom(captor,c.id,{p_owner_changes:[base.p_owner_changes[0],{table:'heroes',op:'update',id:hero,data:{status:'active',skills:['mighty_blow']}}]})).error?.message).toMatch(/only change the captive/)
  expect(check(await admin.from('heroes').select('id').eq('id',other))).toHaveLength(1)
  expect((await cases())[0].proposals.filter((x:any)=>x.state==='proposed')).toHaveLength(1)
 })
 it('pins the captor\'s own applied report too, and an exchanged partner\'s case and report, until reversed',async()=>{
  check(await fileVictim())
  // The captor also lost a Hero to the victims in the same battle, so each side holds a captive.
  const partner=check(await admin.from('heroes').insert({warband_id:cw,name:'Marienburg Mate',unit_type_rules_id:'mercenaries_marienburg_champion',stats,xp:5,status:'active'}).select('id').single()).id
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',ooa:[],injuries:[{subjectType:'hero',subjectId:partner,subjectName:'Marienburg Mate',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}],applied:{heroes:[{id:partner,patch:{status:'captured',flags:{captured:true}}}]}}}))
  const all=await cases();expect(all).toHaveLength(2)
  const mine=all.find((x:any)=>x.hero_id===hero),theirs=all.find((x:any)=>x.hero_id===partner)
  expect(theirs).toMatchObject({state:'open',victim_warband_id:cw,captor_warband_id:vw})
  const id=check(await captor.rpc('propose_captive_outcome',{p_case_id:mine.id,p_choice:{kind:'exchange',otherHeroId:partner},p_message:'Swap',p_advances:[],p_expected:await expected(),
   p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{}}}],p_captor_changes:[{table:'heroes',op:'update',id:partner,data:{status:'active',flags:{}}}]}))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await heroStatus()).toBe('active');expect(check(await admin.from('heroes').select('status').eq('id',partner).single()).status).toBe('active')
  const after=await cases();expect(after.find((x:any)=>x.id===theirs.id)).toMatchObject({state:'resolved',resolution_kind:'exchange'})
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/depends on this report/)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:vw})).error?.message).toMatch(/depends on this report/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:mine.id,p_reason:'The exchange never happened'}))
  expect(await heroStatus()).toBe('captured');expect(check(await admin.from('heroes').select('status').eq('id',partner).single()).status).toBe('captured')
  expect((await cases()).every((x:any)=>x.state==='open')).toBe(true)
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw}))
  expect(check(await admin.from('heroes').select('status').eq('id',partner).single()).status).toBe('active')
 })
 it('blocks withdrawing the captor\'s earlier report after a ransom moved gold, until the ransom is reversed',async()=>{
  check(await fileVictim())
  check(await captor.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',ooa:[],injuries:[],applied:{warband:{gold_delta:10}}}}))
  expect(await gold()).toEqual([100,110])
  const [c]=await cases();const id=check(await ransom(captor,c.id,{p_captor_changes:[{table:'warbands',op:'update',data:{gold:140}}]}))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await gold()).toEqual([70,140])
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/depends on this report/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Recorded too early'}))
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw}))
  expect((await cases())[0].state).toBe('open')
 })

 it('rejects duplicate row operations, unrelated stash gains, erased injuries, wrong group profiles and bogus advances',async()=>{
  check(await fileVictim());const [c]=await cases()
  const sword=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1}).select('id').single()).id
  check(await admin.from('heroes').update({injuries:[{injuryCode:'old_battle_wound',injuryName:'Old Battle Wound',effect:'Roll before each battle.'},{injuryCode:'captured',injuryName:'Captured',effect:''}],flags:{captured:true,oldBattleWound:true}}).eq('id',hero))
  const owner=[{table:'warbands',op:'update',data:{gold:70}},{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{oldBattleWound:true}}}]
  const captorSide=[{table:'warbands',op:'update',data:{gold:130}}]
  // Same row twice.
  expect((await ransom(captor,c.id,{p_owner_changes:[...owner,{table:'heroes',op:'update',id:hero,data:{status:'active'}}]})).error?.message).toMatch(/same row twice/)
  // Erasing a permanent injury or a flag the outcome does not touch.
  expect((await ransom(captor,c.id,{p_owner_changes:[owner[0],{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{}}}]})).error?.message).toMatch(/flags and injuries/)
  expect((await ransom(captor,c.id,{p_owner_changes:[owner[0],{table:'heroes',op:'update',id:hero,data:{status:'active',flags:{oldBattleWound:true},injuries:[]}}]})).error?.message).toMatch(/flags and injuries/)
  // Ransom must not move equipment; a sale must move exactly what was carried and nothing more.
  expect((await ransom(captor,c.id,{p_owner_changes:[...owner,{table:'items',op:'delete',id:sword}]})).error?.message).toMatch(/keeps his equipment/)
  expect((await ransom(captor,c.id,{p_owner_changes:owner,p_captor_changes:[...captorSide,{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}]})).error?.message).toMatch(/keeps his equipment/)
  const sale=async(extra:unknown[]=[],ownerExtra:unknown[]=[])=>captor.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'sell',d6:2},p_message:'x',p_advances:[],p_expected:await expected(),
   p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'retired',flags:{oldBattleWound:true}}},{table:'items',op:'delete',id:sword},...ownerExtra],
   p_captor_changes:[{table:'warbands',op:'update',data:{gold:110}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}},...extra]})
  expect((await sale([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}])).error?.message).toMatch(/exactly the equipment/)
  expect((await sale([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'heavy_armour',quantity:1}}])).error?.message).toMatch(/exactly the equipment/)
  expect((await sale([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'enchanted_skins',quantity:1}}])).error?.message).toMatch(/Enchanted Skins/)
  // A conversion must carry the printed profile and may not smuggle stats or state.
  const zombieCase=async(stats:Record<string,number>,extra:Record<string,unknown>={},client:SupabaseClient=captor)=>{
   check(await admin.from('warbands').update({type_rules_id:'the_undead'}).eq('id',cw))
   const r=await client.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:{kind:'zombie',groupId:'11111111-1111-4111-8111-aaaaaaaaaaaa'},p_message:'x',p_advances:[],p_expected:await expected(),
    p_owner_changes:[{table:'heroes',op:'update',id:hero,data:{status:'dead',flags:{oldBattleWound:true}}},{table:'items',op:'delete',id:sword}],
    p_captor_changes:[{table:'henchman_groups',op:'insert',id:'11111111-1111-4111-8111-aaaaaaaaaaaa',data:{name:'Taken Captain (Zombie)',unit_type_rules_id:'undead_zombies',size:1,stats,xp:0,level_ups:0,stat_increases:{},model_names:[],...extra}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}]})
   check(await admin.from('warbands').update({type_rules_id:'mercenaries_marienburg'}).eq('id',cw));return r
  }
  const zombie={M:4,WS:2,BS:0,S:3,T:3,W:1,I:1,A:1,Ld:5}
  expect((await zombieCase({...zombie,WS:6})).error?.message).toMatch(/printed profile/)
  expect((await zombieCase(zombie,{campaign_state:{inheritedSkillIds:['dodge']}})).error?.message).toMatch(/single new model/)
  expect((await zombieCase(zombie,{xp:9})).error?.message).toMatch(/single new model/)
  // Advances only for experience the outcome actually awards.
  expect((await ransom(captor,c.id,{p_owner_changes:owner,p_captor_changes:captorSide,p_advances:[{warband_id:vw,subject_type:'hero',subject_id:hero,threshold_xp:14}]})).error?.message).toMatch(/experience this outcome does not change/)
  expect((await cases())[0].proposals).toHaveLength(0)
  // The honest zombie payload is accepted and applied by the GM in one step.
  check(await zombieCase(zombie,{},gm))
  expect(await heroStatus()).toBe('dead')
  expect(check(await admin.from('henchman_groups').select('unit_type_rules_id,size').eq('warband_id',cw))).toEqual([{unit_type_rules_id:'undead_zombies',size:1}])
  expect(check(await admin.from('items').select('holder_type,item_rules_id').eq('warband_id',cw))).toEqual([{holder_type:'stash',item_rules_id:'sword'}])
 })
 it("accepts the app's own resolver output for a sale and an escape with an earned advance",async()=>{
  check(await fileVictim());const [c]=await cases()
  check(await admin.from('items').insert([{warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1},{warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'light_armour',quantity:1}]))
  check(await admin.from('warbands').update({type_rules_id:'the_sons_of_hashut'}).eq('id',cw))
  const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id)),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
  const [owner,captorD]=[await detail(vw),await detail(cw)]
  // Slave work: escape on a 1 with D3 experience 2 takes the Captain from 12 to 14, crossing the 14 box.
  const preview=resolveCaptive(owner.roster,captorD.roster,hero,{kind:'slaveWork',d6:1,xp:2})
  const payload={p_case_id:c.id,p_choice:{kind:'slaveWork',d6:1,xp:2},p_message:preview.message,p_owner_changes:diffRoster(owner,preview.owner),p_captor_changes:diffRoster(captorD,preview.captor),
   p_advances:[...eventAdvances(owner.roster,preview.owner),...eventAdvances(captorD.roster,preview.captor)],p_expected:await expected()}
  expect(payload.p_advances).toEqual([{warband_id:vw,subject_type:'hero',subject_id:hero,threshold_xp:14}])
  const id=check(await captor.rpc('propose_captive_outcome',payload))
  expect(check(await victim.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/Slave work \(D6 1\).*experience 12 → 14.*keeps all 2 equipment.*1 advance roll/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('heroes').select('status,xp').eq('id',hero).single())).toEqual({status:'active',xp:14})
  expect(check(await admin.from('pending_advances').select('threshold_xp').eq('subject_id',hero))).toEqual([{threshold_xp:14}])
  expect(check(await admin.from('warbands').select('wyrdstone').eq('id',cw).single()).wyrdstone).toBe(1)
 })
})
