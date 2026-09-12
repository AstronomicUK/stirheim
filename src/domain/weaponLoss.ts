import { z } from 'zod'
import type { BattleEventRow } from './battleEvent'
import { uuidSchema, type ItemRow } from './rows'

/** Stable database row and its pre-loss state; catalogue IDs alone cannot identify a copy. */
export const brokenWeaponSchema = z.object({
  itemId: uuidSchema, warbandId: uuidSchema, holderId: uuidSchema, holderType: z.enum(['hero', 'group']),
  weaponId: z.string().min(1), name: z.string().min(1), quantity: z.number().int().positive(),
  expected: z.object({ item_rules_id: z.string().nullable(), custom_name: z.string().nullable(), quantity: z.number().int().positive(), notes: z.string().nullable() }),
})
export type BrokenWeapon = z.infer<typeof brokenWeaponSchema>

export function weaponLossSnapshot(row: ItemRow, weaponId: string, name: string, quantity = 1): BrokenWeapon {
  if (row.holder_type === 'stash' || !row.holder_id) throw new Error('Select a weapon carried by the warrior.')
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > row.quantity) throw new Error('Select an available carried weapon.')
  return brokenWeaponSchema.parse({ itemId: row.id, warbandId: row.warband_id, holderId: row.holder_id, holderType: row.holder_type, weaponId, name, quantity,
    expected: { item_rules_id: row.item_rules_id, custom_name: row.custom_name, quantity: row.quantity, notes: row.notes } })
}

export function activeWeaponLosses(events: readonly BattleEventRow[], warbandId: string): BrokenWeapon[] {
  return events.filter(e => !e.reverted_at).flatMap(e => e.payload.brokenWeapons ?? []).filter(loss => loss.warbandId === warbandId)
}

export function weaponQuantityRemaining(row: ItemRow, events: readonly BattleEventRow[]): number {
  const lost = activeWeaponLosses(events, row.warband_id).filter(loss => loss.itemId === row.id).reduce((sum, loss) => sum + loss.quantity, 0)
  return Math.max(0, row.quantity - lost)
}
