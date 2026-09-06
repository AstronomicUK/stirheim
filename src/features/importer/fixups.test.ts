import { describe, expect, it } from 'vitest'
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
