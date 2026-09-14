import {it,expect} from 'vitest'
import {makeHero,makeWarband,makeHenchmanGroup} from '../../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import {findLore} from '../../../rules/data/campaign/magic'
import {casterProfile} from '../../../rules/resolve/casting'
import {reportAppliedSchema} from '../../../domain/report'
import {deriveReport} from './derive'
import {emptyDraft} from './state'
import {applyEyeOfGods,eyeOfGodsState,eyeThreshold,allowedChaosMarks} from './eyeOfGods'
import type {ReportApplied} from '../../../domain/report'
const leader=makeHero({id:'11111111-1111-4111-8111-111111111111',unitTemplateId:'marauders_chieftain',name:'Chief',equipment:[]})
const roster=makeWarband({warbandTemplateId:'marauders_of_chaos',marauderTribe:'kurgan',heroes:[leader],henchmenGroups:[],hiredSwords:[]})
const ctx={roster,template:findWarbandTemplate(roster.warbandTemplateId),items:[],matchId:'m',myRating:100,opponentRating:100}
const spawn='22222222-2222-4222-8222-222222222222'
const draft={...emptyDraft(),result:'lost' as const,chaosAftermath:{dice:[6,6] as [number,number],spawnIds:{[leader.id]:spawn}}}
const applied=():ReportApplied=>({heroes:[],groups:[],warband:{gold_delta:0,wyrdstone_delta:0,veteran_pool:null},pending_advances:[],stash_items:[],item_patches:[],remove_item_ids:[]})
it('uses all tribe and Tattooed Body thresholds',()=>{
 expect(['norse','kurgan','hung'].map(t=>eyeThreshold(t,leader))).toEqual([13,12,12])
 expect(['norse','kurgan','hung'].map(t=>eyeThreshold(t,{...leader,skillIds:['marauders_of_chaos_skills_tattooed_body']}))).toEqual([11,10,10])
 expect(eyeOfGodsState(draft,{...ctx,roster:{...roster,marauderTribe:'norse'}}).outcome).toBe('none')
})
it('does not test an absent leader or replace him with a temporary participant',()=>{
 const other=makeHero({id:'other',unitTemplateId:'marauders_champion'})
 expect(eyeOfGodsState(draft,{...ctx,roster:{...roster,heroes:[{...leader,flags:{missNextGames:1}},other]}}).due).toBe(false)
})
it('distinguishes an initial Seer Mark from one earned through Eye of the Gods',()=>{
 const seer={...leader,unitTemplateId:'marauders_seer',flags:{leaderRoleId:'marauders_chieftain',chaosMark:'crow'}}
 const seerCtx={...ctx,roster:{...roster,heroes:[seer]}}
 expect(eyeOfGodsState(draft,seerCtx).due).toBe(true)
 expect(allowedChaosMarks(seerCtx,seer).map(m=>m.id)).toEqual(['crow'])
 expect(eyeOfGodsState(draft,{...seerCtx,roster:{...seerCtx.roster,heroes:[{...seer,flags:{...seer.flags,eyeOfGodsMarked:true}}]}}).due).toBe(false)
 expect(eyeOfGodsState(draft,{...ctx,roster:{...roster,heroes:[{...leader,flags:{chaosMark:'crow'}}]}}).due).toBe(false)
})
it('restricts competing patrons while permitting Undivided and records a declined reward',()=>{
 const local={...ctx,roster:{...roster,heroes:[leader,makeHero({id:'seer',flags:{chaosMark:'crow'}})]}}
 expect(allowedChaosMarks(local,leader).map(m=>m.id)).toEqual(['undivided','crow'])
 const result=applyEyeOfGods({...draft,result:'won',chaosAftermath:{...draft.chaosAftermath,mark:'decline'}},local,applied())
 expect(result.problems).toEqual([]);expect(result.notes.join(' ')).toContain('declines')
})
it('creates one real Spawn, destroys the old kit and pending advances, and preserves report schema',()=>{
 const out=applied();out.pending_advances=[{subject_type:'hero',subject_id:leader.id,threshold_xp:4}]
 const local={...ctx,items:[{id:'33333333-3333-4333-8333-333333333333',warband_id:roster.id,holder_type:'hero' as const,holder_id:leader.id,item_rules_id:'sword',quantity:1,custom_name:null,notes:'',created_at:'',updated_at:''}]}
 expect(applyEyeOfGods(draft,local,out).problems).toEqual([])
 expect(out.heroes[0].patch).toMatchObject({status:'retired',xp:0,skills:[],spells:[],injuries:[]})
 expect(out.new_groups).toHaveLength(1);expect(out.new_groups![0]).toMatchObject({id:spawn,unit_type_rules_id:'marauders_spawn_of_chaos',size:1,xp:0,level_ups:0})
 expect(out.item_patches[0].quantity).toBe(0);expect(out.pending_advances).toEqual([])
 expect(reportAppliedSchema.parse(out).new_groups).toEqual(out.new_groups)
})
it('does not create a second Spawn and does not resurrect a dead leader',()=>{
 const out=applied();const local={...ctx,roster:{...roster,henchmenGroups:[makeHenchmanGroup({unitTemplateId:'marauders_spawn_of_chaos',size:1})]}}
 expect(applyEyeOfGods(draft,local,out).notes.join(' ')).toContain('already has a Spawn')
 expect(out.new_groups).toBeUndefined();expect(out.heroes[0].patch.status).toBe('retired')
 const dead=applied();dead.heroes=[{id:leader.id,patch:{status:'dead'}}]
 applyEyeOfGods(draft,ctx,dead);expect(dead.new_groups).toBeUndefined();expect(dead.heroes[0].patch.status).toBe('dead')
})
it('persists the winning Mark and applies its permanent change only in the report transaction',()=>{
 const out=applied();const result=applyEyeOfGods({...draft,result:'won',chaosAftermath:{dice:[6,6],mark:'crow'}},ctx,out)
 expect(result.problems).toEqual([]);expect(out.heroes[0].patch.flags).toMatchObject({chaosMark:'crow',eyeOfGodsMarked:true});expect(out.heroes[0].patch.stats!.T).toBe(leader.stats.T+1)
 const again=applied();applyEyeOfGods({...draft,result:'won'}, {...ctx,roster:{...roster,heroes:[{...leader,flags:out.heroes[0].patch.flags!}]}},again);expect(again.heroes).toEqual([])
})
it('grants a random Tchar spell and its novice penalty, with app edits retained',()=>{
 const out=applied();const result=applyEyeOfGods({...draft,result:'won',chaosAftermath:{dice:[6,6],originalDice:[5,6],mark:'eagle',spellDie:2,originalSpellDie:1}},ctx,out)
 expect(result.problems).toEqual([]);expect(result.notes.join(' ')).toContain('player changed to 6 + 6')
 const hero={...leader,flags:out.heroes[0].patch.flags!,spellIds:out.heroes[0].patch.spells!}
 expect(hero.spellIds).toContain(findLore('tchar_rituals')!.spells[1].id)
 expect(casterProfile({hero})!.modifiers.find(m=>m.id==='eye_of_gods_novice')?.amount).toBe(-1)
})
it('checks Condemned Fate separately, including reaching 90 this report',()=>{
 const condemned=makeHero({id:'44444444-4444-4444-8444-444444444444',unitTemplateId:'marauders_condemned',xp:89})
 const local={...ctx,roster:{...roster,heroes:[condemned]}}
 const out=applied();out.heroes=[{id:condemned.id,patch:{xp:90}}]
 expect(applyEyeOfGods({...draft,chaosAftermath:{}},local,out).problems.join(' ')).toContain('confirm whether all variable attributes')
 const fixed=structuredClone(out);expect(applyEyeOfGods({...draft,chaosAftermath:{condemnedFixed:{[condemned.id]:true}}},local,fixed).problems).toEqual([])
 expect(fixed.heroes[0].patch.flags?.condemnedAttributesFixed).toBe(true);expect(fixed.new_groups).toBeUndefined()
 const variable=structuredClone(out);expect(applyEyeOfGods({...draft,chaosAftermath:{condemnedFixed:{[condemned.id]:false},spawnIds:{[condemned.id]:spawn}}},local,variable).problems).toEqual([]);expect(variable.new_groups).toHaveLength(1)
})
it('requires valid dice, a recorded tribe and a stable transformation identity',()=>{
 expect(applyEyeOfGods({...draft,chaosAftermath:{}},ctx,applied()).problems).toContain('Roll both Eye of the Gods dice.')
 expect(applyEyeOfGods({...draft,chaosAftermath:{dice:[6,6]}},ctx,applied()).problems.join(' ')).toContain('confirm the transformation')
 expect(applyEyeOfGods(draft,{...ctx,roster:{...roster,marauderTribe:undefined}},applied()).problems.join(' ')).toContain('Choose the Marauder tribe')
})

