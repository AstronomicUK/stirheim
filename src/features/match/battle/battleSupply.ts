// The dose an addicted hero's habit used up at battle start (addiction_supplies ledger, #139/#140)
// must still be his to take on the battle sheet: "Took Crimson Shade" is what gives the +1 S / +D3 I.
// Stock was decremented by start_match, so when that was his last copy the roster no longer shows it.
// This lays the carried dose back over the battle roster only — stock is not resurrected — so the
// fight tab's "Taken this battle" list offers it for exactly that hero.

import type { RosterWarband } from '../../../rules/types/roster'

export interface BattleSupplyRow {
  hero_id: string
  item_rules_id: string
  source: 'kit' | 'stash'
}

export const BATTLE_SUPPLY_NOTE = 'Battle supply: the dose his habit used up before this battle'

export function withBattleSupplies(roster: RosterWarband, supplies: readonly BattleSupplyRow[]): RosterWarband {
  if (supplies.length === 0) return roster
  let changed = false
  const heroes = roster.heroes.map((hero) => {
    const owed = supplies.filter((s) => s.hero_id === hero.id)
    if (owed.length === 0) return hero
    const missing = owed.filter((s) => !hero.equipment.some((i) => i.itemId === s.item_rules_id && i.quantity > 0))
    if (missing.length === 0) return hero
    changed = true
    return { ...hero, equipment: [...hero.equipment, ...missing.map((s) => ({ itemId: s.item_rules_id, quantity: 1, notes: BATTLE_SUPPLY_NOTE }))] }
  })
  return changed ? { ...roster, heroes } : roster
}
