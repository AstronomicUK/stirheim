import { expect, it } from 'vitest'
import { findItem } from '../../data/items'
import type { RosterHero, RosterWarband } from '../../types/roster'
import { equipmentListWarning } from '../equipmentLists'
import { itemRestrictionWarnings, type ItemHolder } from '../itemRestrictions'
import { equipmentBanReason } from '../roster'
const hero = (unitTemplateId: string, skillIds: string[] = []): RosterHero => ({ id: 'hero', name: 'Warrior', unitTemplateId, skillIds, skillTableIds: [], spellIds: [], stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }, xp: 0, levelUps: 0, flags: {}, equipment: [], injuries: [], status: 'active' })
const roster = (warbandTemplateId: string, h: RosterHero): RosterWarband => ({ id: 'w', name: 'Warband', warbandTemplateId, heroes: [h], henchmenGroups: [], hiredSwords: [], stash: [], gold: 100, wyrdstone: 0, veteranPool: null })
const holder = (h: RosterHero): ItemHolder => ({ kind: 'hero', id: h.id, name: h.name, unitTemplateId: h.unitTemplateId, equipment: h.equipment, flags: h.flags })
const warning = (r: RosterWarband, id: string) => equipmentListWarning(r, findItem(id)!, holder(r.heroes[0]))

it('checks the individual list while respecting weapon skills and their separate phases', () => {
  const h = hero('skaven_black_skaven')
  const r = roster('skaven_of_clan_eshin', h)
  expect(warning(r, 'axe')).toContain('not on')
  expect(warning(roster(r.warbandTemplateId, { ...h, skillIds: ['weapons_training'] }), 'axe')).toBeNull()
  expect(warning(roster(r.warbandTemplateId, { ...h, skillIds: ['weapons_expert'] }), 'axe')).toContain('not on')
  expect(warning(roster(r.warbandTemplateId, { ...h, skillIds: ['weapons_expert'] }), 'handgun')).toBeNull()
  expect(warning(roster(r.warbandTemplateId, { ...h, skillIds: ['weapons_training'] }), 'handgun')).toContain('not on')
})
it('allows appropriate material variants and ignores stash and custom-unit membership', () => {
  const h = hero('mercenaries_reikland_captain'), r = roster('mercenaries_reikland', h)
  for (const id of ['sword', 'gromril_sword', 'ithilmar_sword', 'gromril_armour', 'ithilmar_armour']) expect(warning(r, id), id).toBeNull()
  expect(equipmentListWarning(r, findItem('handgun')!, { kind: 'stash', equipment: [] })).toBeNull()
  expect(warning(roster(r.warbandTemplateId, { ...h, unitTemplateId: 'custom-unit' }), 'handgun')).toBeNull()
})
it('recognises Proven Warrior equipment access without changing the original Youngun', () => {
  const h = hero('black_orcs_youngun'), r = roster('black_orcs', h)
  expect(warning(r, 'heavy_armour')).toContain('not on')
  expect(warning(roster(r.warbandTemplateId, { ...h, flags: { blackOrcBlood: true } }), 'heavy_armour')).toContain('not on')
  expect(warning(roster(r.warbandTemplateId, { ...h, skillIds: ['black_orcs_skills_proven_warrior'] }), 'heavy_armour')).toBeNull()
})
it('does not warn that a held creation-only item is being purchased again', () => {
  const h = hero('shadow_warriors_shadow_master'), r = roster('shadow_warriors', h), item = findItem('standard_of_nagarythe')!
  expect(itemRestrictionWarnings(r, item, holder(h)).join(' ')).toContain('when the warband is created')
  expect(itemRestrictionWarnings(r, item, holder(h), { alreadyHeld: true }).join(' ')).not.toContain('when the warband is created')
})


it('respects Bergjaeger-only longbows while retaining Weapons Expert access', () => {
  for (const unit of ['averlander_captain', 'averlander_sergeant', 'averlander_youngblood']) {
    const r = roster('averlander_mercenaries', hero(unit))
    expect(warning(r, 'longbow'), unit).toContain('not on')
  }
  expect(warning(roster('averlander_mercenaries', hero('averlander_bergjaeger')), 'longbow')).toBeNull()
  expect(warning(roster('averlander_mercenaries', hero('averlander_youngblood', ['weapons_expert'])), 'longbow')).toBeNull()
})
it('respects Shootaz crossbows and Boyz/Nuttaz two-handed weapons, including promoted units', () => {
  for (const unit of ['black_orcs_orc_shoota', 'black_orcs_orc_boy', 'black_orcs_orc_nutta', 'black_orcs_youngun']) {
    const r = roster('black_orcs', hero(unit))
    const crossbow = warning(r, 'crossbow')
    const doubleHanded = warning(r, 'double_handed_weapon')
    if (unit === 'black_orcs_orc_shoota') expect(crossbow).toBeNull()
    else expect(crossbow).toContain('not on')
    if (['black_orcs_orc_boy', 'black_orcs_orc_nutta'].includes(unit)) expect(doubleHanded).toBeNull()
    else expect(doubleHanded).toContain('not on')
    const groupHolder: ItemHolder = { kind: 'henchmanGroup', unitTemplateId: unit, equipment: [], size: 2 }
    expect(equipmentListWarning(r, findItem('crossbow')!, groupHolder) === null).toBe(crossbow === null)
  }
  const proven = roster('black_orcs', hero('black_orcs_youngun', ['black_orcs_skills_proven_warrior']))
  expect(warning(proven, 'crossbow')).toBeNull()
  expect(warning(proven, 'double_handed_weapon')).toBeNull()
})


