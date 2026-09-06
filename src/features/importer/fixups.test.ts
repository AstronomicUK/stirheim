import { describe, expect, it } from 'vitest'
import type { AppliedInjury, WarriorFlags } from '../../rules/types/roster'
import { describeFixup, fixupChanges, planHeroFixup, unmatchedNames } from './fixups'

const hero = (over: Partial<Parameters<typeof planHeroFixup>[0]> = {}) => ({ id: 'h1', name: 'Magus', notes: '', skills: [] as string[], spells: [] as string[], injuries: [] as never[], flags: {}, ...over })

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
  const hurt = (injuries: AppliedInjury[], flags: WarriorFlags = {}) => ({ id: 'h1', name: 'Bill', notes: '', skills: [] as string[], spells: [] as string[], injuries, flags })

  it('renames a stored Madness to what its follow-up die actually gave', () => {
    const plan = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 24, subRoll: 5 }, effect: 'Frenzy' }]))
    // The line on the sheet is what Frenzy does, not that he has it.
    expect(plan?.injuries?.[0]?.name).toBe('Frenzy')
    expect(plan?.injuries?.[0]?.effect).toMatch(/double his Attacks in hand-to-hand/)

    const stupid = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 24, subRoll: 1 }, effect: 'Stupidity' }]))
    expect(stupid?.injuries?.[0]).toMatchObject({ name: 'Stupidity' })
  })

  it('reads an imported injury, which kept no dice, from the condition the importer set', () => {
    // Bill came in as "Madness" with frenzy already flagged: that is which way it fell.
    const bill = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 0 }, effect: 'Roll again: ...' }], { frenzy: true }))
    expect(bill?.injuries?.[0]?.name).toBe('Frenzy')
    expect(bill?.injuries?.[0]?.effect).toMatch(/must charge any enemy within charge range/)

    // With neither a die nor a flag there is nothing to go on, so it is left as it is.
    const unknown = planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Madness', rolled: { d66: 0 }, effect: 'Madness: the follow-up roll was not recorded, so which outcome he got is unknown.' }]))
    expect(unknown).toBeNull()
  })

  it('leaves alone an injury already named for its outcome, or with nothing to correct', () => {
    expect(planHeroFixup(hurt([{ injuryCode: 'madness', name: 'Frenzy', rolled: { d66: 24, subRoll: 5 }, effect: 'x' }]))).toBeNull()
    expect(planHeroFixup(hurt([{ injuryCode: 'leg_wound', name: 'Leg Wound', rolled: { d66: 22 }, effect: '-1 Movement' }]))).toBeNull()
  })

  it('does not report a change when the tidy-up would rewrite an injury to what it already says', () => {
    // The old fallback text began "Roll again:" and rewrote itself to the same string on every
    // visit, which left a success notice on the roster for good.
    const settled = { injuryCode: 'madness', name: 'Madness', rolled: { d66: 0 }, effect: 'Roll again: (the follow-up roll was not recorded)' }
    const first = planHeroFixup(hurt([settled]))
    expect(first?.injuries?.[0].effect).not.toMatch(/^Roll again:/)
    expect(planHeroFixup(hurt([first!.injuries![0]]))).toBeNull()
  })
})
