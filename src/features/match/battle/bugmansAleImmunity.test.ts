import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState, type BattleLiveState } from '../../../domain/battle'
import { WARBAND_TEMPLATES, findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../../rules/types/roster'
import { combatantsOf } from '../fight/combatants'

const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }
const hero = (id: string, unitTemplateId: string, equipment: RosterHero['equipment'] = []): RosterHero =>
  ({ id, name: id, unitTemplateId, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'active', equipment })
const hired = (id: string, hiredSwordId: string): RosterHiredSword =>
  ({ id, hiredSwordId, name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' })
const group = (id: string, unitTemplateId: string): RosterHenchmanGroup =>
  ({ id, name: id, unitTemplateId, size: 3, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [] })
const warband = (over: Partial<RosterWarband>): RosterWarband =>
  ({ id: 'w', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, stash: [], heroes: [], hiredSwords: [], henchmenGroups: [], ...over })
const drunk = (correction?: string): BattleLiveState => ({ ...emptyBattleLiveState(), warbandConsumables: [{ id: 'd1', itemRulesId: 'bugmans_ale', itemRowId: 'barrel', holderKey: 'stash', at: 't', ...(correction ? { correction } : {}) }] })
const immune = (list: ReturnType<typeof combatantsOf>) => Object.fromEntries(list.map(c => [c.id, c.traitIds.includes('immune_to_fear')]))

describe("Bugman's Ale immunity in the fight code (core: whole warband, Elves excepted, one barrel)", () => {
  const reikland = findWarbandTemplate('mercenaries_reikland')!
  it('a stash barrel declared drunk makes the whole roster immune: heroes, human hired swords and every henchman group', () => {
    const roster = warband({ heroes: [hero('cap', 'mercenaries_reikland_captain'), hero('champ', 'mercenaries_reikland_champions')], hiredSwords: [hired('ogre', 'ogre_bodyguard')], henchmenGroups: [group('watch', 'mercenaries_reikland_warriors')] })
    expect(immune(combatantsOf(roster, reikland, roster.name, drunk()))).toEqual({ cap: true, champ: true, ogre: true, watch: true })
  })
  it('a mixed warband: humans drink, the Elf Ranger does not', () => {
    const roster = warband({ heroes: [hero('cap', 'mercenaries_reikland_captain')], hiredSwords: [hired('ranger', 'elf_ranger'), hired('ogre', 'ogre_bodyguard')] })
    expect(immune(combatantsOf(roster, reikland, roster.name, drunk()))).toEqual({ cap: true, ranger: false, ogre: true })
  })
  it('a barrel merely carried, not declared, grants nothing', () => {
    const roster = warband({ heroes: [hero('cap', 'mercenaries_reikland_captain', [{ itemId: 'bugmans_ale', quantity: 1 }])] })
    expect(immune(combatantsOf(roster, reikland, roster.name, emptyBattleLiveState()))).toEqual({ cap: false })
    expect(immune(combatantsOf(roster, reikland, roster.name, undefined))).toEqual({ cap: false })
  })
  it('a corrected declaration grants nothing', () => {
    const roster = warband({ heroes: [hero('cap', 'mercenaries_reikland_captain')] })
    expect(immune(combatantsOf(roster, reikland, roster.name, drunk('Did not drink')))).toEqual({ cap: false })
  })
  it('an elven warband gets nothing from a declaration even if one were recorded', () => {
    const elves = WARBAND_TEMPLATES.find(t => /elf/i.test(t.race))!
    const roster = warband({ warbandTemplateId: elves.id, heroes: [hero('elf', elves.heroTemplates[0].id)], henchmenGroups: [group('kin', elves.henchmanTemplates[0].id)] })
    expect(immune(combatantsOf(roster, elves, roster.name, drunk()))).toEqual({ elf: false, kin: false })
  })
  it('a warrior already immune stays immune once, no duplicate trait', () => {
    const roster = warband({ heroes: [{ ...hero('cap', 'mercenaries_reikland_captain'), flags: { immuneToFear: true } }] })
    const [cap] = combatantsOf(roster, reikland, roster.name, drunk())
    expect(cap.traitIds.filter(t => t === 'immune_to_fear')).toHaveLength(1)
  })
})
