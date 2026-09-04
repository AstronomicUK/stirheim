import { describe, expect, it } from 'vitest'
import { HIRED_SWORDS } from '../../rules/data/campaign/hiredSwords'
import { findUnitTemplate, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { RulesError } from '../../rules/resolve/errors'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../rules/types/roster'
import {
  countText,
  defaultGroupName,
  defaultHeroName,
  errorMessage,
  findHiredSwordEntry,
  groupsOfType,
  hiredSwordEligibility,
  hiredSwordOptions,
  listUnits,
  maxRecruitable,
  readRestriction,
  singular,
  upkeepDue,
  upkeepSummary,
  veteranQuote,
  warbandDescriptors,
} from './helpers'

const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const SKAVEN = findWarbandTemplate('skaven_of_clan_eshin')!
const WITCH_HUNTERS = findWarbandTemplate('witch_hunters')!
const CAPTAIN = findUnitTemplate(REIKLAND, 'mercenaries_reikland_captain')!
const CHAMPIONS = findUnitTemplate(REIKLAND, 'mercenaries_reikland_champions')!
const WARRIORS = findUnitTemplate(REIKLAND, 'mercenaries_reikland_warriors')!
const SWORDSMEN = findUnitTemplate(REIKLAND, 'mercenaries_reikland_swordsmen')!

function hero(id: string, unitTemplateId: string, name = id): RosterHero {
  const unit = findUnitTemplate(REIKLAND, unitTemplateId)!
  return {
    id,
    name,
    unitTemplateId,
    stats: { ...unit.stats },
    xp: unit.startingExperience,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: 'active',
  }
}

function group(id: string, unitTemplateId: string, size: number, xp = 0, name = id): RosterHenchmanGroup {
  const unit = findUnitTemplate(REIKLAND, unitTemplateId)!
  return { id, name, unitTemplateId, size, stats: { ...unit.stats }, xp, levelUps: 0, statIncreases: {}, equipment: [] }
}

function hiredSword(id: string, hiredSwordId: string, status: RosterHiredSword['status'] = 'active'): RosterHiredSword {
  return { id, hiredSwordId, name: id, stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }, xp: 0, levelUps: 0, skillIds: [], injuries: [], flags: {}, equipment: [], status }
}

function warband(over: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: 'w1',
    name: 'Reikland Watch',
    warbandTemplateId: REIKLAND.id,
    gold: 500,
    wyrdstone: 0,
    veteranPool: null,
    heroes: [hero('cap', CAPTAIN.id, 'Captain Aldric')],
    henchmenGroups: [group('g1', WARRIORS.id, 3, 0, 'Watchmen')],
    hiredSwords: [],
    stash: [],
    ...over,
  }
}

describe('listUnits', () => {
  it('lists hero types with counts against their limits', () => {
    const rows = listUnits(warband(), REIKLAND, 'hero')
    expect(rows.map((r) => r.unit.id)).toEqual(REIKLAND.heroTemplates.map((u) => u.id))
    const captain = rows.find((r) => r.unit.id === CAPTAIN.id)!
    expect(captain.count).toBe(1)
    expect(captain.max).toBe(1)
    expect(captain.countText).toBe('1 of 1')
    expect(captain.recruit.ok).toBe(false)
    expect(captain.recruit.reason).toMatch(/limit is 1/)
    const champions = rows.find((r) => r.unit.id === CHAMPIONS.id)!
    expect(champions.countText).toBe('0 of 2')
    expect(champions.recruit.ok).toBe(true)
  })

  it('counts henchmen as models across groups and reads unlimited limits', () => {
    const rows = listUnits(warband({ henchmenGroups: [group('g1', WARRIORS.id, 3), group('g2', WARRIORS.id, 2)] }), REIKLAND, 'henchman')
    const warriors = rows.find((r) => r.unit.id === WARRIORS.id)!
    expect(warriors.count).toBe(5)
    expect(warriors.max).toBeNull()
    expect(warriors.countText).toBe('5 hired')
    const swordsmen = rows.find((r) => r.unit.id === SWORDSMEN.id)!
    expect(swordsmen.countText).toBe('0 of 5')
  })

  it('reports the treasury as the reason when gold is short', () => {
    const rows = listUnits(warband({ gold: 10 }), REIKLAND, 'hero')
    const champions = rows.find((r) => r.unit.id === CHAMPIONS.id)!
    expect(champions.recruit.ok).toBe(false)
    expect(champions.recruit.reason).toMatch(/treasury holds 10 gc/)
  })

  it('formats counts', () => {
    expect(countText(0, null)).toBe('none yet')
    expect(countText(2, null)).toBe('2 hired')
    expect(countText(2, 5)).toBe('2 of 5')
  })
})

