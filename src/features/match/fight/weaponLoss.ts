import { weaponLossSnapshot, weaponQuantityRemaining, type BattleEventRow, type ItemRow } from '../../../domain'
import { toRosterItem } from '../../../domain/roster'
import { loadoutOf, type Combatant } from './combatants'

/** Resolve profiles through the same loadout mapping used by the actual battle sheet. */
export function breakableWeaponChoices(rows: readonly ItemRow[], events: readonly BattleEventRow[], warbandId: string, warriorId: string, weaponId: string) {
  weaponId = weaponId.replace(/:combat(?::\d+)?$/, '')
  return rows.filter(row => row.warband_id === warbandId && row.holder_id === warriorId && row.holder_type !== 'stash' && weaponQuantityRemaining(row, events) > 0)
    .flatMap(row => {
      const kit = loadoutOf([toRosterItem(row)])
      const weapon = [...kit.melee, ...kit.ranged].find(w => w.id === weaponId)
      return weapon ? [{ row, remaining: weaponQuantityRemaining(row, events), snapshot: weaponLossSnapshot(row, weaponId, weapon.name) }] : []
    })
}

export function physicalWeaponChoices(rows: readonly ItemRow[], events: readonly BattleEventRow[], warbandId: string, warriorId: string, weaponId: string) {
  weaponId = weaponId.replace(/:combat(?::\d+)?$/, '')
  const losses = events.filter(e => !e.reverted_at).flatMap(e => e.payload.brokenWeapons ?? [])
  return breakableWeaponChoices(rows, events, warbandId, warriorId, weaponId).flatMap(choice =>
    Array.from({ length: choice.row.quantity }, (_, copyIndex) => copyIndex)
      .filter(copyIndex => !losses.some(loss => loss.itemId === choice.row.id && copyIndex >= loss.copyIndex && copyIndex < loss.copyIndex + loss.quantity))
      .map(copyIndex => ({ key: `${choice.row.id}:${copyIndex}`, snapshot: weaponLossSnapshot(choice.row, weaponId, choice.snapshot.name, 1, copyIndex), label: `${choice.snapshot.name}${choice.row.quantity > 1 ? ` · copy ${copyIndex + 1}` : ''}${choice.row.notes ? ` · ${choice.row.notes}` : ''}` })))
}

/** Battle-only availability; the stored roster is settled in the post-battle report. */
export function withBrokenWeapons<T extends { id: string; warbandId: string; groupSize?: number; tailChoice?: Combatant['tailChoice']; equipment: import('../../../rules/types/roster').RosterItem[] }>(warriors: readonly T[], rows: readonly ItemRow[], events: readonly BattleEventRow[]): T[] {
  return warriors.map(warrior => {
    const losses = rows.filter(row => row.warband_id === warrior.warbandId && row.holder_id === warrior.id && row.quantity > weaponQuantityRemaining(row, events))
    if (!losses.length) return warrior
    const equipment = warrior.equipment.map(entry => ({ ...entry }))
    const size = Math.max(1, warrior.groupSize ?? 1)
    // Match perModelKit: unevenly equipped groups retain raw stack counts.
    const models = rows.filter(row => row.warband_id === warrior.warbandId && row.holder_id === warrior.id).every(row => row.quantity % size === 0) ? size : 1
    for (const row of losses) {
      let remove = Math.ceil(row.quantity / models) - Math.ceil(weaponQuantityRemaining(row, events) / models)
      const original = toRosterItem(row)
      for (const entry of equipment) {
        if (remove <= 0) break
        if (entry.itemId !== original.itemId || entry.customName !== original.customName || (entry.notes ?? '') !== (original.notes ?? '')) continue
        const taken = Math.min(remove, entry.quantity)
        entry.quantity -= taken
        remove -= taken
      }
    }
    const tailLost = warrior.tailChoice?.weaponKey && events.some(event => !event.reverted_at && event.payload.brokenWeapons?.some(loss => Array.from({ length: loss.quantity }, (_, i) => `${loss.itemId}:${loss.copyIndex + i}`).includes(warrior.tailChoice!.weaponKey!)))
    return { ...warrior, ...(tailLost ? { tailChoice: { mode: 'none' as const } } : {}), equipment: equipment.filter(entry => entry.quantity > 0) }
  })
}
