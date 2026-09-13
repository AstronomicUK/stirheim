import { describe, expect, it } from 'vitest'
import { makeHero, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { deriveReport, type ReportContext } from './derive'
import { emptyDraft, setExplorationRolls } from './state'
const heroes = ['a','b','c'].map((id, index) => makeHero({id,name:`Dwarf ${index}`,unitTemplateId:index ? 'black_dwarfs_gaoler' : 'black_dwarfs_sorcerer',xp:20,levelUps:8}))
const context: ReportContext = {roster:makeWarband({warbandTemplateId:'black_dwarfs',heroes}),template:findWarbandTemplate('black_dwarfs'),items:[],matchId:'match',myRating:100,opponentRating:100,scenarioId:'skirmish',engineAvailable:true}
function draft(rolls = [3,3,3]) {const d=emptyDraft(); d.result='lost'; d.exploration.rolls=rolls; return d}
describe('Engine exploration rewards', () => {
  it('replaces Straggler insight with one recorded captive while an Engine is present', () => {
    const result=deriveReport(draft([4,4,1]),context)
    expect(result.exploration.record?.enginePrisoners).toEqual({count:1,originalRoll:null,maximumFinds:false})
    expect(result.exploration.record?.benefits).toBeUndefined()
    expect(result.recruits.kind).toBeNull()
    expect(result.exploration.record?.notes.join(' ')).toContain('one captive found')
  })
  it('requires a prisoner D3, preserves its edit and grants no extra gold or human recruit', () => {
    expect(deriveReport(draft(),context).problems.exploration.join(' ')).toContain('roll D3')
    const d=draft(); d.exploration.enginePrisonerRoll=3; d.exploration.enginePrisonerOriginalRoll=1; d.exploration.gold=12
    const result=deriveReport(d,context)
    expect(result.exploration.record?.enginePrisoners).toEqual({count:3,originalRoll:1,maximumFinds:false})
    expect(result.exploration.record?.notes.join(' ')).toContain('App rolled 1; player changed it to 3')
    expect(result.exploration.gold.value).toBe(0)
    expect(result.recruits.kind).toBeNull()
  })
  it('retains the ordinary rewards when no Engine is present and ignores stale counts at other locations', () => {
    expect(deriveReport(draft(),{...context,engineAvailable:false}).exploration.gold.expressions).toEqual(['2D6'])
    expect(deriveReport(draft([4,4,1]),{...context,engineAvailable:false}).exploration.record?.benefits).toEqual(['straggler'])
    const d=draft([1,2,3]); d.exploration.enginePrisonerRoll=3
    expect(deriveReport(d,context).exploration.record?.enginePrisoners).toBeUndefined()
    expect(setExplorationRolls(d,[3,3,3]).exploration.enginePrisonerRoll).toBeNull()
  })
  it('does not silently choose ordinary rewards while the Engine query is unresolved', () => {
    expect(deriveReport(draft(),{...context,engineAvailable:undefined,engineAvailabilityError:'Checking Engine availability…'}).problems.exploration).toContain('Checking Engine availability…')
  })
})
