import { describe, expect, it } from 'vitest'
import type { AppliedInjury } from '../../rules/types/roster'
import { describeFixup, fixupChanges, planHeroFixup, unmatchedNames } from './fixups'

const hero = (over: Partial<Parameters<typeof planHeroFixup>[0]> = {}) => ({ id: 'h1', name: 'Magus', notes: '', skills: [] as string[], spells: [] as string[], injuries: [] as never[], ...over })

describe('imported roster fix-ups', () => {
  it('reads the names left to check', () => {
    expect(unmatchedNames('Skills/spells to check: Frostbolts, Geyser.')).toEqual(['Frostbolts', 'Geyser'])
    expect(unmatchedNames('Veteran of the Stir\nSkills/spells to check: Crows Feast.\nMore notes')).toEqual(['Crows Feast'])
    expect(unmatchedNames('nothing here')).toEqual([])
  })

  it("matches today's spells and skills, keeps what is still unknown, and tidies the note", () => {
    const plan = planHeroFixup(hero({ notes: 'Skills/spells to check: Frostbolts, Geyser, Made Up Spell, Step Aside.' }))!
    expect(plan.spellIds).toEqual(['frostbolts', 'geyser'])
    expect(plan.skillIds).toEqual(['step_aside'])
    expect(plan.stillUnknown).toEqual(['Made Up Spell'])
    expect(plan.notes).toBe('Skills/spells to check: Made Up Spell.')
    expect(describeFixup(plan)).toBe('Magus: 2 spells, 1 skill (still unknown: Made Up Spell)')
    const changes = fixupChanges([plan], [hero({ spells: ['lifespring'] })])
    expect(changes).toEqual([{ table: 'heroes', op: 'update', id: 'h1', data: { notes: 'Skills/spells to check: Made Up Spell.', skills: ['step_aside'], spells: ['lifespring', 'frostbolts', 'geyser'] } }])
  })

  it('re-derives an injury whose effect was the chart text, and does nothing when nothing changes', () => {
    const madness = { injuryCode: 'madness', name: 'Madness', rolled: { d66: 0 }, effect: 'Roll again:\n- 1-3 = stupidity.\n- 4-6 = frenzy.' }
    const plan = planHeroFixup(hero({ injuries: [madness] as never[] }))!
    expect(plan.injuries?.[0].effect).toMatch(/not recorded/)
    expect(planHeroFixup(hero({ notes: 'All matched already.', spells: ['frostbolts'] }))).toBeNull()
    expect(planHeroFixup(hero({ notes: 'Skills/spells to check: Nonsense Only.' }))).toBeNull()
  })
})

describe('injuries recorded before the outcome was the thing recorded', () => {
  const hurt = (injuries: AppliedInjury[]) => ({ id: 'h1', name: 'Bill', notes: '', skills: [] as string[], spells: [] as string[], injuries })

  it('renames a stored Madness to what its follow-up die actually gave', () => {
    const plan = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 24, subRoll: 5 }, effect: 'Frenzy' }]))
    expect(plan?.injuries?.[0]).toMatchObject({ name: 'Frenzy', effect: 'The warrior suffers from frenzy from now on.' })

    const stupid = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 24, subRoll: 1 }, effect: 'Stupidity' }]))
    expect(stupid?.injuries?.[0]).toMatchObject({ name: 'Stupidity' })
  })

  it('leaves alone an injury already named for its outcome, or with no follow-up die kept', () => {
    expect(planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Frenzy', rolled: { d66: 24, subRoll: 5 }, effect: 'x' }]))).toBeNull()
    expect(planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 24 }, effect: 'x' }]))).toBeNull()
    expect(planHeroFixup(hurt([{ injuryCode: 'leg_wound', name: 'Leg Wound', rolled: { d66: 22 }, effect: '-1 Movement' }]))).toBeNull()
  })
})
