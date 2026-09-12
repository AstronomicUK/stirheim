import { expect, it } from 'vitest'
import { findItem, equipmentListOptions, equipmentBundle } from '../../data/items'
import type { RosterHero, RosterWarband } from '../../types/roster'
import { equipmentListWarning } from '../equipmentLists'
import { itemRestrictionWarnings, requiredEquipmentWarnings, equipmentRemovalWarnings, rosterItemWarnings, type ItemHolder } from '../itemRestrictions'
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


it('recognises Pit Fighter style components and both alternatives without changing bundle defaults', () => {
  const king = roster('pit_fighters', hero('pit_fighters_pit_king'))
  for (const id of ['helmet', 'dagger', 'flail', 'shield', 'light_armour', 'double_handed_weapon', 'axe', 'spiked_gauntlet', 'sword']) {
    expect(warning(king, id), id).toBeNull()
  }
  expect(warning(king, 'handgun')).toContain('not on')
  const pursuer = roster('pit_fighters', hero('pit_fighters_pursuer'))
  for (const id of ['helmet', 'dagger', 'trident', 'javelins', 'net', 'buckler', 'sword', 'spear']) {
    expect(findItem(id), id).toBeDefined()
    expect(warning(pursuer, id), id).toBeNull()
  }
  expect(warning(pursuer, 'heavy_armour')).toContain('not on')
  const style = 'Skink Style — Helmet; Dagger; Trident or Javelins; Net or Buckler'
  expect(equipmentBundle(style)?.map(item => item.id)).toEqual(['helmet', 'dagger', 'trident', 'net'])
  expect(equipmentListOptions(style).map(item => item.id)).toContain('javelins')
  for (const name of ['Shield/Buckler', 'Shields or Bucklers (choose which)']) {
    expect(equipmentListOptions(name).map(item => item.id)).toEqual(['shield', 'buckler'])
  }
})


it('limits Moulder handler weapons to Packmasters and Apprentices unless weapon training grants access', () => {
  for (const item of ['beastwhip', 'thingcatcher']) {
    for (const unit of ['packmaster', 'apprentices']) expect(warning(roster('skaven_of_clan_moulder', hero(unit)), item)).toBeNull()
    expect(warning(roster('skaven_of_clan_moulder', hero('stormvermin')), item)).toContain('not on')
    expect(warning(roster('skaven_of_clan_moulder', hero('stormvermin', ['weapons_training'])), item)).toBeNull()
  }
})
it('distinguishes Ogre and Trollslayer entries on their shared Pit Fighter list', () => {
  const ogre = roster('pit_fighters', hero('pit_fighters_ogre'))
  const slayer = roster('pit_fighters', hero('pit_fighters_troll_slayer'))
  expect(warning(ogre, 'dwarf_axe')).toContain('not on')
  expect(warning(slayer, 'dwarf_axe')).toBeNull()
  for (const item of ['light_armour', 'helmet']) {
    expect(warning(ogre, item)).toBeNull()
    expect(warning(slayer, item)).toContain('not on')
    expect(itemRestrictionWarnings(slayer, findItem(item)!, holder(slayer.heroes[0])).join(' ')).toContain('may not wear')
  }
})


it('separates Order of the Mare shared-list access and preserves the Paragon vow', () => {
  const r = (unit: string, skills: string[] = []) => roster('order_of_the_mare', hero(unit, skills))
  for (const id of ['spear', 'halberd', 'bow']) {
    expect(warning(r('pilgrims'), id)).toBeNull()
    expect(warning(r('gallant'), id)).toContain('not on')
  }
  for (const unit of ['paragon', 'gallant', 'redeemed_knights']) {
    expect(warning(r(unit), 'heavy_armour')).toBeNull()
    expect(warning(r(unit), 'lance')).toBeNull()
  }
  expect(warning(r('pilgrims'), 'heavy_armour')).toContain('not on')
  expect(warning(r('pilgrims'), 'lance')).toContain('not on')
  expect(warning(r('esquiresses'), 'spear')).toBeNull()
  expect(warning(r('bowmen'), 'spear')).toContain('not on')
  const paragon = r('paragon', ['weapons_training'])
  expect(itemRestrictionWarnings(paragon, findItem('lance')!, holder(paragon.heroes[0])).join(' ')).toContain('Vow of Poverty')
  expect(equipmentBanReason('order_of_the_mare', 'gallant', { itemId: 'lance', quantity: 1 })).toBeNull()
})


