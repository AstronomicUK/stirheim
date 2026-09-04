import { describe, expect, it } from 'vitest'
import { findUnitTemplate, findWarbandTemplate, WARBAND_TEMPLATES } from '../../../rules/data/warbandTemplates'
import {
  addDraftEquipment,
  addDraftGroup,
  addDraftHero,
  equipmentOptionsFor,
  newWarbandDraft,
  setDraftEquipmentCost,
  type EquipmentOption,
} from '../../../rules/resolve/builder'
import type { RosterProblem } from '../../../rules/resolve/roster'
import {
  compositionSummary,
  draftUnitCount,
  filterTemplates,
  formatAmount,
  gradeLabel,
  gradesPresent,
  groupCost,
  groupEquipmentOptions,
  groupProblems,
  groupSizeCeiling,
  heroCost,
  modelCount,
  modelRangeText,
  needsPrice,
  optionForItem,
  problemGroupKey,
  quantityOf,
  splitArchived,
  takenText,
  unitLimitReached,
} from './helpers'

const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const CAPTAIN = 'mercenaries_reikland_captain'
const CHAMPIONS = 'mercenaries_reikland_champions'
const WARRIORS = 'mercenaries_reikland_warriors'
const OPTIONS = equipmentOptionsFor(REIKLAND, CAPTAIN)

function option(name: string): EquipmentOption {
  const found = OPTIONS.find((o) => o.name === name)
  if (!found) throw new Error(`no option ${name}`)
  return found
}

describe('splitArchived', () => {
  it('separates archived rows and keeps order', () => {
    const rows = [
      { id: 'a', archived: false },
      { id: 'b', archived: true },
      { id: 'c', archived: false },
    ]
    const split = splitArchived(rows)
    expect(split.active.map((r) => r.id)).toEqual(['a', 'c'])
    expect(split.archived.map((r) => r.id)).toEqual(['b'])
  })
})

describe('grades', () => {
  it('labels every grade plainly', () => {
    expect(gradeLabel('core')).toBe('Core rulebook')
    expect(gradeLabel('1a')).toBe('Grade 1a')
    expect(gradeLabel('variant')).toBe('Variants')
  })

  it('lists only the grades in the data, in order', () => {
    expect(gradesPresent([{ grade: '2a' }, { grade: 'core' }, { grade: '2a' }])).toEqual(['core', '2a'])
    expect(gradesPresent(WARBAND_TEMPLATES)).toEqual(['core', '1a', '1b', '1c', '2a', 'variant'])
  })
})

describe('filterTemplates', () => {
  it('matches every word against name, race and setting, ignoring case', () => {
    const names = (q: string) => filterTemplates(WARBAND_TEMPLATES, q).map((t) => t.name)
    expect(names('reikland')).toContain('Mercenaries (Reikland)')
    expect(names('REIKLAND merc')).toEqual(['Mercenaries (Reikland)'])
    expect(names('lustria').length).toBeGreaterThan(0)
    expect(names('skaven')).toHaveLength(3)
    expect(names('no such warband')).toEqual([])
  })

  it('returns everything for a blank query and narrows by grade', () => {
    expect(filterTemplates(WARBAND_TEMPLATES, '   ')).toHaveLength(WARBAND_TEMPLATES.length)
    const core = filterTemplates(WARBAND_TEMPLATES, '', 'core')
    expect(core.length).toBeGreaterThan(0)
    expect(core.every((t) => t.grade === 'core')).toBe(true)
    expect(filterTemplates(WARBAND_TEMPLATES, 'reikland', '2a')).toEqual([])
  })
})

describe('composition', () => {
  it('summarises gold and model range', () => {
    expect(compositionSummary(REIKLAND)).toBe('500 gc · 3 to 15 warriors')
    expect(compositionSummary({ composition: undefined })).toBe('500 gc')
    expect(compositionSummary({ composition: { minModels: 3, maxModels: null, startingGold: 600, text: '' } })).toBe(
      '600 gc · at least 3 warriors',
    )
  })

  it('words model ranges for each combination', () => {
    expect(modelRangeText(3, 15)).toBe('3 to 15 warriors')
    expect(modelRangeText(null, 12)).toBe('up to 12 warriors')
    expect(modelRangeText(3, null)).toBe('at least 3 warriors')
    expect(modelRangeText(null, null)).toBe('')
  })
})

describe('unit counts and limits', () => {
  const captain = findUnitTemplate(REIKLAND, CAPTAIN)!
  const champions = findUnitTemplate(REIKLAND, CHAMPIONS)!
  const warriors = findUnitTemplate(REIKLAND, WARRIORS)!

  it('counts heroes by head and henchmen by group size', () => {
    let d = newWarbandDraft(REIKLAND, 'Test')
    d = addDraftHero(d, REIKLAND, CHAMPIONS, 'c1')
    d = addDraftGroup(d, REIKLAND, WARRIORS, 'w1', 3)
    d = addDraftGroup(d, REIKLAND, WARRIORS, 'w2', 2)
    expect(draftUnitCount(d, captain)).toBe(1)
    expect(draftUnitCount(d, champions)).toBe(1)
    expect(draftUnitCount(d, warriors)).toBe(5)
    expect(modelCount(d)).toBe(7)
  })

  it('knows when a limit is reached and words the taken count', () => {
    let d = newWarbandDraft(REIKLAND, 'Test')
    expect(unitLimitReached(d, captain)).toBe(true)
    expect(unitLimitReached(d, champions)).toBe(false)
    d = addDraftHero(d, REIKLAND, CHAMPIONS, 'c1')
    d = addDraftHero(d, REIKLAND, CHAMPIONS, 'c2')
    expect(unitLimitReached(d, champions)).toBe(true)
    expect(unitLimitReached(d, warriors)).toBe(false)
    expect(takenText(1, '1')).toBe('1 of 1 taken')
    expect(takenText(2, '0-2')).toBe('2 of 2 taken')
    expect(takenText(0, 'any')).toBe('none yet')
    expect(takenText(4, 'any')).toBe('4 taken')
  })

  it('caps a group by what the other groups of the type leave free', () => {
    const unit = { id: WARRIORS, role: 'henchman' as const, rosterLimit: '0-5' }
    let d = newWarbandDraft(REIKLAND, 'Test')
    d = addDraftGroup(d, REIKLAND, WARRIORS, 'w1', 3)
    d = addDraftGroup(d, REIKLAND, WARRIORS, 'w2', 1)
    expect(groupSizeCeiling(d, d.groups[0], unit)).toBe(4)
    expect(groupSizeCeiling(d, d.groups[1], unit)).toBe(2)
    expect(groupSizeCeiling(d, d.groups[0], warriors)).toBeNull()
  })
})

