import { itemEffect } from '../../../rules/data/itemRules'
import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import type { BattleEventRow } from '../../../domain/battleEvent'
import type { ItemRow } from '../../../domain'
import { findWeapon } from '../../../rules/data/weapons'
import { isBlackpowderWeapon } from '../../../rules/resolve/ladyBlessing'
import { physicalWeaponChoices } from '../fight/weaponLoss'
import type { Combatant } from '../fight/combatants'

export function poisonVialsRemaining(sheet: BattleLiveState, item: ItemRow): number {
  return Math.max(0, item.quantity - sheet.poisonApplications.filter(use => use.itemRowId === item.id && !use.correction).length)
}

export function applyPoisonToWeapon(sheet: BattleLiveState, warrior: Combatant, vial: ItemRow, rows: readonly ItemRow[], events: readonly BattleEventRow[], weaponId: string, weaponKey: string, id: string): BattleLiveState {
  if (sheet.poisonApplications.some(use => use.id === id)) return sheet
  const poison = vial.item_rules_id
  if (!id.trim() || warrior.out || warrior.kind === 'animal' || (poison !== 'black_lotus' && poison !== 'dark_venom') || vial.warband_id !== warrior.warbandId || (vial.holder_type !== 'stash' && vial.holder_id !== warrior.id) || poisonVialsRemaining(sheet, vial) < 1) throw new Error('Select an available vial of Black Lotus or Dark Venom from this warrior or the warband stash.')
  const profile = findWeapon(weaponId)
  if (!profile || isBlackpowderWeapon(profile)) throw new Error('Poison cannot be applied to a blackpowder weapon.')
  const chosen = physicalWeaponChoices(rows, events, warrior.warbandId, warrior.id, weaponId).find(choice => choice.key === weaponKey)
  if (!chosen) throw new Error('Select an intact physical weapon carried by this warrior.')
  if (profile.paired) throw new Error('A vial coats one individual weapon; paired weapons need an individual blade selection.')
  if (sheet.poisonApplications.some(use => !use.correction && use.itemRulesId === poison && `${use.weapon.itemId}:${use.weapon.copyIndex}` === weaponKey)) throw new Error('This weapon already has that poison for this battle.')
  const use: BattleLiveState['poisonApplications'][number] = { id, warriorId: warrior.id, warriorName: warrior.name, itemRowId: vial.id, itemRulesId: poison, weapon: chosen.snapshot, at: new Date().toISOString() }
  const name = poison === 'black_lotus' ? 'Black Lotus' : 'Dark Venom'
  return withRollAttempt({ ...sheet, poisonApplications: [...sheet.poisonApplications, use] }, {
    id: `poison:${id}`, at: use.at, turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${warrior.name}: applied ${name}`,
    rolls: [`One vial coats ${chosen.label} for this battle only. No other weapon is coated; inventory is settled in the post-battle report.`],
  })
}

export function correctPoisonApplication(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const use = sheet.poisonApplications.find(entry => entry.id === id)
  if (!use || use.correction) return sheet
  if (!reason.trim()) throw new Error('Explain why the poison application is being corrected.')
  return withRollAttempt({ ...sheet, poisonApplications: sheet.poisonApplications.map(entry => entry.id === id ? { ...entry, correction: reason.trim() } : entry) }, {
    id: `correct-poison:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${use.warriorName}: poison application corrected`,
    rolls: [`Vial restored and coating removed: ${reason.trim()}. Earlier attack results are unchanged; correct affected attacks separately in the combat log.`],
  })
}


export function recordedPoisonEffects(sheet: BattleLiveState, warriorId: string) {
  return sheet.poisonApplications.filter(use => use.warriorId === warriorId && !use.correction).map(use => ({
    ...itemEffect(use.itemRulesId)!.preBattle!, weaponChoiceId: `${use.weapon.itemId}:${use.weapon.copyIndex}`,
  }))
}