it('allows the Pit Fighter Trading Post trident exception without changing starting lists', () => {
  const h = hero('pit_fighters_pit_king'), r = roster('pit_fighters', h), item = findItem('trident')!
  expect(equipmentListWarning(r, item, holder(h))).toBeNull()
  expect(itemRestrictionWarnings(r, item, holder(h))).toEqual([])
  expect(itemRestrictionWarnings(r, item, holder(h), { atCreation: true }).join(' ')).toContain('not on')
  const pursuer = hero('pit_fighters_pursuer')
  expect(equipmentListWarning(roster('pit_fighters', pursuer), item, holder(pursuer), { atCreation: true })).toBeNull()
  const skaven = hero('skaven_black_skaven')
  expect(equipmentListWarning(roster('skaven_of_clan_eshin', skaven), item, holder(skaven))).toContain('not on')
})


it('keeps both Priest of Morr profiles to daggers and scythes even with weapon skills', () => {
  for (const [warband, unit] of [['dreamwalkers_cult_of_morr', 'dreamwalkers_priest_of_morr'], ['vampire_hunters_of_sylvania', 'priest_of_morr']]) {
    const h = hero(unit, ['weapons_training', 'weapons_expert']), r = roster(warband, h)
    for (const id of ['sword', 'axe', 'bow', 'pistol']) expect(itemRestrictionWarnings(r, findItem(id)!, holder(h)).join(' ')).toContain('only a dagger and a scythe')
    for (const id of ['dagger', 'scythe']) expect(equipmentBanReason(warband, unit, { itemId: id, quantity: 1 })).toBeNull()
    for (const id of ['light_armour', 'helmet']) expect(itemRestrictionWarnings(r, findItem(id)!, holder(h)).join(' ')).toContain('may not wear')
    expect(equipmentBanReason(warband, unit, { itemId: 'rope_and_hook', quantity: 1 })).toBeNull()
  }
})


it('treats ordinary club, mace and hammer entries as the same rulebook weapon type', () => {
  const r = roster('vampire_hunters_of_sylvania', hero('pilgrims_of_the_dark_shroud'))
  for (const id of ['club_mace_or_hammer', 'mace', 'hammer', 'gromril_hammer', 'ithilmar_hammer']) expect(warning(r, id), id).toBeNull()
})
it('keeps the Vim-To equipment vow and Dark Shroud Blunt rule after weapon training', () => {
  const mage = hero('nipponese_vim_to_mage', ['weapons_training', 'weapons_expert']), m = roster('nipponese_expedition', mage)
  for (const id of ['sword', 'bow', 'light_armour', 'helmet', 'rope_and_hook', 'lucky_charm']) expect(itemRestrictionWarnings(m, findItem(id)!, holder(mage)).join(' '), id).toContain('vow permits only')
  for (const id of ['dagger', 'club_mace_or_hammer']) expect(equipmentBanReason('nipponese_expedition', mage.unitTemplateId, { itemId: id, quantity: 1 })).toBeNull()
  const untrainedMage = { ...mage, skillIds: [] }
  for (const id of ['dagger', 'club_mace_or_hammer']) expect(itemRestrictionWarnings(roster('nipponese_expedition', untrainedMage), findItem(id)!, holder(untrainedMage))).toEqual([])
  const pilgrim = hero('pilgrims_of_the_dark_shroud', ['weapons_training', 'weapons_expert']), p = roster('vampire_hunters_of_sylvania', pilgrim)
  for (const id of ['dagger', 'sword', 'axe', 'bow', 'pistol']) expect(itemRestrictionWarnings(p, findItem(id)!, holder(pilgrim)).join(' '), id).toContain('Blunt limits')
  for (const id of ['club_mace_or_hammer', 'mace', 'hammer', 'silver_tip_stake']) expect(equipmentBanReason(p.warbandTemplateId, pilgrim.unitTemplateId, { itemId: id, quantity: 1 })).toBeNull()
})


it('applies Halfling Too Big to the actual Halflings, preserving the Village Ogre exception', () => {
  const banned = ['longbow', 'elf_bow', 'handgun', 'hunting_rifle', 'blunderbuss']
  for (const unit of ['halflings_elder', 'halflings_cook', 'halflings_thief_hero', 'halflings_youths', 'halflings_scouts', 'halflings_warriors']) {
    const h = hero(unit, ['weapons_expert']), r = roster('halflings', h)
    for (const id of banned) expect(itemRestrictionWarnings(r, findItem(id)!, holder(h)).join(' '), `${unit}/${id}`).toContain('Too Big')
    expect(equipmentBanReason('halflings', unit, { itemId: 'short_bow', quantity: 1 })).toBeNull()
  }
  for (const id of banned) expect(equipmentBanReason('halflings', 'halflings_village_ogre_henchman', { itemId: id, quantity: 1 })).toBeNull()
})