it('runs through the full report derivation without a second legacy kit roll or lost Spawn insertion',()=>{
 const complete={...draft,exploration:{...draft.exploration,rolls:[3]}}
 const result=deriveReport(complete,ctx)
 expect(result.report,JSON.stringify(result.problems)).not.toBeNull()
 expect(result.report!.applied.new_groups).toHaveLength(1)
 expect(result.kit.prompts.some(p=>p.prompt.key==='eye_of_the_gods')).toBe(false)
 expect(result.report!.notes).toContain('replaced by a Spawn')
 const legacy={...complete,chaosAftermath:{spawnIds:{[leader.id]:spawn}},kit:{[`rule:eye_of_the_gods:${leader.id}`]:[6,6]}}
 expect(deriveReport(legacy,ctx).report!.applied.new_groups).toHaveLength(1)
})

it('keeps a newly earned final advance reachable before a Condemned transformation',()=>{
 const condemned=makeHero({id:'44444444-4444-4444-8444-444444444444',unitTemplateId:'marauders_condemned',xp:89})
 const local={...ctx,roster:{...roster,heroes:[condemned]}}
 const result=deriveReport({...draft,chaosAftermath:{condemnedFixed:{[condemned.id]:false},spawnIds:{[condemned.id]:spawn}},exploration:{...draft.exploration,rolls:[3]}},local)
 expect(result.problems.advances.length).toBeGreaterThan(0)
 expect(result.advances.items.some(i=>i.request.subject_id===condemned.id&&!i.complete)).toBe(true)
 expect(result.report).toBeNull()
})
