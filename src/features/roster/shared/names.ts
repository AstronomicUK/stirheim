// Display-name lookups for rules ids. Pure, safe to call in render.

import { findItem } from '../../../rules/data/items'
import { armourClass, isBodyArmour } from '../../../rules/data/items/classify'
import type { Item } from '../../../rules/types/items'
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

/** Pistols whose price line offers a brace: two carried together are one weapon, a brace. */
export function isBraceable(itemId: string | null | undefined): boolean {
  const item = itemId ? findItem(itemId) : undefined
  return Boolean(item && /brace/i.test(item.price.text))
}

/** "Brace of Pistols" for exactly two braceable pistols; otherwise the plain name (the caller adds ×n). */
export function itemLineName(item: Pick<RosterItem, 'itemId' | 'customName' | 'quantity'>): { name: string; count: number } {
  const name = itemName(item)
  if (item.quantity === 2 && isBraceable(item.itemId)) return { name: `Brace of ${/s$/i.test(name) ? name : `${name}s`}`, count: 1 }
  return { name, count: item.quantity }
}

/** "Sword, Dagger ×2, Brace of Pistols, Light armour" */
export function equipmentSummary(items: RosterItem[]): string {
  if (items.length === 0) return 'No equipment'
  return items
    .map((i) => {
      const line = itemLineName(i)
      return line.count > 1 ? `${line.name} ×${line.count}` : line.name
    })
    .join(', ')
}

/**
 * Range, Strength and armour save as printed on a kit line: `12" · S 3`, `6+ save`. Given the rest
 * of the warrior's kit, body armour and a shield each also show the save they make together
 * (`4+ save · 3+ with shield`, `6+ save · 3+ with Gromril armour`). Null when the catalogue has none.
 */
export function itemProfile(item: Pick<RosterItem, 'itemId'>, companions: readonly Pick<RosterItem, 'itemId'>[] = []): string | null {
  const catalogue = item.itemId ? findItem(item.itemId) : undefined
  if (!catalogue) return null
  const bits = [catalogue.range, catalogue.strength ? `S ${catalogue.strength}` : null, catalogue.armourSave ? `${catalogue.armourSave}+ save` : null].filter(Boolean)
  if (catalogue.armourSave) {
    const others = companions.map((c) => (c.itemId ? findItem(c.itemId) : undefined)).filter((c): c is Item => Boolean(c) && c!.id !== catalogue.id)
    const cls = armourClass(catalogue)
    if (isBodyArmour(catalogue)) {
      const shield = others.find((o) => armourClass(o) === 'shield')
      if (shield) bits.push(`${catalogue.armourSave - 1}+ with ${shield.name.toLowerCase()}`)
    } else if (cls === 'shield') {
      const body = others.find((o) => isBodyArmour(o) && o.armourSave)
      if (body?.armourSave) bits.push(`${body.armourSave - 1}+ with ${body.name}`)
    }
  }
  return bits.length > 0 ? bits.join(' · ') : null
}

/**
 * A name for one model in a henchman group's slot, falling back to "Model N" for a slot nobody
 * named. A blank line in the list (a name cleared without shortening the list) counts as missing.
 */
export function modelLabel(modelNames: string[] | undefined, index: number): string {
  const named = modelNames?.[index]?.trim()
  return named ? named : `Model ${index + 1}`
}
