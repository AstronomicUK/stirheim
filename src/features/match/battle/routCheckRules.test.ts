import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { leadershipOptions, suggestedLeadership } from './routCheckRules'
import { toggleHeroOut } from './sheet'

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
  it('still offers a fallen warrior when everyone is down', () => {
    let sheet = emptyBattleLiveState()
    for (const id of ['cap', 'ch1', 'yb']) sheet = toggleHeroOut(sheet, id)
    expect(suggestedLeadership(leadershipOptions(roster, REIKLAND, sheet))?.id).toBe('cap')
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
