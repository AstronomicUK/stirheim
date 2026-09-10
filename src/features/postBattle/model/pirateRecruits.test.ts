import { describe, expect, it } from 'vitest'
import { makeHero, makeHenchmanGroup, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { ItemRow } from '../../../domain'
import { deriveReport, type ReportContext } from './derive'
import { emptyDraft, setExplorationRolls, type PirateRecruitDraft } from './state'
const ids = ['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003']
function context(gold=100, size=2): ReportContext {
  const heroes=ids.map((id,i)=>makeHero({id,name:`Pirate ${i}`,unitTemplateId:i===0?'pirates_captain':'pirates_mate',xp:20,levelUps:8}))
  return {roster:makeWarband({warbandTemplateId:'pirates',heroes,henchmenGroups:[makeHenchmanGroup({id:'crew',name:'Veteran Crew',unitTemplateId:'pirates_crew',size})],gold}),template:findWarbandTemplate('pirates'),items:[{id:'swords',warband_id:'warband-1',holder_type:'group',holder_id:'crew',item_rules_id:'sword',custom_name:null,quantity:size}] as ItemRow[],matchId:ids[0],myRating:100,opponentRating:100,scenarioId:'skirmish'}
}
function run(choice: PirateRecruitDraft | undefined, rolls=[3,3,3], ctx=context()) {
  const draft=emptyDraft();draft.result='lost';draft.exploration.rolls=rolls;draft.exploration.pirateRecruits=choice
  return deriveReport(draft,ctx)
}
const person=(i=0,rolls:[number,number]=[2,2],destination='new')=>({id:ids[i],rolls,destination})
describe('Pirate exploration recruitment',()=>{
  it('replaces prisoner gold and Straggler help only when the optional route is selected',()=>{
    expect(run(undefined).exploration.gold.expressions).toEqual(['2D6'])
    expect(run({count:1,people:[person()]}).exploration.gold.expressions).toEqual([])
    expect(run(undefined,[4,4,1]).exploration.record?.benefits).toEqual(['straggler'])
    expect(run({people:[person()]},[4,4,1]).exploration.record?.benefits).toBeUndefined()
  })
  it('records failed Straggler tests without creating a recruit',()=>{
    const result=run({people:[person(0,[6,6])]},[4,4,1]).recruits
    expect(result.newGroups).toEqual([]);expect(result.problems).toEqual([]);expect(result.notes.join()).toContain('failed. No recruit')
  })
  it('makes a Swabbie after a successful Straggler test',()=>{
    const result=run({people:[person()]},[4,4,1]).recruits
    expect(result.newGroups[0]).toMatchObject({unit_type_rules_id:'pirates_swabbie',size:1,xp:0});expect(result.goldCost).toBe(0)
  })
  it('requires separate tests and obeys new Crew versus failed-test Swabbie outcomes',()=>{
    const result=run({count:3,people:[person(0),person(1,[6,6]),person(2)]}).recruits
    expect(result.newGroups.map(g=>g.unit_type_rules_id)).toEqual(['pirates_crew','pirates_swabbie','pirates_crew']);expect(result.awardedItems).toHaveLength(3);expect(result.problems).toEqual([])
    expect(run({count:2,people:[person()]}).recruits.problems.join()).toContain('both Leadership dice')
  })
  it('adds matching kit without a hire or veteran fee, accumulating multiple recruits',()=>{
    const result=run({count:2,people:[person(0,[2,2],'crew'),person(1,[2,2],'crew')]}).recruits
    expect(result.goldCost).toBe(20);expect(result.groupPatches).toEqual([{id:'crew',patch:{size:4}}]);expect(result.itemPatches).toEqual([{id:'swords',quantity:4}])
  })
  it('converts a successful prisoner to a Swabbie when matching kit is unaffordable',()=>{
    const result=run({count:2,people:[person(0,[2,2],'crew'),person(1,[2,2],'crew')]},[3,3,3],context(10)).recruits
    expect(result.goldCost).toBe(10);expect(result.groupPatches[0].patch.size).toBe(3);expect(result.newGroups[0].unit_type_rules_id).toBe('pirates_swabbie');expect(result.itemPatches[0].quantity).toBe(3)
  })
  it('respects group and Swabbie limits, with an explicit release choice',()=>{
    expect(run({count:1,people:[person(0,[2,2],'crew')]},[3,3,3],context(100,5)).recruits.problems.join()).toContain('five models')
    expect(run({count:3,people:[person(0,[6,6]),person(1,[6,6]),person(2,[6,6])]}).recruits.problems.join()).toContain('more Swabbies')
    expect(run({count:3,people:[person(0,[6,6]),person(1,[6,6]),person(2,[6,6],'release')]}).recruits.problems).toEqual([])
  })
  it('requires a reason for adjusted Leadership and ignores stale prisoner answers after changing exploration',()=>{
    expect(run({count:1,leadership:10,people:[person()]}).recruits.problems.join()).toContain('Explain')
    const d=emptyDraft();d.exploration.pirateRecruits={count:1,people:[person()]}
    expect(setExplorationRolls(d,[1,2,3]).exploration.pirateRecruits).toBeUndefined()
  })
})
