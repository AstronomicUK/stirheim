import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { leadershipOptions, routSkillReminders, suggestedLeadership } from './routCheckRules'
import { setGroupOut, toggleHeroOut } from './sheet'

const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 }
const hero = (id: string, name: string, unit: string, ld: number): RosterHero => ({
  id, name, unitTemplateId: unit, stats: { ...stats, Ld: ld }, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
})
const roster: RosterWarband = {
  id: 'w', name: 'Watch', warbandTemplateId: REIKLAND.id, gold: 0, wyrdstone: 0, veteranPool: null,
  heroes: [hero('cap', 'Kurt', 'mercenaries_reikland_captain', 8), hero('ch1', 'Hans', 'mercenaries_reikland_champions', 7), hero('yb', 'Pip', 'mercenaries_reikland_youngbloods', 6)],
  henchmenGroups: [], hiredSwords: [], stash: [],
}

describe('rout check leadership', () => {
  it('offers the leader first and suggests him while he stands', () => {
    const options = leadershipOptions(roster, REIKLAND, emptyBattleLiveState())
    expect(options.map((o) => o.id)).toEqual(['cap', 'ch1', 'yb'])
    expect(options[0].leader).toBe(true)
    expect(suggestedLeadership(options)?.id).toBe('cap')
  })
  it('falls back to the highest standing Leadership once the leader is down', () => {
    const sheet = toggleHeroOut(emptyBattleLiveState(), 'cap')
    const options = leadershipOptions(roster, REIKLAND, sheet)
    expect(options[0]).toMatchObject({ id: 'cap', standing: false })
    expect(suggestedLeadership(options)?.id).toBe('ch1')
  })
  it('does not suggest a fallen warrior when everyone is down', () => {
    let sheet = emptyBattleLiveState()
    for (const id of ['cap', 'ch1', 'yb']) sheet = toggleHeroOut(sheet, id)
    expect(suggestedLeadership(leadershipOptions(roster, REIKLAND, sheet))).toBeUndefined()
  })

  it('never offers a hired sword as the suggestion, even with the highest Leadership standing (#60/#68)', () => {
    const ogre: RosterHiredSword = {
      id: 'hs', hiredSwordId: 'ogre_bodyguard', name: 'Grom', stats: { ...stats, Ld: 9 }, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
    }
    const withOgre: RosterWarband = { ...roster, hiredSwords: [ogre] }
    const options = leadershipOptions(withOgre, REIKLAND, emptyBattleLiveState())
    const hsOption = options.find((o) => o.id === 'hs')!
    expect(hsOption.mayLead).toBe(false)
    expect(hsOption.ld).toBe(9) // higher than every hero, and still correctly excluded
    expect(suggestedLeadership(options)?.id).toBe('cap') // the leader, not the higher-Ld hired sword
    // Even once the leader is down, the suggestion falls to the next eligible hero, not the hired sword.
    const sheet = toggleHeroOut(emptyBattleLiveState(), 'cap')
    expect(suggestedLeadership(leadershipOptions(withOgre, REIKLAND, sheet))?.id).toBe('ch1')
  })
})

describe('rout skill reminders (#68)', () => {
  it('surfaces a standing hero holding a rout-affecting skill', () => {
    const matriarch = hero('m', 'Reverend Mother Elsbeth', 'sisters_of_sigmar_matriarch', 8)
    matriarch.skillIds = ['sisters_of_sigmar_skills_utter_determination']
    const withSkill: RosterWarband = { ...roster, heroes: [...roster.heroes, matriarch] }
    const reminders = routSkillReminders(withSkill, emptyBattleLiveState())
    expect(reminders).toEqual([{ warriorId: 'm', warriorName: 'Reverend Mother Elsbeth', skillName: 'Utter Determination', note: 'may re-roll a failed Rout test' }])
  })

  it('drops the reminder once that warrior is out of action', () => {
    const boss = hero('boss', 'Grishnak', 'orc_mob_boss', 7)
    boss.skillIds = ['orc_mob_skills_da_cunnin_plan']
    const withSkill: RosterWarband = { ...roster, heroes: [...roster.heroes, boss] }
    const sheet = toggleHeroOut(emptyBattleLiveState(), 'boss')
    expect(routSkillReminders(withSkill, sheet)).toEqual([])
  })

  it('also checks hired swords, in case a future data source grants one the skill', () => {
    const bard: RosterHiredSword = {
      id: 'bard', hiredSwordId: 'dwarf_slayer_cult_bard', name: 'Ustgrim', stats: { ...stats, Ld: 7 }, xp: 0, levelUps: 0, skillIds: ['dwarf_slayer_cult_skills_songster'], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active',
    }
    const withBard: RosterWarband = { ...roster, hiredSwords: [bard] }
    const reminders = routSkillReminders(withBard, emptyBattleLiveState())
    expect(reminders).toHaveLength(1)
    expect(reminders[0].skillName).toBe('Songster')
  })

  it('returns nothing when no standing warrior has a rout-affecting skill', () => {
    expect(routSkillReminders(roster, emptyBattleLiveState())).toEqual([])
  })
})


describe('henchman Rout Leadership (#68)', () => {
  const veterans = { id: 'veterans', name: 'Veterans', unitTemplateId: 'mercenaries_reikland_warriors', size: 2, stats: { ...stats, Ld: 9 }, xp: 10, levelUps: 1, statIncreases: {}, equipment: [] }
  const withVeterans: RosterWarband = { ...roster, henchmenGroups: [veterans] }
  it('retains the leader while present, then uses surviving veteran henchmen', () => {
    expect(suggestedLeadership(leadershipOptions(withVeterans, REIKLAND, emptyBattleLiveState()))?.id).toBe('cap')
    let sheet = toggleHeroOut(emptyBattleLiveState(), 'cap')
    sheet = setGroupOut(sheet, veterans.id, 1, 2)
    expect(suggestedLeadership(leadershipOptions(withVeterans, REIKLAND, sheet))?.id).toBe('veterans')
    sheet = setGroupOut(sheet, veterans.id, 2, 2)
    expect(suggestedLeadership(leadershipOptions(withVeterans, REIKLAND, sheet))?.id).toBe('ch1')
  })
  it('does not suggest an explicit never-leader, an absent group or hired sword as fallback', () => {
    const groups = [
      { ...veterans, unitTemplateId: 'witch_hunters_flagellants' },
      { ...veterans, id: 'empty', size: 0 },
      { ...veterans, id: 'absent', campaignState: { fanaticSittingOut: true } },
    ]
    const testRoster: RosterWarband = { ...withVeterans, heroes: [], henchmenGroups: groups, hiredSwords: [{ id: 'hs', hiredSwordId: 'ogre_bodyguard', name: 'Grom', stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' }] }
    const options = leadershipOptions(testRoster, REIKLAND, emptyBattleLiveState())
    expect(options.some(o => o.id === 'empty' || o.id === 'absent')).toBe(false)
    expect(options.find(o => o.id === 'veterans')?.mayLead).toBe(false)
    expect(suggestedLeadership(options)).toBeUndefined()
    expect(options).toHaveLength(2) // Both remain selectable as approved player overrides.
  })
})
