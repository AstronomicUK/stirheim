import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { briberyQuote, leadershipOptions, routSkillReminders, suggestedLeadership } from './routCheckRules'
import { conditionsFor, setGroupOut, toggleHeroOut } from './sheet'
import { battleEventRowSchema } from '../../../domain/battleEvent'

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


describe('recorded stun and recovery affect Rout Leadership (#68)', () => {
  const id = 'aaaaaaaa-0000-4000-8000-000000000001'
  const testRoster = { ...roster, id }
  const event = battleEventRowSchema.parse({ id, match_id: id, actor_id: id, actor_warband_id: id, at: '2026-09-11T07:00:00Z', kind: 'attack', summary: '', reverted_at: null, reverted_by: null, revert_note: null,
    payload: { attacker_warband_id: id, attacker_id: 'enemy', attacker_kind: 'hero', attacker_name: 'Enemy', target_warband_id: id, target_id: 'cap', target_kind: 'hero', target_name: 'Kurt', outcome: 'Stunned', turn: 1 } })
  it('uses the next fighter while stunned, then restores a knocked-down leader after recovery', () => {
    const sheet = emptyBattleLiveState()
    const before = leadershipOptions(testRoster, REIKLAND, sheet, undefined, conditionsFor([event], id, 2, []))
    expect(before.find(o => o.id === 'cap')).toMatchObject({ standing: false, unavailableReason: 'stunned' })
    expect(suggestedLeadership(before)?.id).toBe('ch1')
    const after = leadershipOptions(testRoster, REIKLAND, sheet, undefined, conditionsFor([event], id, 2, [{ warbandId: id, at: '2026-09-11T07:01:00Z' }]))
    expect(suggestedLeadership(after)?.id).toBe('cap') // Knocked down is allowed for Rout Leadership.
    const reverted = { ...event, reverted_at: '2026-09-11T07:01:00Z' }
    expect(suggestedLeadership(leadershipOptions(testRoster, REIKLAND, sheet, undefined, conditionsFor([reverted], id, 2, [])))?.id).toBe('cap')
  })
  it('does not assume every member of a group shares one recorded stun', () => {
    const group = { id: 'v', name: 'Veterans', unitTemplateId: 'mercenaries_reikland_warriors', size: 2, stats: { ...stats, Ld: 9 }, xp: 0, levelUps: 0, statIncreases: {}, equipment: [] }
    const conditions = new Map([['cap', 'Stunned'], ['v', 'Stunned']])
    const options = (size: number) => leadershipOptions({ ...roster, henchmenGroups: [{ ...group, size }] }, REIKLAND, emptyBattleLiveState(), undefined, conditions)
    expect(suggestedLeadership(options(2))).toMatchObject({ id: 'v', availabilityNote: 'confirm an unstunned member remains' })
    expect(suggestedLeadership(options(1))?.id).toBe('ch1')
  })
})

describe('Merchant Bribery quote (#68)', () => {
  const caravan: RosterWarband = { ...roster, gold: 100,
    heroes: roster.heroes.map((h, i) => i === 0 ? { ...h, skillIds: ['merchant_caravans_skills_bribery'], equipment: [{ itemId: 'wardogs', quantity: 1 }] } : h),
    henchmenGroups: [{ id: 'guards', name: 'Guards', unitTemplateId: 'merchant_caravans_guards', size: 4, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [] }],
    hiredSwords: [{ id: 'hired', hiredSwordId: 'ogre_bodyguard', name: 'Ogre', stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' }],
  };
  const casualties = () => setGroupOut(toggleHeroOut(emptyBattleLiveState(), 'ch1'), 'guards', 2, 4);
  it('charges only living non-Hero members, including hired swords and purchased animals', () => {
    const quote = briberyQuote(caravan, casualties());
    expect(quote).toMatchObject({ merchantId: 'cap', nonHeroes: 4, hiredSwords: 1, henchmen: 2, animals: 1, cost: 20, casualties: 3, threshold: 3, available: true, testStillRequiredAfterPayment: false });
    expect(briberyQuote(caravan, toggleHeroOut(casualties(), 'hired')).cost).toBe(15);
  });
  it('is a learned skill, needs an eligible Merchant and sufficient gold, and cannot skip a still-required test', () => {
    expect(briberyQuote({ ...caravan, gold: 19 }, casualties()).available).toBe(false);
    expect(briberyQuote({ ...caravan, heroes: roster.heroes }, casualties()).available).toBe(false);
    expect(briberyQuote(caravan, toggleHeroOut(casualties(), 'cap')).available).toBe(false);
    expect(briberyQuote(caravan, toggleHeroOut(casualties(), 'yb')).testStillRequiredAfterPayment).toBe(true);
    expect(briberyQuote(caravan, casualties(), 1).available).toBe(false);
  });
});

it('uses the appointed Gnoblar as leader for Rout leadership and leader bonuses', () => {
  const template = findWarbandTemplate('ogre_hunting_party')!
  const gnoblar = { ...hero('g', 'Gnoblar leader', 'ogre_hunting_party_trappers', 7), flags: { temporaryLeader: true } }
  const w = { ...roster, warbandTemplateId: template.id, heroes: [gnoblar] }
  const options = leadershipOptions(w, template, emptyBattleLiveState(), { bonus: 1, sources: ['Campaign bonus'] })
  expect(options[0]).toMatchObject({ id: 'g', leader: true, ld: 8 })
})