it('checks both Outlaw bow requirements, Cleric exemption and one-missile limit', () => {
  for (const [warband, unit, clericId] of [['outlaws_of_stirwood_forest', 'outlaws_champion', 'outlaws_cleric'], ['outlaws_of_stirwood_forest_redux', 'champions', 'cleric']]) {
    const h = hero(unit, ['weapons_expert']), r = roster(warband, h)
    expect(rosterItemWarnings(r).some(w => w.message.includes('must carry a bow'))).toBe(true)
    const cleric = hero(clericId)
    expect(requiredEquipmentWarnings(roster(warband, cleric), holder(cleric))).toEqual([])
    const armed = { ...h, equipment: [{ itemId: 'bow', quantity: 1 }] }
    expect(requiredEquipmentWarnings(roster(warband, armed), holder(armed))).toEqual([])
    expect(itemRestrictionWarnings(r, findItem('crossbow')!, holder(h)).join(' ')).toContain('even with Weapons Expert')
    expect(itemRestrictionWarnings(roster(warband, armed), findItem('bow')!, holder(armed)).join(' ')).toContain('may carry only one')
    const group: ItemHolder = { kind: 'henchmanGroup', name: 'Archers', unitTemplateId: unit, size: 3, equipment: [{ itemId: 'bow', quantity: 2 }] }
    expect(requiredEquipmentWarnings(r, group).join(' ')).toContain('for each model')
    expect(requiredEquipmentWarnings(r, { ...group, equipment: [{ itemId: 'bow', quantity: 3 }] })).toEqual([])
    expect(requiredEquipmentWarnings(r, { kind: 'hiredSword', equipment: [] })).toEqual([])
    expect(itemRestrictionWarnings(r, findItem('bow')!, { ...group, equipment: [{ itemId: 'bow', quantity: 3 }] }, { alreadyHeld: true }).join(' ')).not.toContain('may carry only one')
  }
})


it('warns before moving away required bows without mutating inventory or warning about unrelated moves', () => {
  const h = { ...hero('outlaws_champion'), equipment: [{ itemId: 'bow', quantity: 2 }] }, r = roster('outlaws_of_stirwood_forest', h)
  expect(equipmentRemovalWarnings(r, holder(h), 'bow', 1)).toEqual([])
  expect(equipmentRemovalWarnings(r, holder(h), 'bow', 2).join(' ')).toContain('must carry a bow')
  expect(h.equipment[0].quantity).toBe(2)
  const group: ItemHolder = { kind: 'henchmanGroup', size: 2, unitTemplateId: 'outlaws_marksman', equipment: h.equipment }
  expect(equipmentRemovalWarnings(r, group, 'bow', 1).join(' ')).toContain('for each model')
  expect(equipmentRemovalWarnings(r, { ...holder(h), unitTemplateId: 'outlaws_cleric' }, 'bow', 2)).toEqual([])
  expect(equipmentRemovalWarnings(r, { ...holder(h), equipment: [] }, 'dagger', 1)).toEqual([])
  expect(equipmentRemovalWarnings(r, { kind: 'stash', equipment: h.equipment }, 'bow', 2)).toEqual([])
})


it('warns about Wood Elf Hero-only starting Ithilmar without inventing a later purchase ban', () => {
  const h = hero('hunt_master'), r = roster('wood_elves_of_athel_loren', h)
  const group: ItemHolder = { kind: 'henchmanGroup', unitTemplateId: 'glade_guard', equipment: [] }
  for (const id of ['ithilmar_sword', 'ithilmar_armour']) {
    const item = findItem(id)!
    expect(itemRestrictionWarnings(r, item, group, { atCreation: true }).join(' ')).toContain('starting-list Ithilmar benefit is for Heroes only')
    expect(itemRestrictionWarnings(r, item, holder(h), { atCreation: true }).join(' ')).not.toContain('benefit is for Heroes only')
    expect(itemRestrictionWarnings(r, item, group).join(' ')).not.toContain('benefit is for Heroes only')
    expect(itemRestrictionWarnings(r, item, group, { alreadyHeld: true }).join(' ')).not.toContain('benefit is for Heroes only')
  }
})
