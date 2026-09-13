import type { Combatant } from './combatants'
import type { Weapon } from '../../../rules/types'

export function powderKegTarget(name: string, warbandId: string): Combatant {
  return { id: `scenery:powder-keg:${name.trim().toLowerCase()}`, name: name.trim() || 'Powder Keg', typeName: 'Powder Keg — Toughness 4', kind: 'henchman', warbandId, warbandName: 'Scenery', stats: { M: 0, WS: 0, BS: 0, S: 0, T: 4, W: 1, I: 0, A: 0, Ld: 0 }, equipment: [], skillIds: [], traitIds: ['immune_to_poison', 'immune_to_psychology'], out: false, woundsLost: 0, groupSize: 1 }
}
export function canIgnitePowderKeg(weapon: Weapon, usedItems: readonly string[] = []): boolean {
  if (weapon.type === 'melee') return /(?:^|_)(torch|brazier_iron)(?:_|$)/.test(weapon.id)
  if (usedItems.includes('fire_arrows') && /bow/.test(weapon.id) && !/crossbow/.test(weapon.id)) return true
  if (/crossbow/.test(weapon.id)) return false
  return /(?:pistol|handgun|long_rifle|longrifle|swivel_gun|cathayan_candles|fire_bomb|firebomb|fire_arrows)/.test(weapon.id) || weapon.special.includes('fireArrows')
}
