import type { UnitTemplate, WarbandTemplate } from '../types'
import type { RosterItem } from '../types/roster'
import { findEquipmentList } from '../data/warbandTemplates'
import { resolveEquipmentName } from '../data/items/aliases'
import { freeDaggerLine } from './freeDagger'

const FIXED: Record<string, string[]> = {
  lustrian_reavers_conqueror: ['masterwork_heavy_armour', 'bec_de_corbin', 'helmet'],
  lustrian_reavers_saurus_slayer: ['heavy_armour', 'misericordia', 'sword', 'sword', 'helmet'],
  lustrian_reavers_beastmaster: ['heavy_armour', 'spear', 'sword'],
  lustrian_reavers_jungle_shadow: ['javelins', 'light_armour', 'dagger', 'dagger'],
  lustrian_reavers_trapmaster: ['heavy_armour', 'sword', 'hunting_rifle', 'firepots_miragliano', 'elven_cloak'],
  dame_of_the_mare: ['ancient_armour'],
}

/** Per-model entitlement at recruitment. Never run on existing warriors or on page load. */
export function startingEquipment(template: WarbandTemplate, unit: UnitTemplate, wizard = false): RosterItem[] {
  const ids = [...(FIXED[unit.id] ?? [])].filter(id => !(wizard && unit.id === 'lustrian_reavers_jungle_shadow' && id === 'light_armour'))
  if (template.id === 'imperial_outriders') ids.push('riding_draft_horse')
  const dagger = freeDaggerLine(template, unit)
  if (dagger?.itemId && !ids.includes(dagger.itemId)) ids.push(dagger.itemId)
  const list = findEquipmentList(template, unit.equipmentListId)
  for (const line of list?.missileWeapons ?? []) {
    if (/1st\s*free/i.test(line.cost) && resolveEquipmentName(line.name)?.id === 'sharp_stuff') ids.push('sharp_stuff')
  }
  return [...new Set(ids)].map(itemId => ({itemId, quantity: ids.filter(id => id === itemId).length}))
}