describe('maxRecruitable', () => {
  it('is bounded by the unit limit and the warband size', () => {
    expect(maxRecruitable(warband(), REIKLAND, SWORDSMEN)).toBe(5)
    // 1 hero + 3 warriors = 4 models of 15: eleven more of an unlimited type.
    expect(maxRecruitable(warband(), REIKLAND, WARRIORS)).toBe(11)
    expect(maxRecruitable(warband({ henchmenGroups: [group('g1', WARRIORS.id, 13)] }), REIKLAND, SWORDSMEN)).toBe(1)
  })

  it('never drops below one so the sheet can still explain the refusal', () => {
    expect(maxRecruitable(warband({ henchmenGroups: [group('g1', WARRIORS.id, 14)] }), REIKLAND, SWORDSMEN)).toBe(1)
  })
})

describe('veteranQuote', () => {
  it('is free for a green group', () => {
    expect(veteranQuote(group('g1', WARRIORS.id, 3, 0), 2, null)).toEqual({ xp: 0, gold: 0, needsPool: false, exceedsPool: false })
  })

  it('charges 2 gc per experience point and checks the pool', () => {
    const veterans = group('g1', WARRIORS.id, 3, 4)
    expect(veteranQuote(veterans, 2, 9)).toEqual({ xp: 8, gold: 16, needsPool: false, exceedsPool: false })
    expect(veteranQuote(veterans, 3, 9)).toMatchObject({ xp: 12, gold: 24, exceedsPool: true })
    expect(veteranQuote(veterans, 1, null)).toMatchObject({ xp: 4, needsPool: true })
  })

  it('finds groups of a type', () => {
    const w = warband({ henchmenGroups: [group('g1', WARRIORS.id, 3), group('g2', SWORDSMEN.id, 2)] })
    expect(groupsOfType(w, WARRIORS.id).map((g) => g.id)).toEqual(['g1'])
  })
})

describe('readRestriction', () => {
  it('describes a warband by its name and race', () => {
    const words = warbandDescriptors(REIKLAND)
    expect(words).toEqual(expect.arrayContaining(['mercenaries', 'mercenary', 'reikland', 'human', 'humans', 'mercs']))
    expect(words).not.toContain('warband')
  })

  it('allows a warband the text names', () => {
    expect(readRestriction('Mercenaries and Witch Hunters may hire Freelancers.', REIKLAND).kind).toBe('allowed')
    expect(readRestriction('Human Mercenaries may hire Elf Mages.', REIKLAND).kind).toBe('allowed')
    expect(readRestriction('The Witch Hunters can hire a Gaoler.', WITCH_HUNTERS).kind).toBe('allowed')
  })

  it('restricts a warband named in an exclusion or left off a list', () => {
    expect(readRestriction('Any warband except Skaven may hire an Ogre Bodyguard.', SKAVEN).kind).toBe('restricted')
    expect(readRestriction('Mercenaries and Witch Hunters may hire Freelancers.', SKAVEN).kind).toBe('restricted')
    expect(readRestriction('Only Skaven warbands may hire the Clan Skryre Rat Ogre.', REIKLAND).kind).toBe('restricted')
    expect(readRestriction('Lizardmen warbands only.', REIKLAND).kind).toBe('restricted')
  })

  it('reads "any warband" as ok unless the exclusion names us', () => {
    expect(readRestriction('Any warband except Skaven may hire an Ogre Bodyguard.', REIKLAND).kind).toBe('ok')
    expect(readRestriction('Any warband.', SKAVEN).kind).toBe('ok')
  })

  it('does not confuse another warband of the same kind, nor the entry name, with ours', () => {
    const priest = 'Any warband may hire a Warrior Priest of Sigmar except Witch Hunters, Middenheim mercenaries, Possessed, Orcs & Goblins and Skaven.'
    expect(readRestriction(priest, REIKLAND).kind).toBe('ok')
    expect(readRestriction(priest, findWarbandTemplate('mercenaries_middenheim')!).kind).toBe('restricted')
    expect(readRestriction('Any warband except Orcs, Goblins, Beastmen or Possessed may hire the Human Scout.', REIKLAND, 'Human Scout').kind).toBe('ok')
  })

  it('asks the player to check alignment wording and empty text', () => {
    expect(readRestriction('Any evil warband may hire a Slaver.', REIKLAND).kind).toBe('check')
    expect(readRestriction('', REIKLAND).kind).toBe('check')
    expect(readRestriction('?', REIKLAND).kind).toBe('check')
    expect(readRestriction('Any warband.', undefined).kind).toBe('check')
  })
})

