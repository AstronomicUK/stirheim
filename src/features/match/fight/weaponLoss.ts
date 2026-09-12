import { weaponLossSnapshot, weaponQuantityRemaining, type BattleEventRow, type ItemRow } from '../../../domain'
import { toRosterItem } from '../../../domain/roster'
import { loadoutOf } from './combatants'

/** Resolve profiles through the same loadout mapping used by the actual battle sheet. */
export function breakableWeaponChoices(rows: readonly ItemRow[], events: readonly BattleEventRow[], warbandId: string, warriorId: string, weaponId: string) {
  return rows.filter(row => row.warband_id === warbandId && row.holder_id === warriorId && row.holder_type !== 'stash' && weaponQuantityRemaining(row, events) > 0)
    .flatMap(row => {
      const kit = loadoutOf([toRosterItem(row)])
      const weapon = [...kit.melee, ...kit.ranged].find(w => w.id === weaponId)
      return weapon ? [{ row, remaining: weaponQuantityRemaining(row, events), snapshot: weaponLossSnapshot(row, weaponId, weapon.name) }] : []
    })
}

export function physicalWeaponChoices(rows: readonly ItemRow[], events: readonly BattleEventRow[], warbandId: string, warriorId: string, weaponId: string) {
  const losses = events.filter(e => !e.reverted_at).flatMap(e => e.payload.brokenWeapons ?? [])
  return breakableWeaponChoices(rows, events, warbandId, warriorId, weaponId).flatMap(choice =>
    Array.from({ length: choice.row.quantity }, (_, copyIndex) => copyIndex)
      .filter(copyIndex => !losses.some(loss => loss.itemId === choice.row.id && copyIndex >= loss.copyIndex && copyIndex < loss.copyIndex + loss.quantity))
      .map(copyIndex => ({ key: `${choice.row.id}:${copyIndex}`, snapshot: weaponLossSnapshot(choice.row, weaponId, choice.snapshot.name, 1, copyIndex), label: `${choice.snapshot.name}${choice.row.quantity > 1 ? ` · copy ${copyIndex + 1}` : ''}${choice.row.notes ? ` · ${choice.row.notes}` : ''}` })))
}
