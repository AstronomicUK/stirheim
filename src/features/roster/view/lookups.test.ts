import { describe, expect, it } from 'vitest'
import { flagTags, skillName, skillOptionsFor, skillTableName, spellName, statusLabel, xpProgress } from './lookups'

describe('xpProgress', () => {
  it('reports the band a hero sits in and advances owed', () => {
    const p = xpProgress(9, 4, 'hero')
    expect(p.previous).toBe(8)
    expect(p.next).toBe(11)
    expect(p.advancesOwed).toBe(0)
    expect(p.fraction).toBeCloseTo(1 / 3)
  })

  it('counts boxes crossed but not yet taken', () => {
    expect(xpProgress(12, 3, 'hero').advancesOwed).toBe(2)
    expect(xpProgress(5, 0, 'henchman').advancesOwed).toBe(2)
  })

  it('has no next box once the sheet runs out', () => {
    const p = xpProgress(95, 21, 'hero')
    expect(p.next).toBeNull()
    expect(p.fraction).toBe(1)
  })

  it('starts at zero for a fresh recruit', () => {
    const p = xpProgress(0, 0, 'henchman')
    expect(p).toMatchObject({ previous: 0, next: 2, advancesOwed: 0, fraction: 0 })
  })
})

describe('names', () => {
  it('resolves core and warband skills, falling back to the id', () => {
    expect(skillName('strike_to_injure')).toBe('Strike to Injure')
    expect(skillName('sisters_of_sigmar_skills_sign_of_sigmar')).toBe('Sign of Sigmar')
    expect(skillName('made_up')).toBe('made_up')
  })

  it('names skill tables', () => {
    expect(skillTableName('combat')).toBe('Combat')
    expect(skillTableName('sisters_of_sigmar_skills')).toBe('Sisters of Sigmar Skill Table')
    expect(skillTableName('unknown_table')).toBe('unknown_table')
  })

  it('lists skill options for the tables a hero has', () => {
    const options = skillOptionsFor(['combat', 'sisters_of_sigmar_skills'])
    expect(options.some((o) => o.id === 'strike_to_injure' && o.group === 'Combat')).toBe(true)
    expect(options.some((o) => o.id === 'sisters_of_sigmar_skills_sign_of_sigmar')).toBe(true)
    expect(options.some((o) => o.group === 'Shooting')).toBe(false)
  })

  it('resolves spells', () => {
    expect(spellName('singing_wind')).toBe('Singing Wind')
    expect(spellName('nope')).toBe('nope')
  })
})

describe('tags', () => {
  it('turns flags into short labels', () => {
    expect(flagTags({})).toEqual([])
    expect(flagTags({ missNextGames: 1, oldBattleWound: true, hates: 'Skaven' })).toEqual([
      'Misses next game',
      'Old battle wound',
      'Hates Skaven',
    ])
    expect(flagTags({ missNextGames: 2 })).toEqual(['Misses next 2 games'])
  })

  it('labels every non-active status', () => {
    expect(statusLabel('active')).toBeNull()
    expect(statusLabel('dead')).toBe('Dead')
    expect(statusLabel('left')).toBe('Left')
  })
})
