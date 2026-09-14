import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState, battleLiveStateSchema } from '../battle'
import { hasNormalAnimosity, animosityBlocksAction } from '../animosity'
import { beginAnimosity, currentAnimosity, saveAnimosityRoll, acceptAnimosityRoll, exemptAnimosity, correctAnimosity, resolveAnimosityAction } from '../animosityBattle'
const input = { id: 'test', warriorId: 'boyz', modelIndex: 0, name: 'Boyz model 1', turnKey: 'orcs:1', at: '2026-09-13T21:00:00Z' }
const start = () => beginAnimosity(emptyBattleLiveState(), input)
describe('standard Animosity', () => {
  it.each([1,2,3,4,5,6])('only a trigger roll of 1 causes an effect roll (%s)', die => {
    const sheet = acceptAnimosityRoll(start(), input.id, die, 'trigger')
    expect(sheet.animosityTests[0].stage).toBe(die === 1 ? 'effect' : 'done')
    expect(animosityBlocksAction(sheet.animosityTests[0], 'normal')).toBe(die === 1)
  })
  it.each([1,2,3,4,5,6])('resolves the complete result table (%s), while permitting melee defence', die => {
    const sheet = acceptAnimosityRoll(acceptAnimosityRoll(start(), input.id, 1, 'trigger'), input.id, die, 'effect')
    const test = sheet.animosityTests[0]
    expect(test.outcome).toBe(die === 1 ? 'fight' : die === 6 ? 'rush' : 'squabble')
    expect(animosityBlocksAction(test, 'normal')).toBe(true)
    expect(animosityBlocksAction(test, 'defend')).toBe(false)
    expect(animosityBlocksAction(test, 'friendlyFight')).toBe(die !== 1)
  })
  it('keeps each model and own turn separate; refresh does not lose the app roll or its later override', () => {
    let sheet = saveAnimosityRoll(start(), input.id, 2, 'trigger')
    sheet = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(sheet)))
    sheet = acceptAnimosityRoll(sheet, input.id, 1, 'trigger')
    expect(sheet.rollAttempts).toHaveLength(1)
    expect(sheet.rollAttempts[0].rolls.join(' ')).toContain('Player changed app roll 2 to 1')
    expect(currentAnimosity(sheet, 'boyz', 1, 'orcs:1')).toBeUndefined()
    expect(currentAnimosity(sheet, 'boyz', 0, 'orcs:2')).toBeUndefined()
    expect(acceptAnimosityRoll(sheet, input.id, 1, 'trigger')).toBe(sheet)
  })
  it('permits recorded combat/pole exemptions and preserves corrected rolls', () => {
    expect(() => exemptAnimosity(start(), input.id, '')).toThrow()
    const exempt = exemptAnimosity(start(), input.id, 'Already engaged in combat at the start of this turn')
    expect(animosityBlocksAction(exempt.animosityTests[0], 'normal')).toBe(false)
    const corrected = correctAnimosity(exempt, input.id, 'Picked the wrong group member')
    expect(currentAnimosity(corrected, 'boyz', 0, 'orcs:1')).toBeUndefined()
    expect(corrected.rollAttempts[0].rolls.join(' ')).toContain('Picked the wrong group member')
  })
  it('consumes the forced friendly fight once, while allowing subsequent defence', () => {
    let sheet = acceptAnimosityRoll(acceptAnimosityRoll(start(), input.id, 1, 'trigger'), input.id, 1, 'effect')
    sheet = resolveAnimosityAction(sheet, input.id, 'Friendly fight resolved')
    expect(animosityBlocksAction(sheet.animosityTests[0], 'friendlyFight')).toBe(true)
    expect(animosityBlocksAction(sheet.animosityTests[0], 'normal')).toBe(true)
    expect(animosityBlocksAction(sheet.animosityTests[0], 'defend')).toBe(false)
    expect(resolveAnimosityAction(sheet, input.id, 'Duplicate')).toBe(sheet)
  })
  it('recognises Brave removal and does not invent a ruling for conflicting Black Orc text', () => {
    expect(hasNormalAnimosity('forest_goblins_brave')).toBe(true)
    expect(hasNormalAnimosity('forest_goblins_brave', true)).toBe(false)
    expect(hasNormalAnimosity('orc_mob_orc_boyz')).toBe(true)
    expect(hasNormalAnimosity('orc_mob_boss')).toBe(false)
    expect(hasNormalAnimosity('black_orcs_orc_boy')).toBe(false)
  })
})
it('permits defence before the first own-turn test and resumes normal actions after required movement', () => {
  expect(animosityBlocksAction(undefined, 'defend')).toBe(false)
  let sheet = acceptAnimosityRoll(acceptAnimosityRoll(start(), input.id, 1, 'trigger'), input.id, 6, 'effect')
  expect(animosityBlocksAction(sheet.animosityTests[0], 'normal')).toBe(true)
  sheet = resolveAnimosityAction(sheet, input.id, 'Required movement completed')
  expect(animosityBlocksAction(sheet.animosityTests[0], 'normal')).toBe(false)
})

