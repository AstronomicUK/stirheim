import { resolveEquipmentName } from '../data/items/aliases'
import type { RosterItem } from '../types/roster'
const key = (item: RosterItem) => item.itemId ?? resolveEquipmentName(item.customName ?? '')?.id ?? `custom:${item.customName?.trim().toLowerCase()}`
/** Match old aliases as well as catalogue ids; never remove or replace existing equipment. */
export function missingHiredEquipment(held: RosterItem[], expected: RosterItem[]): RosterItem[] {
  const available = new Map<string, number>()
  for (const item of held) available.set(key(item), (available.get(key(item)) ?? 0) + item.quantity)
  const missing: RosterItem[] = []
  for (const item of expected) {
    const owned = available.get(key(item)) ?? 0
    available.set(key(item), Math.max(0, owned - item.quantity))
    if (owned < item.quantity) missing.push({ ...item, quantity: item.quantity - owned })
  }
  return missing
}
export function restoreHiredEquipment(held: RosterItem[], expected: RosterItem[], selected: number[]): RosterItem[] {
  const missing = missingHiredEquipment(held, expected)
  if (new Set(selected).size !== selected.length || selected.some(i => !Number.isInteger(i) || !missing[i])) throw new Error('Review the equipment selection again.')
  return [...held, ...selected.map(i => ({...missing[i]}))]
}
