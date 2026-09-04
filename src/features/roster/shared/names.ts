// Display-name lookups for rules ids. Pure, safe to call in render.

import { findItem } from '../../../rules/data/items'
import { findUnitTemplate, findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterItem } from '../../../rules/types/roster'

export function warbandTypeName(typeRulesId: string): string {
  return findWarbandTemplate(typeRulesId)?.name ?? typeRulesId
}

export function unitTypeName(typeRulesId: string, unitRulesId: string): string {
  const template = findWarbandTemplate(typeRulesId)
  return (template && findUnitTemplate(template, unitRulesId)?.name) ?? unitRulesId
}

export function itemName(item: Pick<RosterItem, 'itemId' | 'customName'>): string {
  if (item.itemId) return findItem(item.itemId)?.name ?? item.itemId
  return item.customName ?? 'Unnamed item'
}

/** "Sword, Dagger ×2, Light armour" */
export function equipmentSummary(items: RosterItem[]): string {
  if (items.length === 0) return 'No equipment'
  return items.map((i) => (i.quantity > 1 ? `${itemName(i)} ×${i.quantity}` : itemName(i))).join(', ')
}