import {chooseAnimosityRule,saveAnimosityLeadership,acceptAnimosityLeadership} from '../animosityBattle'
describe('Black Orc conflicting Animosity procedures',()=>{
 const black=()=>beginAnimosity(emptyBattleLiveState(),{...input,conflictingRule:true})
 it('requires an explicit agreement before rolling the D6 interpretation',()=>{
  expect(()=>saveAnimosityRoll(black(),input.id,1,'trigger')).toThrow('agreed')
  let sheet=chooseAnimosityRule(black(),input.id,'d6','Players use the warband-wide Annual rule.',6)
  sheet=acceptAnimosityRoll(sheet,input.id,1,'trigger')
  expect(sheet.animosityTests[0].stage).toBe('effect')
  expect(sheet.rollAttempts[0].rolls.join(' ')).toContain('Annual rule')
 })
 it('preserves app dice, the Leadership value and a changed die across a refresh',()=>{
  let sheet=chooseAnimosityRule(black(),input.id,'leadership','Players use the unit entry.',6)
  sheet=saveAnimosityLeadership(sheet,input.id,[3,4])
  sheet=battleLiveStateSchema.parse(JSON.parse(JSON.stringify(sheet)))
  expect(saveAnimosityLeadership(sheet,input.id,[1,1])).toBe(sheet)
  expect(sheet.leadershipTests).toHaveLength(1)
  expect(sheet.leadershipTests[0].kind).toBe('animosity')
  sheet=acceptAnimosityLeadership(sheet,input.id,[3,3])
  expect(sheet.leadershipTests).toHaveLength(1)
  expect(sheet.animosityTests[0]).toMatchObject({stage:'done',outcome:'clear',leadership:6,originalDice:[3,4],triggerDice:[3,3]})
  expect(sheet.rollAttempts[0].rolls.join(' ')).toContain('player changed to 3 + 3')
 })
 it('uses the same effects and action restrictions after a failed Leadership test',()=>{
  let sheet=chooseAnimosityRule(black(),input.id,'leadership','Agreed printed unit rule.',6)
  sheet=acceptAnimosityLeadership(sheet,input.id,[4,3])
  sheet=acceptAnimosityRoll(sheet,input.id,3,'effect')
  expect(animosityBlocksAction(sheet.animosityTests[0],'normal')).toBe(true)
  expect(animosityBlocksAction(sheet.animosityTests[0],'defend')).toBe(false)
 })
})
import {chooseAnimosityLeadershipReroll} from '../animosityBattle'
it('Sashimono rerolls a Black Orc Leadership test once before any effect or action, preserving both rolls',()=>{
 let s=beginAnimosity(emptyBattleLiveState(),{...input,conflictingRule:true,leadershipRerollAvailable:true})
 s=chooseAnimosityRule(s,input.id,'leadership','Agreed unit rule.',6)
 s=saveAnimosityLeadership(s,input.id,[2,2]);s=acceptAnimosityLeadership(s,input.id,[2,2])
 expect(s.animosityTests[0].stage).toBe('leadershipChoice')
 expect(animosityBlocksAction(s.animosityTests[0],'normal')).toBe(true)
 s=chooseAnimosityLeadershipReroll(s,input.id,true)
 s=battleLiveStateSchema.parse(JSON.parse(JSON.stringify(s)))
 s=saveAnimosityLeadership(s,input.id,[6,6]);s=acceptAnimosityLeadership(s,input.id,[6,6])
 expect(s.animosityTests[0]).toMatchObject({stage:'effect',firstLeadershipDice:[2,2],firstLeadershipOriginal:[2,2],triggerDice:[6,6]})
 expect(chooseAnimosityLeadershipReroll(s,input.id,true)).toBe(s)
 expect(s.leadershipTests).toHaveLength(1)
})
