import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildKidnappedProposal } from '../pirates'
import type { CaptiveCase } from '../captives'
import { diffRoster } from '../../domain/rosterDiff'
import { toRosterWarband } from '../../domain'
import { eventAdvances } from '../../rules/resolve/eventAdvances'
const enabled=process.env.SUPABASE_LOCAL==='1'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:7}
const captainStats={M:4,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8}
const crewStats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const warriorStats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const G='22222222-2222-4222-8222-bbbbbbbbbbbb'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check=(r:{data:unknown;error:{message:string}|null}):any=>{if(r.error)throw Error(r.error.message);return r.data}
describe.skipIf(!enabled)('Pirates Kidnapped! (#229 follow-on)',()=>{
 let admin:SupabaseClient,victim:SupabaseClient,pirate:SupabaseClient,gm:SupabaseClient
 const users:string[]=[];let vw:string,pw:string,campaign:string,match:string,hero:string,sword:string,crew:string,crewSword:string,warriors:string,warriorSwords:string
 beforeAll(async()=>{
  admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const clients:SupabaseClient[]=[]
  for(let i=0;i<3;i++){
   const email=`kidnap-${crypto.randomUUID()}@stirheim.test`,password=crypto.randomUUID()
   const {user}=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:`Kidnap QA ${i}`}}));users.push(user.id)
   const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false}});check(await client.auth.signInWithPassword({email,password}));clients.push(client)
  }
  ;[victim,pirate,gm]=clients
 })
 beforeEach(async()=>{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bands=check(await admin.from('warbands').insert([{owner_id:users[0],name:'Disposable Reiklanders',type_rules_id:'mercenaries_reikland',gold:100},{owner_id:users[1],name:'Disposable Pirates',type_rules_id:'pirates',gold:100}]).select('id'));[vw,pw]=bands.map((b:any)=>b.id)
  campaign=check(await admin.from('campaigns').insert({gm_id:users[2],name:'Disposable Kidnapped',settings:{reportApproval:false}}).select('id').single()).id
  check(await admin.from('campaign_members').insert([{campaign_id:campaign,warband_id:vw,user_id:users[0]},{campaign_id:campaign,warband_id:pw,user_id:users[1]}]))
  match=check(await admin.from('matches').insert({campaign_id:campaign,created_by:users[2],state:'awaiting_reports'}).select('id').single()).id
  check(await admin.from('match_participants').insert([vw,pw].map(warband_id=>({match_id:match,warband_id,accepted_at:new Date().toISOString()}))))
  hero=check(await admin.from('heroes').insert({warband_id:vw,name:'Taken Captain',unit_type_rules_id:'mercenaries_reikland_captain',stats,xp:12,status:'active',skills:['dodge']}).select('id').single()).id
  sword=check(await admin.from('items').insert({warband_id:vw,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:1}).select('id').single()).id
  warriors=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Warriors',unit_type_rules_id:'mercenaries_reikland_warriors',size:3,stats:warriorStats,xp:0}).select('id').single()).id
  warriorSwords=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:warriors,item_rules_id:'sword',quantity:3}).select('id').single()).id
  check(await admin.from('heroes').insert({warband_id:pw,name:'Captain Redbeard',unit_type_rules_id:'pirates_captain',stats:captainStats,xp:20,status:'active'}))
  crew=check(await admin.from('henchman_groups').insert({warband_id:pw,name:'Deck hands',unit_type_rules_id:'pirates_crew',size:2,stats:crewStats,xp:0}).select('id').single()).id
  crewSword=check(await admin.from('items').insert({warband_id:pw,holder_type:'group',holder_id:crew,item_rules_id:'sword',quantity:2}).select('id').single()).id
 })
 afterEach(async()=>{
  if(match){await admin.from('captive_cases').delete().eq('match_id',match);await admin.from('matches').delete().eq('id',match)}
  if(campaign)await admin.from('campaigns').delete().eq('id',campaign)
  if(vw)await admin.from('warbands').delete().in('id',[vw,pw])
  await admin.from('app_notifications').delete().in('user_id',users)
 })
 afterAll(async()=>{for(const id of users)await admin.auth.admin.deleteUser(id)})
 const fileVictim=(opts:{heroCaptured?:boolean;henchmenLost?:boolean;unaccounted?:boolean;result?:'lost'|'won'|'draw'}={})=>victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:opts.result??'lost',ooa:[],
  injuries:[...(opts.heroCaptured===false?[]:[{subjectType:'hero',subjectId:hero,subjectName:'Taken Captain',rolls:[61],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}]),
            ...(opts.henchmenLost?[{subjectType:'group',subjectId:warriors,subjectName:'Warriors',rolls:[1,4,2],dead:2,...(opts.unaccounted?{}:{equipmentLost:[{sourceItemId:warriorSwords,quantity:2}]})}]:[])],
  applied:{heroes:opts.heroCaptured===false?[]:[{id:hero,patch:{status:'captured',flags:{captured:true}}}],groups:opts.henchmenLost?[{id:warriors,patch:{size:1}}]:[],item_patches:opts.henchmenLost?[{id:warriorSwords,quantity:1}]:[]}}})
 const filePirates=(result:'won'|'lost'|'draw'='won')=>pirate.rpc('submit_battle_report',{p_match_id:match,p_warband_id:pw,p_report:{result,applied:{}}})
 const cases=async(client=victim)=>check(await client.from('captive_cases').select('*,proposals:captive_proposals(id,state,message,reason)').eq('match_id',match).order('model_index').order('source'))
 async function expected(){
  const w=check(await admin.from('warbands').select('id,updated_at').in('id',[vw,pw]))
  const h=check(await admin.from('heroes').select('id,updated_at').in('warband_id',[vw,pw]))
  const g=check(await admin.from('henchman_groups').select('id,updated_at').in('warband_id',[vw,pw]))
  const i=check(await admin.from('items').select('id,updated_at').in('warband_id',[vw,pw]))
  return {warbands:w,heroes:h,henchman_groups:g,items:i}
 }
 const choice=(outcome:'crew'|'swabbie',pirateDice:number[],victimDice:number[],winner='pirates',extra:Record<string,unknown>={})=>({kind:'kidnapped',outcome,winner,captainLeadership:8,pirateRoll:{dice:pirateDice},victimRoll:{dice:victimDice},crew:{groupId:G,size:0,stats:crewStats,skillIds:[]},groupId:G,...extra})
 const heroLeaves=()=>[{table:'heroes',op:'update',id:hero,data:{status:'retired',flags:{}}},{table:'items',op:'delete',id:sword}]
 const newCrew=(kit:string[]=['dagger','sword'])=>[{table:'henchman_groups',op:'insert',id:G,data:{name:'Taken Captain',unit_type_rules_id:'pirates_crew',size:1,stats:crewStats,xp:0,level_ups:0,stat_increases:{},model_names:['Taken Captain']}},...kit.map(item_rules_id=>({table:'items',op:'insert',data:{holder_type:'group',holder_id:G,item_rules_id,quantity:1}}))]
 const newSwabbie=(skills:string[]=['dodge'],st:Record<string,number>=stats)=>[{table:'henchman_groups',op:'insert',id:G,data:{name:'Taken Captain',unit_type_rules_id:'pirates_swabbie',size:1,stats:st,xp:0,level_ups:0,stat_increases:{},model_names:['Taken Captain'],campaign_state:{inheritedSkillIds:skills}}},{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}]
 const propose=async(client:SupabaseClient,caseId:string,p_choice:unknown,p_owner_changes:unknown[],p_captor_changes:unknown[],p_advances:unknown[]=[])=>client.rpc('propose_captive_outcome',{p_case_id:caseId,p_choice,p_message:'Kidnapped!',p_owner_changes,p_captor_changes,p_advances,p_expected:await expected()})
 const heroRow=async()=>check(await admin.from('heroes').select('status,skills').eq('id',hero).single())
 const pirateGroups=async()=>check(await admin.from('henchman_groups').select('unit_type_rules_id,size,stats,campaign_state,name').eq('warband_id',pw).order('created_at'))

 it('each side records its own dice once, the server recomputes the contest, and a won contest makes the Hero a new Crewman with exchanged kit',async()=>{
  check(await fileVictim());const [c]=await cases();expect(c).toMatchObject({subject_kind:'hero',captor_warband_id:pw,state:'open'})
  // Dice need the Pirates' own report first? No — but the outcome does. Dice: wrong side, right side, duplicates.
  expect((await victim.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[4,4],p_side:'pirates'})).error?.message).toMatch(/own side/)
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[4,4],p_original:[4,4]}))
  expect((await pirate.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[6,6]})).error?.message).toMatch(/already recorded/)
  expect((await victim.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[7,1]})).error?.message).toMatch(/1 to 6/)
  check(await victim.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[2,2]}))
  expect(check(await victim.from('app_notifications').select('title')).some((n:any)=>/dice recorded \(4 \+ 4\)/.test(n.title))).toBe(true)
  // The Pirates must have filed; then the reports decide the winner and the dice decide the outcome.
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew())).error?.message).toMatch(/file their own report/)
  check(await filePirates('won'))
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2],'draw'),heroLeaves(),newCrew())).error?.message).toMatch(/battle result "pirates"/)
  expect((await propose(pirate,c.id,choice('crew',[6,6],[2,2]),heroLeaves(),newCrew())).error?.message).toMatch(/dice both players recorded/)
  expect((await propose(pirate,c.id,choice('swabbie',[4,4],[2,2]),heroLeaves(),newSwabbie())).error?.message).toMatch(/dice give crew \(Pirates 17 against 11\)/)
  expect((await propose(pirate,c.id,{...choice('crew',[4,4],[2,2]),captainLeadership:10},heroLeaves(),newCrew())).error?.message).toMatch(/Leadership on file is 8/)
  // Roster guards: the old kit is exchanged, not kept; Crew kit only from the list; printed profile.
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),[...newCrew(),{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}])).error?.message).toMatch(/exchanged for Crew kit/)
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew(['dagger','heavy_armour']))).error?.message).toMatch(/Pirate equipment list only/)
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),[{...newCrew()[0],data:{...(newCrew()[0] as any).data,stats:stats}},...newCrew().slice(1)])).error?.message).toMatch(/printed Crew profile/)
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),[heroLeaves()[0]],newCrew())).error?.message).toMatch(/equipment leaves with him/)
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),[{table:'heroes',op:'update',id:hero,data:{status:'dead',flags:{}}},heroLeaves()[1]],newCrew())).error?.message).toMatch(/must become "retired"/)
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew(),[{warband_id:pw,subject_type:'hero',subject_id:hero,threshold_xp:14}])).error?.message).toMatch(/awards no experience/)
  // The honest proposal, accepted by the victim.
  const id=check(await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew()))
  const msg=check(await victim.from('captive_proposals').select('message').eq('id',id).single()).message
  expect(msg).toMatch(/Kidnapped!: Taken Captain \(Disposable Reiklanders\) leaves his warband permanently\. Pirates 4 \+ 4 \+ Ld 8 \+ 1 for winning = 17 against Taken Captain 2 \+ 2 \+ Ld 7 = 11\. joins Disposable Pirates as a new Crew model "Taken Captain" with the printed Crew profile, armed with Dagger, Sword\. his 1 old equipment item\(s\) are exchanged away/)
  expect((await pirate.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'})).error?.message).toMatch(/other warband's player/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await heroRow()).toMatchObject({status:'retired'})
  expect(await pirateGroups()).toEqual([{unit_type_rules_id:'pirates_crew',size:2,stats:crewStats,campaign_state:{},name:'Deck hands'},{unit_type_rules_id:'pirates_crew',size:1,stats:crewStats,campaign_state:{},name:'Taken Captain'}])
  expect(check(await admin.from('items').select('item_rules_id').eq('holder_id',G)).map((i:any)=>i.item_rules_id).sort()).toEqual(['dagger','sword'])
  expect(check(await admin.from('items').select('id').eq('id',sword))).toHaveLength(0)
  expect((await cases())[0]).toMatchObject({state:'resolved',resolution_kind:'kidnapped'})
  // Both reports are now load-bearing; reversal restores everything and reopens the case.
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:pw})).error?.message).toMatch(/depends on this report/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:c.id,p_reason:'The contest was rolled with the wrong Leadership'}))
  expect(await heroRow()).toMatchObject({status:'captured'})
  expect(check(await admin.from('items').select('id').eq('id',sword))).toHaveLength(1)
  expect(await pirateGroups()).toHaveLength(1)
  expect((await cases())[0].state).toBe('open')
 })
 it('a lost or tied contest makes a Swabbie who keeps his profile and skills, with his kit going to the Pirates, within the Swabbie limit',async()=>{
  check(await fileVictim({result:'draw'}));check(await filePirates('draw'));const [c]=await cases()
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[2,2]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[3,2]}))
  // 2+2+8 = 12 against 3+2+7 = 12: a tie is a Swabbie.
  expect((await propose(pirate,c.id,choice('crew',[2,2],[3,2],'draw'),heroLeaves(),newCrew())).error?.message).toMatch(/dice give swabbie/)
  expect((await propose(pirate,c.id,choice('swabbie',[2,2],[3,2],'draw'),heroLeaves(),newSwabbie([]))).error?.message).toMatch(/retains exactly the recruit's skills \[Dodge\]/)
  expect((await propose(pirate,c.id,choice('swabbie',[2,2],[3,2],'draw'),heroLeaves(),newSwabbie(['dodge'],crewStats))).error?.message).toMatch(/keeps the recruit's own profile/)
  expect((await propose(pirate,c.id,choice('swabbie',[2,2],[3,2],'draw'),heroLeaves(),[newSwabbie()[0]])).error?.message).toMatch(/stash exactly as carried/)
  // Never more Swabbies than Crew: two Crew already, so a third Swabbie is refused.
  check(await admin.from('henchman_groups').insert({warband_id:pw,name:'Rabble',unit_type_rules_id:'pirates_swabbie',size:2,stats:warriorStats,xp:0}))
  expect((await propose(pirate,c.id,choice('swabbie',[2,2],[3,2],'draw'),heroLeaves(),newSwabbie())).error?.message).toMatch(/more Swabbies than Crew \(2 Crew, 2 Swabbies already\)/)
  check(await admin.from('henchman_groups').delete().eq('warband_id',pw).eq('name','Rabble'))
  const id=check(await propose(victim,c.id,choice('swabbie',[2,2],[3,2],'draw'),heroLeaves(),newSwabbie()))
  expect(check(await pirate.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/becomes a Swabbie of Disposable Pirates \(the contest was tied\) keeping his own profile and skills \[Dodge\]; no experience, no magic\. surrenders Sword to Disposable Pirates's stash/)
  check(await pirate.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await pirateGroups()).toEqual([{unit_type_rules_id:'pirates_crew',size:2,stats:crewStats,campaign_state:{},name:'Deck hands'},{unit_type_rules_id:'pirates_swabbie',size:1,stats,campaign_state:{inheritedSkillIds:['dodge']},name:'Taken Captain'}])
  expect(check(await admin.from('items').select('holder_type,item_rules_id').eq('warband_id',pw).eq('item_rules_id','sword').eq('holder_type','stash'))).toHaveLength(1)
 })
 it('refuses hired swords, non-human units and a Hero without the 61 result',async()=>{
  check(await fileVictim());check(await filePirates('won'));const [c]=await cases()
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[4,4]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:c.id,p_dice:[2,2]}))
  check(await admin.from('heroes').update({is_hired_sword:true,unit_type_rules_id:null,hired_sword_rules_id:'ogre_bodyguard'}).eq('id',hero))
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew())).error?.message).toMatch(/Hired Swords and Dramatis Personae/)
  check(await admin.from('heroes').update({is_hired_sword:false,hired_sword_rules_id:null,unit_type_rules_id:'ostlander_ogre'}).eq('id',hero))
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew())).error?.message).toMatch(/Only human warriors/)
  check(await admin.from('heroes').update({unit_type_rules_id:'mercenaries_reikland_captain'}).eq('id',hero))
  check(await admin.from('match_reports').update({injuries:[{subjectType:'hero',subjectId:hero,subjectName:'Taken Captain',rolls:[62],outcome:'captured',injuryCode:'captured',injuryName:'Captured',effect:''}]}).eq('id',c.report_id))
  expect((await propose(pirate,c.id,choice('crew',[4,4],[2,2]),heroLeaves(),newCrew())).error?.message).toMatch(/Captured result \(61\)/)
 })
 it('opens one opportunity per lost henchman once the Pirates file a win; recovery is rolled once; a recovered man joins an existing Crew group armed like his mates',async()=>{
  check(await fileVictim({heroCaptured:false,henchmenLost:true}))
  expect(await cases()).toHaveLength(0)
  check(await filePirates('won'))
  const opened=(await cases());expect(opened.map((c:any)=>[c.subject_kind,c.model_index,c.hero_name,c.state])).toEqual([['henchman',1,'Warriors (model 1)','open'],['henchman',3,'Warriors (model 3)','open']])
  expect(opened[0].model_snapshot).toMatchObject({survival_roll:1,group:{size:3,stats:warriorStats,unit_type_rules_id:'mercenaries_reikland_warriors'}})
  expect(opened[0].model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:1})])
  expect(check(await pirate.from('app_notifications').select('title')).filter((n:any)=>/Kidnapped! chance/.test(n.title))).toHaveLength(2)
  const [first,second]=opened
  // Dice before recovery are refused; the victim may not roll recovery; a failed roll closes the case for good.
  expect((await pirate.rpc('record_kidnap_dice',{p_case_id:first.id,p_dice:[4,4]})).error?.message).toMatch(/recover the body first/)
  expect((await victim.rpc('record_kidnap_recovery',{p_case_id:first.id,p_d6:6})).error?.message).toMatch(/Pirate player or the campaign GM/)
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:first.id,p_d6:2,p_original:2}))
  expect((await pirate.rpc('record_kidnap_recovery',{p_case_id:first.id,p_d6:6})).error?.message).toMatch(/closed/)
  expect((await cases())[0]).toMatchObject({state:'withdrawn',resolution_kind:'not_recovered'})
  expect((await cases())[0].history.some((h:any)=>h.event==='recovery_rolled'&&h.d6===2)).toBe(true)
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:second.id,p_d6:5}))
  expect((await pirate.rpc('record_kidnap_recovery',{p_case_id:second.id,p_d6:1})).error?.message).toMatch(/no second attempt/)
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[3,3]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[3,3]}))
  // 3+3+8+1 = 15 against 3+3+7 = 13: Crew. Nothing changes on the victim's roster; joining takes one of each crew item.
  expect((await propose(pirate,second.id,choice('crew',[3,3],[3,3]),[{table:'heroes',op:'update',id:hero,data:{status:'retired'}}],[])).error?.message).toMatch(/Nothing changes on the victim/)
  const join=(size:number,q:number)=>[{table:'henchman_groups',op:'update',id:crew,data:{size}},{table:'items',op:'update',id:crewSword,data:{quantity:q}}]
  expect((await propose(pirate,second.id,choice('crew',[3,3],[3,3],'pirates',{crew:{groupId:crew,size:2,stats:crewStats,skillIds:[]}}),[],join(4,3))).error?.message).toMatch(/exactly one model/)
  expect((await propose(pirate,second.id,choice('crew',[3,3],[3,3],'pirates',{crew:{groupId:crew,size:2,stats:crewStats,skillIds:[]}}),[],[join(3,3)[0]])).error?.message).toMatch(/one of each item the group carries/)
  expect((await propose(pirate,second.id,choice('crew',[3,3],[3,3],'pirates',{crew:{groupId:crew,size:2,stats:crewStats,skillIds:[]}}),[],[...join(3,3),{table:'items',op:'insert',data:{holder_type:'group',holder_id:crew,item_rules_id:'axe',quantity:1}}])).error?.message).toMatch(/armed exactly as his crewmates/)
  const id=check(await propose(pirate,second.id,choice('crew',[3,3],[3,3],'pirates',{crew:{groupId:crew,size:2,stats:crewStats,skillIds:[]}}),[],join(3,3)))
  expect(check(await victim.from('captive_proposals').select('message').eq('id',id).single()).message).toMatch(/is carried aboard \(recovery D6 5\)\. Pirates 3 \+ 3 \+ Ld 8 \+ 1 for winning = 15 against Warriors \(model 3\) 3 \+ 3 \+ Ld 7 = 13\. joins Disposable Pirates's Crew group "Deck hands" \(now 3 models\)/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('size').eq('id',crew).single()).size).toBe(3)
  expect(check(await admin.from('items').select('quantity').eq('id',crewSword).single()).quantity).toBe(3)
  expect(check(await admin.from('henchman_groups').select('size').eq('id',warriors).single()).size).toBe(1)
  // Withdrawing the Pirates' winning report is blocked while the outcome stands, and kills any open opportunity once reversed.
  expect((await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:pw})).error?.message).toMatch(/depends on this report/)
  check(await gm.rpc('reverse_captive_resolution',{p_case_id:second.id,p_reason:'Recorded against the wrong crew'}))
  expect(check(await admin.from('henchman_groups').select('size').eq('id',crew).single()).size).toBe(2)
  expect((await cases())[1].state).toBe('open')
  check(await gm.rpc('withdraw_battle_report',{p_match_id:match,p_warband_id:pw}))
  expect((await cases())[1].state).toBe('withdrawn')
 })
 it('the GM can reset a contest with a reason; a swabbie henchman keeps only his own share of kit',async()=>{
  check(await fileVictim({heroCaptured:false,henchmenLost:true}));check(await filePirates('won'))
  const second=(await cases())[1]
  check(await gm.rpc('record_kidnap_recovery',{p_case_id:second.id,p_d6:4}))
  check(await gm.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[1,1],p_side:'pirates'}));check(await victim.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[6,6]}))
  expect((await pirate.rpc('reset_kidnap_contest',{p_case_id:second.id,p_reason:'We rolled before the GM arrived'})).error?.message).toMatch(/Only the campaign GM/)
  check(await gm.rpc('reset_kidnap_contest',{p_case_id:second.id,p_reason:'We rolled before the GM arrived'}))
  expect((await cases())[1].contest).toBeNull()
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[1,2]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:second.id,p_dice:[6,6]}))
  // 1+2+8+1 = 12 against 6+6+7 = 19: Swabbie, with the group's own profile and one sword.
  const swabbie=(items:unknown[])=>[{table:'henchman_groups',op:'insert',id:G,data:{name:'Pressed warrior',unit_type_rules_id:'pirates_swabbie',size:1,stats:warriorStats,xp:0,level_ups:0,stat_increases:{},model_names:[],campaign_state:{inheritedSkillIds:[]}}},...items]
  expect((await propose(pirate,second.id,choice('swabbie',[1,2],[6,6]),[],swabbie([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:2}}]))).error?.message).toMatch(/own share of kit may be kept \(Sword ×1\)/)
  expect((await propose(pirate,second.id,choice('swabbie',[1,2],[6,6]),[],swabbie([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'axe',quantity:1}}]))).error?.message).toMatch(/own share/)
  const id=check(await propose(pirate,second.id,choice('swabbie',[1,2],[6,6]),[],swabbie([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}])))
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:id,p_action:'accept'}))
  expect(await pirateGroups()).toEqual([{unit_type_rules_id:'pirates_crew',size:2,stats:crewStats,campaign_state:{},name:'Deck hands'},{unit_type_rules_id:'pirates_swabbie',size:1,stats:warriorStats,campaign_state:{inheritedSkillIds:[]},name:'Pressed warrior'}])
 })

 it("accepts the app's own Kidnapped! builder output for a new Crew group, a joined group and a Swabbie",async()=>{
  const detail=async(id:string)=>{const w=check(await admin.from('warbands').select('*').eq('id',id).single()),hs=check(await admin.from('heroes').select('*').eq('warband_id',id)),gs=check(await admin.from('henchman_groups').select('*').eq('warband_id',id)),is=check(await admin.from('items').select('*').eq('warband_id',id));return {warband:w,heroes:hs,groups:gs,items:is,roster:toRosterWarband(w,hs,gs,is)}}
  const viaBuilder=async(c:CaptiveCase,client:SupabaseClient,opts:{joinGroupId?:string;kit?:string[]})=>{
   const [owner,captorD]=[await detail(vw),await detail(pw)]
   const built=buildKidnappedProposal({item:c,owner,captor:captorD,winner:'pirates',joinGroupId:opts.joinGroupId,kit:opts.kit??['dagger','sword'],newGroupId:crypto.randomUUID()})
   const r=await client.rpc('propose_captive_outcome',{p_case_id:c.id,p_choice:built.choice,p_message:built.message,p_owner_changes:diffRoster(owner,built.nextOwner),p_captor_changes:diffRoster(captorD,built.nextCaptor),p_advances:[...eventAdvances(owner.roster,built.nextOwner),...eventAdvances(captorD.roster,built.nextCaptor)],p_expected:await expected()})
   return {built,r}
  }
  // Hero, contest won: new Crew group with chosen kit.
  check(await fileVictim({henchmenLost:true}));check(await filePirates('won'))
  let all=await cases();const heroCase=all.find((c:any)=>c.subject_kind==='hero'),h1=all.find((c:any)=>c.model_index===1),h3=all.find((c:any)=>c.model_index===3)
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:heroCase.id,p_dice:[5,5]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:heroCase.id,p_dice:[1,1]}))
  ;[all]=[await cases()];const hc=all.find((c:any)=>c.id===heroCase.id)
  const a=await viaBuilder(hc,pirate,{kit:['dagger','sword','helmet']});const idA=check(a.r);expect(a.built.outcome).toBe('crew')
  expect(check(await victim.from('captive_proposals').select('message').eq('id',idA).single()).message).toMatch(/new Crew model "Taken Captain" with the printed Crew profile, armed with Dagger, Sword, Helmet/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:idA,p_action:'accept'}))
  expect(await heroRow()).toMatchObject({status:'retired'})
  // Henchman model 1, contest won: joins the existing Deck hands (2 -> 3 models, one more sword).
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:h1.id,p_d6:6}))
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:h1.id,p_dice:[5,5]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:h1.id,p_dice:[1,1]}))
  const b=await viaBuilder((await cases()).find((c:any)=>c.id===h1.id),pirate,{joinGroupId:crew});const idB=check(b.r);expect(b.built.outcome).toBe('crew')
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:idB,p_action:'accept'}))
  expect(check(await admin.from('henchman_groups').select('size').eq('id',crew).single()).size).toBe(3)
  expect(check(await admin.from('items').select('quantity').eq('id',crewSword).single()).quantity).toBe(3)
  // Henchman model 3, contest lost: a Swabbie with the Warriors' profile and one sword to the stash.
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:h3.id,p_d6:4}))
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:h3.id,p_dice:[1,1]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:h3.id,p_dice:[6,6]}))
  const s3=await viaBuilder((await cases()).find((c:any)=>c.id===h3.id),pirate,{});const idC=check(s3.r);expect(s3.built.outcome).toBe('swabbie')
  expect(check(await victim.from('captive_proposals').select('message').eq('id',idC).single()).message).toMatch(/becomes a Swabbie .* keeping his own profile and skills \[\]; no experience, no magic\. 1 item\(s\) from the fallen henchman go to the stash/)
  check(await victim.rpc('respond_captive_proposal',{p_proposal_id:idC,p_action:'accept'}))
  const groups=await pirateGroups()
  expect(groups.map((g:any)=>[g.unit_type_rules_id,g.size])).toEqual([['pirates_crew',3],['pirates_crew',1],['pirates_swabbie',1]])
  expect(groups[2]).toMatchObject({stats:warriorStats,campaign_state:{inheritedSkillIds:[]}})
  expect(check(await admin.from('items').select('item_rules_id,quantity').eq('warband_id',pw).eq('holder_type','stash'))).toEqual([{item_rules_id:'sword',quantity:1}])
 })

 it('snapshots each lost model with his real share of the group kit (two swords each), and flags uneven allocations',async()=>{
  // Two Marksmen with two swords each; one dies (roll 1), the report removes two swords.
  const pair=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Pair',unit_type_rules_id:'mercenaries_reikland_marksmen',size:2,stats:warriorStats,xp:0}).select('id').single()).id
  const pairSwords=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:pair,item_rules_id:'sword',quantity:4,notes:'Cutlasses'}).select('id').single()).id
  // Three Swordsmen with three shields; two die but the player recorded three shields lost: uneven.
  const trio=check(await admin.from('henchman_groups').insert({warband_id:vw,name:'Trio',unit_type_rules_id:'mercenaries_reikland_swordsmen',size:3,stats:warriorStats,xp:0}).select('id').single()).id
  const trioShields=check(await admin.from('items').insert({warband_id:vw,holder_type:'group',holder_id:trio,item_rules_id:'shield',quantity:3}).select('id').single()).id
  check(await victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
   injuries:[{subjectType:'group',subjectId:pair,subjectName:'Pair',rolls:[1,5],dead:1,equipmentLost:[{sourceItemId:pairSwords,quantity:2}]},{subjectType:'group',subjectId:trio,subjectName:'Trio',rolls:[2,1,4],dead:2,equipmentLost:[{sourceItemId:trioShields,quantity:3}]}],
   applied:{heroes:[],groups:[{id:pair,patch:{size:1}},{id:trio,patch:{size:1}}],item_patches:[{id:pairSwords,quantity:2},{id:trioShields,quantity:0}]}}}))
  check(await filePirates('won'))
  const opened=await cases()
  const pairCase=opened.find((c:any)=>c.hero_id===pair),trioCases=opened.filter((c:any)=>c.hero_id===trio)
  expect(pairCase.model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:2,lost:2,notes:'Cutlasses'})])
  expect(pairCase.model_snapshot.kit_unresolved).toBe(false)
  expect(trioCases).toHaveLength(2);expect(trioCases[0].model_snapshot.kit_unresolved).toBe(true)
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:pairCase.id,p_d6:6}))
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:pairCase.id,p_dice:[1,1]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:pairCase.id,p_dice:[6,6]}))
  const swabbie=(items:unknown[])=>[{table:'henchman_groups',op:'insert',id:G,data:{name:'Pressed marksman',unit_type_rules_id:'pirates_swabbie',size:1,stats:warriorStats,xp:0,level_ups:0,stat_increases:{},model_names:[],campaign_state:{inheritedSkillIds:[]}}},...items]
  expect((await propose(pirate,pairCase.id,choice('swabbie',[1,1],[6,6]),[],swabbie([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:1}}]))).error?.message).toMatch(/own share of kit may be kept \(Sword ×2\)/)
  check(await propose(pirate,pairCase.id,choice('swabbie',[1,1],[6,6]),[],swabbie([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'sword',quantity:2,notes:'Cutlasses'}}])))
  // The uneven trio: recovered, but no equipment may be claimed automatically.
  check(await pirate.rpc('record_kidnap_recovery',{p_case_id:trioCases[0].id,p_d6:6}))
  check(await pirate.rpc('record_kidnap_dice',{p_case_id:trioCases[0].id,p_dice:[1,1]}));check(await victim.rpc('record_kidnap_dice',{p_case_id:trioCases[0].id,p_dice:[6,6]}))
  const G2='22222222-2222-4222-8222-cccccccccccc'
  const swabbie2=(items:unknown[])=>[{...(swabbie([])[0] as Record<string,unknown>),id:G2},...items]
  expect((await propose(pirate,trioCases[0].id,{...choice('swabbie',[1,1],[6,6]),groupId:G2,crew:{groupId:G2,size:0,stats:crewStats,skillIds:[]}},[],swabbie2([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'shield',quantity:1}}]))).error?.message).toMatch(/not recorded evenly/)
  // The victim's player records what each fallen model carried, bounded by the three shields the report removed.
  expect((await pirate.rpc('allocate_kidnap_kit',{p_case_id:trioCases[0].id,p_items:[{id:trioShields,quantity:2}],p_reason:'He carried two'})).error?.message).toMatch(/fallen henchman's player or the campaign GM/)
  expect((await victim.rpc('allocate_kidnap_kit',{p_case_id:trioCases[0].id,p_items:[{id:trioShields,quantity:4}],p_reason:'He carried them all'})).error?.message).toMatch(/removed only 3 of shield/)
  check(await victim.rpc('allocate_kidnap_kit',{p_case_id:trioCases[0].id,p_items:[{id:trioShields,quantity:2}],p_reason:'He carried two of the three shields'}))
  expect((await victim.rpc('allocate_kidnap_kit',{p_case_id:trioCases[1].id,p_items:[{id:trioShields,quantity:2}],p_reason:'He also had two'})).error?.message).toMatch(/other lost models already account for 2/)
  check(await victim.rpc('allocate_kidnap_kit',{p_case_id:trioCases[1].id,p_items:[{id:trioShields,quantity:1}],p_reason:'The last shield was his'}))
  expect((await victim.rpc('allocate_kidnap_kit',{p_case_id:trioCases[1].id,p_items:[{id:trioShields,quantity:0}],p_reason:'Second thoughts'})).error?.message).toMatch(/already recorded/)
  const [t0]=(await cases()).filter((c:any)=>c.id===trioCases[0].id);expect(t0.model_snapshot).toMatchObject({kit_unresolved:false,allocation:{reason:'He carried two of the three shields'}});expect(t0.model_snapshot.items[0].quantity).toBe(2)
  expect((await propose(pirate,trioCases[0].id,{...choice('swabbie',[1,1],[6,6]),groupId:G2,crew:{groupId:G2,size:0,stats:crewStats,skillIds:[]}},[],swabbie2([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'shield',quantity:1}}]))).error?.message).toMatch(/own share of kit may be kept \(Shield ×2\)/)
  check(await propose(pirate,trioCases[0].id,{...choice('swabbie',[1,1],[6,6]),groupId:G2,crew:{groupId:G2,size:0,stats:crewStats,skillIds:[]}},[],swabbie2([{table:'items',op:'insert',data:{holder_type:'stash',item_rules_id:'shield',quantity:2}}])))
 })

 it('a report without casualty kit accounting leaves the share unresolved rather than inferring it from the row totals',async()=>{
  check(await fileVictim({heroCaptured:false,henchmenLost:true,unaccounted:true}));check(await filePirates('won'))
  const [c]=await cases()
  expect(c.model_snapshot.kit_unresolved).toBe(true)
  expect(c.model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:null,lost:2})])
  check(await victim.rpc('allocate_kidnap_kit',{p_case_id:c.id,p_items:[{id:warriorSwords,quantity:1}],p_reason:'One sword each, nothing was spent'}))
  expect((await cases())[0].model_snapshot.items[0].quantity).toBe(1)
 })

 it('a dead model never claims the kit a forced-captured comrade took with him',async()=>{
  // Three Warriors with three swords: one dies (survival 1), one is captured by the Pirate captain's Subjugator event.
  const captain=check(await admin.from('heroes').select('id').eq('warband_id',pw).eq('unit_type_rules_id','pirates_captain').single()).id
  const ev=check(await admin.from('battle_events').insert({match_id:match,actor_id:users[1],actor_warband_id:pw,at:'2026-09-12T18:00:00Z',kind:'attack',summary:'capture',payload:{attacker_warband_id:pw,attacker_id:captain,attacker_kind:'hero',attacker_name:'Captain Redbeard',target_warband_id:vw,target_id:warriors,target_kind:'group',target_name:'Warriors',target_size:3,wounds_lost:1,out_of_action:true,kill:false,outcome:'Out of action',turn:2,capture_reason:'subjugator'}}).select('id').single()).id
  check(await victim.rpc('submit_battle_report',{p_match_id:match,p_warband_id:vw,p_report:{result:'lost',ooa:[],
   injuries:[{subjectType:'group',subjectId:warriors,subjectName:'Warriors',rolls:[1],dead:1,equipmentLost:[{sourceItemId:warriorSwords,quantity:2}],captured:[{modelIndex:1,eventId:ev,captorWarbandId:pw,reason:'subjugator',kit:[{sourceItemId:warriorSwords,itemId:'sword',quantity:1}]}]}],
   applied:{heroes:[],groups:[{id:warriors,patch:{size:1}}],item_patches:[{id:warriorSwords,quantity:1}]}}}))
  check(await filePirates('won'))
  const all=await cases();expect(all.map((c:any)=>[c.source,c.model_index])).toEqual([['forced_capture',1],['pirates_kidnapped',1]])
  const pirateCase=all.find((c:any)=>c.source==='pirates_kidnapped')
  expect(pirateCase.model_snapshot.items).toEqual([expect.objectContaining({item_rules_id:'sword',quantity:1,lost:1})]);expect(pirateCase.model_snapshot.kit_unresolved).toBe(false)
  await admin.from('battle_events').delete().eq('id',ev)
 })
})