describe('hiredSwordEligibility', () => {
  const slayer = findHiredSwordEntry('dwarf_troll_slayer')!

  it('blocks a second active hired sword of the same type but not a replacement for one who left', () => {
    expect(hiredSwordEligibility(slayer, warband({ hiredSwords: [hiredSword('hs1', slayer.id)] }), REIKLAND)).toMatchObject({ kind: 'blocked' })
    expect(hiredSwordEligibility(slayer, warband({ hiredSwords: [hiredSword('hs1', slayer.id, 'left')] }), REIKLAND).kind).toBe('allowed')
  })

  it('blocks entries that are not hired for gold', () => {
    const prospector = findHiredSwordEntry('old_prospector')!
    expect(prospector.hireCost.base).toBeNull()
    expect(hiredSwordEligibility(prospector, warband(), REIKLAND)).toMatchObject({ kind: 'blocked', reason: expect.stringContaining('2 treasures') })
  })

  it('lists every hired sword once, sorted by name, with the Reikland outcomes expected', () => {
    const options = hiredSwordOptions(warband(), REIKLAND)
    expect(options).toHaveLength(HIRED_SWORDS.length)
    expect(options.map((o) => o.entry.name)).toEqual([...options.map((o) => o.entry.name)].sort((a, b) => a.localeCompare(b)))
    const byId = new Map(options.map((o) => [o.entry.id, o.eligibility.kind]))
    expect(byId.get('dwarf_troll_slayer')).toBe('allowed')
    expect(byId.get('freelancer')).toBe('allowed')
    expect(byId.get('halfling_scout')).toBe('ok')
    expect(byId.get('clan_skryre_rat_ogre')).toBe('restricted')
    expect(byId.get('gaoler')).toBe('restricted')
    expect(byId.get('human_scout')).toBe('ok')
  })
})

describe('upkeep', () => {
  const slayer = findHiredSwordEntry('dwarf_troll_slayer')!
  const hs = { ...hiredSword('hs1', slayer.id), name: 'Grimnir' }

  it('reads the listed fee or an override', () => {
    expect(upkeepDue(slayer, null)).toBe(10)
    expect(upkeepDue(slayer, 20)).toBe(20)
    expect(upkeepDue(undefined, null)).toBe(0)
    expect(upkeepDue(findHiredSwordEntry('clan_skryre_rat_ogre'), null)).toBe(0)
  })

  it('says what paying will do', () => {
    expect(upkeepSummary(hs, slayer, 500)).toBe('Pay Grimnir 10 gc; the treasury drops from 500 gc to 490 gc.')
    expect(upkeepSummary(hs, slayer, 5)).toMatch(/holds 5 gc: he will leave/)
    expect(upkeepSummary(hs, slayer, 25, 20)).toBe('Pay Grimnir 20 gc; the treasury drops from 25 gc to 5 gc.')
    expect(upkeepSummary({ ...hs, name: 'Rat' }, findHiredSwordEntry('clan_skryre_rat_ogre'), 100)).toMatch(/1 wyrdstone, not gold/)
    expect(upkeepSummary(hs, undefined, 100)).toBe('Grimnir has no upkeep due.')
  })
})

describe('names and messages', () => {
  it('singularises unit names', () => {
    expect(singular('Champions')).toBe('Champion')
    expect(singular('Marksmen')).toBe('Marksman')
    expect(singular('Youngbloods')).toBe('Youngblood')
    expect(singular('Mercenary Captain')).toBe('Mercenary Captain')
    expect(singular('Possessed')).toBe('Possessed')
  })

  it('numbers default hero names after the first of a type', () => {
    expect(defaultHeroName(CHAMPIONS, warband())).toBe('Champion')
    expect(defaultHeroName(CHAMPIONS, warband({ heroes: [hero('c1', CHAMPIONS.id)] }))).toBe('Champion 2')
  })

  it('numbers default group names after the first group of a type', () => {
    expect(defaultGroupName(SWORDSMEN, warband())).toBe('Swordsmen')
    expect(defaultGroupName(WARRIORS, warband())).toBe('Warriors 2')
  })

  it('turns errors into text', () => {
    expect(errorMessage(new RulesError('x', 'Too poor'))).toBe('Too poor')
    expect(errorMessage(new Error('boom'))).toBe('boom')
    expect(errorMessage('nope', 'Fallback')).toBe('Fallback')
  })
})