it('keeps Horned Hunter religious armour bans even with weapon skills', () => {
  const priest = hero('horned_hunters_priest_of_taal', ['weapons_training', 'weapons_expert'])
  const initiate = hero('horned_hunters_initiate', ['weapons_training', 'weapons_expert'])
  const check = (h: RosterHero, id: string) => itemRestrictionWarnings(roster('horned_hunters', h), findItem(id)!, holder(h)).join(' ')
  expect(check(priest, 'heavy_armour')).toContain('heavy armour, which this warrior may not wear')
  expect(check(priest, 'light_armour')).not.toContain('may not wear')
  expect(check(initiate, 'light_armour')).toContain('armour, which this warrior may not wear')
  expect(check(initiate, 'helmet')).toContain('may not wear a helmet')
  expect(check(initiate, 'shield')).toContain('armour, which this warrior may not wear')
})
it('limits Hochland powder to Heroes without excluding promoted henchmen or storage', () => {
  const h = hero('hochland_bandits_thug', ['weapons_expert']), r = roster('hochland_bandits', h)
  const item = findItem('pistol')!
  const group: ItemHolder = { kind: 'henchmanGroup', unitTemplateId: h.unitTemplateId, size: 1, equipment: [] }
  expect(itemRestrictionWarnings(r, item, group).join(' ')).toContain("Powder's Expensive!")
  expect(itemRestrictionWarnings(r, item, holder(h))).toEqual([])
  expect(itemRestrictionWarnings(r, item, { kind: 'stash', equipment: [] })).toEqual([])
  expect(itemRestrictionWarnings({ ...r, warbandTemplateId: 'mercenaries_reikland' }, item, group).join(' ')).not.toContain("Powder's Expensive!")
})


it('keeps Small Hands restrictions after advancement and exempts Shoota Teams', () => {
  const banned = ['longbow', 'elf_bow', 'handgun', 'double_barrelled_handgun', 'repeater_handgun', 'hunting_rifle', 'ostlander_double_barrelled_hunting_rifle', 'blunderbuss', 'chaos_dwarf_blunderbuss']
  for (const unit of ['bullied_goblin', 'bigsnotz', 'snotling_scouts', 'snotling_shaman', 'runts', 'snotling_mobs']) {
    const h = hero(unit, ['weapons_expert']), r = roster('snotlings', h)
    for (const id of banned) {
      expect(findItem(id), id).toBeDefined()
      expect(itemRestrictionWarnings(r, findItem(id)!, holder(h)).join(' '), `${unit}/${id}`).toContain('Small Hands')
    }
    for (const id of ['short_bow', 'bow', 'pistol', 'crossbow']) {
      expect(equipmentBanReason('snotlings', unit, { itemId: id, quantity: 1 }), `${unit}/${id}`).toBeNull()
    }
  }
  const team = hero('snotling_shoota_team', ['weapons_expert']), r = roster('snotlings', team)
  for (const id of banned) expect(itemRestrictionWarnings(r, findItem(id)!, holder(team)).join(' '), id).not.toContain('Small Hands')
  expect(equipmentBanReason('night_goblins', 'night_goblins_snotling_mob', { itemId: 'longbow', quantity: 1 })).toBeNull()
})


it('uses current Hero status for restricted list entries after promotion', () => {
  for (const [warband, unit, itemId] of [
    ['lizardmen', 'lizardmen_skink_brave', 'sword'],
    ['pirates', 'pirates_crew', 'cat_o_nine_tails'],
    ['outlaws_of_stirwood_forest_redux', 'outlaws', 'longbow'],
  ]) {
    const h = hero(unit), r = roster(warband, h), item = findItem(itemId)!
    const group: ItemHolder = { kind: 'henchmanGroup', unitTemplateId: unit, equipment: [] }
    expect(equipmentListWarning(r, item, group), `${unit}/${itemId}`).toContain('not on')
    expect(equipmentListWarning(r, item, holder(h)), `${unit}/${itemId}`).toBeNull()
  }
})
it('keeps Bone Helmets restricted to Skink Priests within the Skink list', () => {
  for (const unit of ['lizardmen_skink_great_crest', 'lizardmen_skink_brave']) {
    const h = hero(unit, ['weapons_training', 'weapons_expert'])
    expect(warning(roster('lizardmen', h), 'bone_helmet')).toContain('not on')
  }
  expect(warning(roster('lizardmen', hero('lizardmen_skink_priest')), 'bone_helmet')).toBeNull()
})