describe('costs', () => {
  it('prices a hero as hire plus equipment', () => {
    let d = newWarbandDraft(REIKLAND, 'Test')
    d = addDraftEquipment(d, { kind: 'hero', id: 'leader' }, option('Sword'))
    d = addDraftEquipment(d, { kind: 'hero', id: 'leader' }, option('Dagger'), 2)
    expect(heroCost(d.heroes[0], REIKLAND)).toEqual({ hire: 60, equipment: 12, total: 72 })
  })

  it('prices a group per model times size and reports unknown lines as null', () => {
    let d = newWarbandDraft(REIKLAND, 'Test')
    d = addDraftGroup(d, REIKLAND, WARRIORS, 'w', 3)
    d = addDraftEquipment(d, { kind: 'group', id: 'w' }, option('Spear'))
    expect(groupCost(d.groups[0], REIKLAND)).toEqual({ hire: 75, equipment: 30, total: 105 })

    const mystery: EquipmentOption = { name: 'Gromril blade', cost: { kind: 'multiplier', amount: null, currency: 'gc', multiplier: 3, text: '3 times the cost' }, item: undefined, section: 'melee' }
    d = addDraftEquipment(d, { kind: 'group', id: 'w' }, mystery)
    expect(groupCost(d.groups[0], REIKLAND)).toEqual({ hire: 75, equipment: null, total: null })
    expect(needsPrice(d.groups[0].equipment[1])).toBe(true)
    expect(needsPrice(d.groups[0].equipment[0])).toBe(false)
    d = setDraftEquipmentCost(d, { kind: 'group', id: 'w' }, mystery, 30)
    expect(groupCost(d.groups[0], REIKLAND).total).toBe(75 + 30 + 90)
  })

  it('formats amounts', () => {
    expect(formatAmount(10)).toBe('10 gc')
    expect(formatAmount(4, 'wt')).toBe('4 wt')
    expect(formatAmount(null)).toBe('price needed')
  })
})

describe('equipment options', () => {
  it('groups by section in list order and drops empty sections', () => {
    const groups = groupEquipmentOptions(OPTIONS)
    expect(groups.map((g) => g.title)).toEqual(['Hand-to-hand weapons', 'Missile weapons', 'Armour'])
    expect(groups[0].options[0].name).toBe('Dagger')
    expect(groupEquipmentOptions(OPTIONS.filter((o) => o.section === 'armour')).map((g) => g.section)).toEqual(['armour'])
  })

  it('finds the option a stack came from and its quantity', () => {
    let d = newWarbandDraft(REIKLAND, 'Test')
    d = addDraftEquipment(d, { kind: 'hero', id: 'leader' }, option('Sword'), 2)
    const stack = d.heroes[0].equipment[0]
    expect(optionForItem(OPTIONS, stack)?.name).toBe('Sword')
    expect(quantityOf(d.heroes[0].equipment, option('Sword'))).toBe(2)
    expect(quantityOf(d.heroes[0].equipment, option('Dagger'))).toBe(0)
    expect(optionForItem(OPTIONS, { itemId: null, customName: 'Nothing' })).toBeUndefined()
  })
})

describe('problems', () => {
  it('buckets codes', () => {
    expect(problemGroupKey('builder.overspent')).toBe('treasury')
    expect(problemGroupKey('roster.negativeGold')).toBe('treasury')
    expect(problemGroupKey('roster.tooFewModels')).toBe('roster')
    expect(problemGroupKey('builder.emptyName')).toBe('names')
    expect(problemGroupKey('builder.unnamedWarrior')).toBe('names')
    expect(problemGroupKey('builder.unknownCost')).toBe('prices')
    expect(problemGroupKey('something.else')).toBe('other')
  })

  it('groups in a fixed order and drops empty groups', () => {
    const problems: RosterProblem[] = [
      { code: 'builder.unknownCost', message: 'p1' },
      { code: 'roster.tooFewModels', message: 'r1' },
      { code: 'builder.overspent', message: 't1' },
      { code: 'roster.unitLimit', message: 'r2' },
    ]
    const groups = groupProblems(problems)
    expect(groups.map((g) => g.title)).toEqual(['Treasury', 'Roster', 'Prices'])
    expect(groups[1].problems.map((p) => p.message)).toEqual(['r1', 'r2'])
    expect(groupProblems([])).toEqual([])
  })
})
