import { expect, it } from 'vitest'
import { findItem } from '../../data/items'
import type { RosterHero, RosterWarband } from '../../types/roster'
import { equipmentListWarning } from '../equipmentLists'
import { itemRestrictionWarnings, type ItemHolder } from '../itemRestrictions'
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
