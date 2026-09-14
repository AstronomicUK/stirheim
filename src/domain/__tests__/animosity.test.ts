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
