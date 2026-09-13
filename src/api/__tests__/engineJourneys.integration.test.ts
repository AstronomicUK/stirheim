import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildEnginePlacementProposal } from '../engineCustody'
import { buildHashutReturn, type EngineJourneyRow } from '../engineJourneys'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Hashut\'s Reward journeys (#229 / #95, migration 105)',()=>{
 let admin:SupabaseClient,reik:SupabaseClient,dwarf:SupabaseClient,gm:SupabaseClient,stranger:SupabaseClient
 const users:string[]=[];let vw:string,cw:string,campaign:string,match:string,heroA:string,heroB:string,sorcerer:string,gaoler:string,hired:string,stock:string,engine:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<4;i++){
   const email=`engine-journey-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Journey QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[reik,dwarf,gm,stranger]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable victims',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Dwarfs',type_rules_id:'black_dwarfs',gold:100}]).select('id'));[vw,cw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Journeys',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:cw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports',started_at:'2026-09-01T18:00:00Z'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  heroA=check(await admin.from('heroes').insert({warband_id:vw,name:'Taken Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:12,status:'active'}).select('id').single()).id
  heroB=check(await admin.from('heroes').insert({warband_id:vw,name:'Taken Champion',unit_type_rules_id:'mercenaries_reikland_champion',stats,xp:8,status:'active'}).select('id').single()).id
  check(await admin.from('items').insert([{warband_id:vw,holder_type:'hero',holder_id:heroA,item_rules_id:'sword',quantity:1},{warband_id:vw,holder_type:'hero',holder_id:heroB,item_rules_id:'axe',quantity:1}]))
  sorcerer=check(await admin.from('heroes').insert({warband_id:cw,name:'Sorcerer Zhatan',unit_type_rules_id:'black_dwarfs_sorcerer',stats,xp:19,status:'active'}).select('id').single()).id
  gaoler=check(await admin.from('heroes').insert({warband_id:cw,name:'Gaoler Zharrek',unit_type_rules_id:'black_dwarfs_gaolers',stats,xp:8,status:'active'}).select('id').single()).id
  hired=check(await admin.from('heroes').insert({warband_id:cw,name:'Hired Ogre',is_hired_sword:true,hired_sword_rules_id:'ogre_bodyguard',stats,xp:0,status:'active'}).select('id').single()).id
  stock=check(await admin.from('items').insert({warband_id:cw,holder_type:'stash',item_rules_id:'engine_of_chaos',quantity:1}).select('id').single()).id
  engine=check(await admin.from('engine_of_chaos_units').select('id').eq('inventory_item_id',stock).single()).id
  // Both Reikland Heroes are Captured (61); the Chaos Dwarfs found Prisoners (D3 = 2) exploring.
  check(await reik.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
   injuries:[heroA,heroB].map((id,i)=>({subjectType:'hero',subjectId:id,subjectName:i?'Taken Champion':'Taken Captain',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''})),
   applied:{heroes:[heroA,heroB].map(id=>({id,patch:{status:'captured',flags:{captured:true}}}))}}}))
  check(await dwarf.rpc('submit_battle_report',{p_match_id:match,p_warband_id:cw,p_report:{result:'won',ooa:[],injuries:[],exploration:{locationId:'prisoners',benefits:[]},applied:{heroes:[],groups:[]}}}))
 })
 afterEach(async()=>{
  // Journeys away are reversed by the GM; standing outcomes released; cases and custody rows go before
  // the match so the report guards pass; warbands last. Every step is checked so a leak fails loudly.
  for(const j of check(await admin.from('engine_journeys').select('id,state').eq('warband_id',cw)).filter((j:any)=>j.state==='away')){
   const r=await gm.rpc('reverse_engine_journey',{p_journey_id:j.id,p_reason:'Test teardown'});if(r.error&&!/changed since/.test(r.error.message))throw Error(r.error.message)
  }
  check(await admin.from('engine_journeys').delete().eq('warband_id',cw))
  for(const c of check(await admin.from('captive_cases').select('id,state').eq('match_id',match)).filter((c:any)=>['held','resolved'].includes(c.state)))
   check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'Test teardown release',p_release_only:true}))
  check(await admin.from('captive_cases').delete().eq('match_id',match))
  check(await admin.from('engine_prisoners').delete().in('holder_warband_id',[vw,cw]))
  check(await admin.from('matches').delete().eq('campaign_id',campaign))
  if(campaign)check(await admin.from('campaigns').delete().eq('id',campaign))
  if(vw)check(await admin.from('warbands').delete().in('id',[vw,cw]))
  check(await admin.from('app_notifications').delete().in('user_id',users))
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const cases=async()=>check(await gm.from('captive_cases').select('*,proposals:captive_proposals(id,state,message,choice)').eq('match_id',match).order('created_at'))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,cw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,cw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,cw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,cw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id).order('created_at')),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id).order('created_at'));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
 const prisoners=async()=>check(await admin.from('engine_prisoners').select('*').eq('engine_id',engine).order('placed_at'))
 const engineRow=async()=>check(await admin.from('engine_of_chaos_units').select('*').eq('id',engine).single())
 const journeys=async(client:SupabaseClient=dwarf,warband=cw)=>check(await client.rpc('engine_journeys_for_warband',{p_warband_id:warband}))
 const journey=async(id:string)=>check(await admin.from('engine_journeys').select('*').eq('id',id).single()) as Promise<EngineJourneyRow>
 const hero=async(id:string)=>check(await admin.from('heroes').select('status,xp,flags').eq('id',id).single())
 /** Lock a captured Hero in the Engine by consent (102). */
 async function place(heroId:string){
  const c=(await cases()).find((c:any)=>c.hero_id===heroId)
  const [owner,captor]=[await detail(vw),await detail(cw)]
  const built=buildEnginePlacementProposal({item:c as CaptiveCase,owner,captor,engineId:engine})
  const id=check(await reik.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:built.choice,p_message:'Lock him up',p_owner_changes:diffRoster(owner,built.nextOwner),p_captor_changes:diffRoster(captor,built.nextCaptor),p_advances:[],p_expected:await expected()}))
  check(await dwarf.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  return (await prisoners()).find((p:any)=>p.case_id===c.id).id as string
 }
 const report=async()=>check(await admin.from('match_reports').select('id').eq('match_id',match).eq('warband_id',cw).single()).id
 const dispatch=(client:SupabaseClient,escort:string,ids:string[],updatedAt?:string)=>engineRow().then(e=>client.rpc('dispatch_engine',{p_engine_id:engine,p_escort_hero_id:escort,p_prisoner_ids:ids,p_expected_updated_at:updatedAt??e.updated_at}))
 /** A completed battle the Chaos Dwarfs fought, started at `startedAt`, with their report applied. */
 async function fightBattle(startedAt:string){
  const m=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports',started_at:startedAt}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,cw].map(warband_id=>({match_id:m,warband_id,accepted_at:new Date().toISOString()}))))
  check(await dwarf.rpc('submit_battle_report',{p_match_id:m,p_warband_id:cw,p_report:{result:'won',ooa:[],injuries:[],applied:{heroes:[],groups:[]}}}))
  check(await admin.from('matches').update({state:'completed',completed_at:new Date().toISOString()}).eq('id',m))
  return m as string
 }

 it('gathers consent per named captive, departs with four, blocks edits while away, and pays the Heroes\' D3 reward once after a battle that began after departure',async()=>{
  const [anon1,anon2]=check(await dwarf.rpc('place_anonymous_prisoners',{p_engine_id:engine,p_report_id:await report(),p_prisoners:[{name:'Merchant'},{name:'Wife'}],p_count_roll:2}))
  const pA=await place(heroA),pB=await place(heroB)
  expect((await prisoners()).filter((p:any)=>p.state==='held')).toHaveLength(4)
  // Refusals: outsiders, a hired sword or absent escort, captives not held here, a stale engine record.
  expect((await dispatch(stranger,gaoler,[pA])).error?.code).toBe('42501')
  expect((await dispatch(dwarf,hired,[pA])).error?.message).toMatch(/own active Heroes/)
  check(await admin.from('heroes').update({flags:{missNextGames:1}}).eq('id',gaoler))
  expect((await dispatch(dwarf,gaoler,[pA])).error?.message).toMatch(/already missing the next battle/)
  check(await admin.from('heroes').update({flags:{}}).eq('id',gaoler))
  expect((await dispatch(dwarf,gaoler,[pA,crypto.randomUUID()])).error?.message).toMatch(/must be held in/)
  expect((await dispatch(dwarf,gaoler,[pA],'2020-01-01T00:00:00Z')).error?.code).toBe('40001')
  expect((await dispatch(dwarf,gaoler,[])).error?.message).toMatch(/at least one captive/)
  const started=check(await dispatch(dwarf,gaoler,[pA,pB,anon1,anon2]))
  expect(started).toMatchObject({departed:false});expect(started.proposalIds).toHaveLength(2)
  expect((await journey(started.journeyId))).toMatchObject({state:'pending',escort_name:'Gaoler Zharrek',captive_count:0})
  expect((await prisoners()).map((p:any)=>[p.state,p.journey_id===started.journeyId]).sort()).toEqual([['held',true],['held',true],['held',true],['held',true]])
  expect((await dispatch(dwarf,sorcerer,[anon1])).error?.message).toMatch(/already has a journey under way|not already chosen/)
  // The victim sees both sacrifice proposals on the held cases and answers them one after the other
  // (the second consent is not staled by the first roster change).
  const all=await cases()
  const propA=all.find((c:any)=>c.hero_id===heroA).proposals.find((p:any)=>p.choice.kind==='dispatch'),propB=all.find((c:any)=>c.hero_id===heroB).proposals.find((p:any)=>p.choice.kind==='dispatch')
  expect(propA.message).toMatch(/^Sent to the Dark Lands\. Taken Captain \(Disposable victims\) is sacrificed to Hashut and removed from Disposable victims permanently; he is recorded as dead and his confiscated equipment stays with Disposable Dwarfs\. .+ and its escort Gaoler Zharrek miss the next battle\.$/)
  expect((await dwarf.rpc('respond_captive_proposal',{p_proposal_id:propA.id,p_action:'accept'})).error?.message).toMatch(/other warband's player/)
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:propA.id,p_action:'accept'}))
  expect(await hero(heroA)).toMatchObject({status:'dead',flags:{captured:true,sacrificedToHashut:true,journeyId:started.journeyId}})
  expect((await prisoners()).find((p:any)=>p.id===pA).state).toBe('dispatched')
  expect((await journey(started.journeyId)).state).toBe('pending')
  expect((await dwarf.rpc('cancel_engine_journey',{p_journey_id:started.journeyId,p_reason:'Changed my mind'})).error?.message).toMatch(/already agreed/)
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:propB.id,p_action:'accept'}))
  // Departure: Engine away, escort sits out, plan fixed from four actual captives.
  const away=await journey(started.journeyId)
  expect(away).toMatchObject({state:'away',captive_count:4,plan:{recipient:'heroes',fixedXp:0,d3Count:1,d6GoldCount:0}})
  expect(away.prisoner_ids.sort()).toEqual([pA,pB,anon1,anon2].sort())
  expect((await engineRow()).state).toBe('away')
  expect((await hero(gaoler)).flags).toEqual({missNextGames:1})
  expect((await prisoners()).every((p:any)=>p.state==='dispatched')).toBe(true)
  expect((await cases()).map((c:any)=>[c.state,c.resolution_kind])).toEqual([['resolved','dispatch'],['resolved','dispatch']])
  // While away: the sacrifice cannot be reversed case by case, the escort cannot be edited back, no new placements.
  expect((await gm.rpc('reverse_captive_resolution',{p_case_id:all[0].id,p_reason:'Undo the sacrifice'})).error?.message).toMatch(/journey that still stands/)
  expect((await dwarf.from('heroes').update({flags:{}}).eq('id',gaoler)).error?.message).toMatch(/escorting the Engine of Chaos/)
  expect((await dwarf.from('heroes').update({status:'retired'}).eq('id',gaoler)).error?.message).toMatch(/escorting the Engine of Chaos/)
  expect((await dwarf.rpc('place_anonymous_prisoners',{p_engine_id:engine,p_report_id:await report(),p_prisoners:[{name:'Late'}]})).error?.message).toMatch(/is away/)
  // Not ready: no battle yet; a battle that began before departure does not count even if filed later.
  expect((await journeys())[0]).toMatchObject({ready_to_return:false,missed_match_id:null})
  await fightBattle('2026-09-02T18:00:00Z')
  expect((await journeys())[0].ready_to_return).toBe(false)
  expect((await dwarf.rpc('return_engine',{p_journey_id:started.journeyId,p_reward:{d3:[2],allocations:[{heroId:sorcerer,xp:2}]}})).error?.message).toMatch(/began after they left/)
  const missed=await fightBattle(new Date().toISOString())
  const status=(await journeys())[0];expect(status).toMatchObject({ready_to_return:true,missed_match_id:missed,leader_id:sorcerer});expect(status.missed_match_label).toMatch(/Battle \(\d{2} \w{3} \d{4}\)/)
  expect((await journeys(reik,vw))[0].journey.id).toBe(started.journeyId)
  // Reward: one D3 among the Heroes, dice and allocation validated, advances at real boxes, applied once.
  const ret=(reward:Record<string,unknown>,advances:unknown[]=[])=>dwarf.rpc('return_engine',{p_journey_id:started.journeyId,p_reward:reward,p_advances:advances})
  expect((await ret({d3:[],allocations:[{heroId:sorcerer,xp:1}]})).error?.message).toMatch(/Record 1 D3 result/)
  expect((await ret({d3:[4],allocations:[{heroId:sorcerer,xp:4}]})).error?.message).toMatch(/Record 1 D3 result/)
  expect((await ret({d3:[2],d6:3,allocations:[{heroId:sorcerer,xp:2}]})).error?.message).toMatch(/does not award gold/)
  expect((await ret({d3:[2],allocations:[{heroId:sorcerer,xp:1}]})).error?.message).toMatch(/share exactly 2 experience \(it shares 1\)/)
  expect((await ret({d3:[2],allocations:[{heroId:hired,xp:2}]})).error?.message).toMatch(/own active Heroes/)
  expect((await ret({d3:[2],allocations:[{heroId:sorcerer,xp:1},{heroId:gaoler,xp:1}]},[{subject_id:gaoler,threshold_xp:11}])).error?.message).toMatch(/threshold this reward does not cross/)
  const roster=(await detail(cw)).roster
  const payload=buildHashutReturn({journey:await journey(started.journeyId),roster,d3:[2],appD3:[1],allocations:[{heroId:sorcerer,xp:1},{heroId:gaoler,xp:1}]})
  expect(payload).toMatchObject({xpTotal:2,gold:0,advances:[{subject_id:sorcerer,threshold_xp:20}]})
  check(await dwarf.rpc('return_engine',{p_journey_id:started.journeyId,p_reward:payload.reward,p_advances:payload.advances}))
  expect((await hero(sorcerer)).xp).toBe(20);expect((await hero(gaoler)).xp).toBe(9)
  expect(check(await admin.from('pending_advances').select('subject_id,threshold_xp').eq('warband_id',cw))).toEqual([{subject_id:sorcerer,threshold_xp:20}])
  expect((await engineRow()).state).toBe('present')
  const done=await journey(started.journeyId)
  expect(done).toMatchObject({state:'returned',missed_match_id:missed,reward:{d3:[2],appD3:[1],d6:null,xpTotal:2,gold:0}})
  expect(done.advance_ids).toHaveLength(1)
  expect((await ret({d3:[2],allocations:[{heroId:sorcerer,xp:2}]})).error?.message).toMatch(/not away/)
  expect((await gm.rpc('reverse_engine_journey',{p_journey_id:started.journeyId,p_reason:'Too late now'})).error?.message).toMatch(/not yet returned/)
  // The exploration report that yielded the anonymous captives stays pinned after the reward is paid
  // (here it is also linked by the accepted sacrifices, whose guard answers first).
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/depends on this report|sent to the Dark Lands; the report stays as filed/)
 })

 it('cancels before consent, finishes with the agreed captives, refuses a rejected captive, lets the GM reverse a departed journey, and pays the leader\'s +1',async()=>{
  const [anon]=check(await dwarf.rpc('place_anonymous_prisoners',{p_engine_id:engine,p_report_id:await report(),p_prisoners:[{name:'Merchant'}],p_count_roll:1}))
  const pA=await place(heroA),pB=await place(heroB)
  // Cancel while nobody has agreed: proposal withdrawn, captives un-reserved.
  const first=check(await dispatch(dwarf,gaoler,[pA,anon]))
  check(await dwarf.rpc('cancel_engine_journey',{p_journey_id:first.journeyId,p_reason:'Wrong Engine chosen'}))
  expect((await journey(first.journeyId)).state).toBe('cancelled')
  expect((await prisoners()).map((p:any)=>[p.state,p.journey_id])).toEqual([['held',null],['held',null],['held',null]])
  expect(check(await admin.from('captive_proposals').select('state').eq('id',first.proposalIds[0]).single()).state).toBe('withdrawn')
  // A refused sacrifice leaves the captive held; with nobody else travelling the journey cancels itself.
  const second=check(await dispatch(dwarf,gaoler,[pB]))
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:second.proposalIds[0],p_action:'reject',p_reason:'Never'}))
  expect((await journey(second.journeyId)).state).toBe('cancelled')
  expect((await prisoners()).find((p:any)=>p.id===pB)).toMatchObject({state:'held',journey_id:null})
  expect((await hero(heroB)).status).toBe('captured')
  // Finish: depart with the agreed captive while the other player has not answered.
  const third=check(await dispatch(dwarf,gaoler,[pA,anon]))
  expect((await dwarf.rpc('finish_engine_journey',{p_journey_id:crypto.randomUUID()})).error?.code).toBe('P0002')
  expect(check(await dwarf.rpc('finish_engine_journey',{p_journey_id:third.journeyId}))).toMatchObject({departed:true,captiveCount:1})
  expect((await prisoners()).find((p:any)=>p.id===pA)).toMatchObject({state:'held',journey_id:null})
  expect(check(await admin.from('captive_proposals').select('state').eq('id',third.proposalIds[0]).single()).state).toBe('withdrawn')
  expect((await journey(third.journeyId))).toMatchObject({state:'away',captive_count:1,plan:{recipient:'leader',fixedXp:1}})
  expect((await hero(gaoler)).flags).toEqual({missNextGames:1})
  // The GM reverses the departed journey: Engine back, captive held again, escort free.
  expect((await dwarf.rpc('reverse_engine_journey',{p_journey_id:third.journeyId,p_reason:'Not the GM'})).error?.code).toBe('42501')
  check(await gm.rpc('reverse_engine_journey',{p_journey_id:third.journeyId,p_reason:'Recorded on the wrong Engine'}))
  expect((await journey(third.journeyId)).state).toBe('cancelled')
  expect((await engineRow()).state).toBe('present')
  expect((await prisoners()).find((p:any)=>p.id===anon)).toMatchObject({state:'held',journey_id:null})
  expect((await hero(gaoler)).flags).toEqual({})
  // A named captive whose player agreed is reversed through the case snapshot and is held again.
  const fourth=check(await dispatch(dwarf,gaoler,[pA]))
  check(await reik.rpc('respond_captive_proposal',{p_proposal_id:fourth.proposalIds[0],p_action:'accept'}))
  expect((await journey(fourth.journeyId)).state).toBe('away');expect((await hero(heroA)).status).toBe('dead')
  check(await gm.rpc('reverse_engine_journey',{p_journey_id:fourth.journeyId,p_reason:'The players agreed to undo it'}))
  expect((await hero(heroA)).status).toBe('captured')
  expect((await cases()).find((c:any)=>c.hero_id===heroA)).toMatchObject({state:'held',resolution_kind:'engine_placement'})
  expect((await prisoners()).find((p:any)=>p.id===pA)).toMatchObject({state:'held',journey_id:null})
  // Leader's +1: one anonymous captive, the reward must go to the current leader alone.
  const fifth=check(await dispatch(dwarf,gaoler,[anon]))
  expect(fifth.departed).toBe(true)
  await fightBattle(new Date().toISOString())
  const ret=(reward:Record<string,unknown>)=>dwarf.rpc('return_engine',{p_journey_id:fifth.journeyId,p_reward:reward,p_advances:[]})
  expect((await ret({d3:[],allocations:[{heroId:gaoler,xp:1}],leaderId:gaoler})).error?.message).toMatch(/current leader alone/)
  expect((await ret({d3:[],allocations:[{heroId:sorcerer,xp:1}]})).error?.message).toMatch(/current leader alone/)
  expect((await ret({d3:[1],allocations:[{heroId:sorcerer,xp:1}],leaderId:sorcerer})).error?.message).toMatch(/Record 0 D3 results/)
  check(await ret({d3:[],allocations:[{heroId:sorcerer,xp:1}],leaderId:sorcerer}))
  expect((await hero(sorcerer)).xp).toBe(20)
  expect((await journey(fifth.journeyId))).toMatchObject({state:'returned',reward:{xpTotal:1,gold:0,leaderId:sorcerer}})
 })

 it('keeps an exploration report pinned while its anonymous captives travel and after the reward is paid',async()=>{
  const [anon]=check(await dwarf.rpc('place_anonymous_prisoners',{p_engine_id:engine,p_report_id:await report(),p_prisoners:[{name:'Merchant'}],p_count_roll:1}))
  const trip=check(await dispatch(dwarf,gaoler,[anon]))
  expect(trip.departed).toBe(true)
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/sent to the Dark Lands; the report stays as filed/)
  await fightBattle(new Date().toISOString())
  check(await dwarf.rpc('return_engine',{p_journey_id:trip.journeyId,p_reward:{d3:[],allocations:[{heroId:sorcerer,xp:1}],leaderId:sorcerer},p_advances:[]}))
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:cw})).error?.message).toMatch(/sent to the Dark Lands; the report stays as filed/)
  // Reversing the source placement is impossible too: the captive is no longer held.
  expect((await dwarf.rpc('reverse_anonymous_placement',{p_prisoner_id:anon,p_reason:'Undo the find'})).error?.message).toMatch(/no longer held \(dispatched\)/)
 })
})
