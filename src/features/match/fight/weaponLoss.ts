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
