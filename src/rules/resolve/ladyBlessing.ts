import { ITEMS } from '../data/items'
import type { Weapon } from '../types'

const BLACKPOWDER = new Set(ITEMS.filter(item => item.category === 'blackpowder').flatMap(item => [item.weaponId, ...(item.additionalWeaponIds ?? [])]).filter((id): id is string => Boolean(id)))
BLACKPOWDER.add('veskit_warplock_pistols')
export function isBlackpowderWeapon(weapon: Weapon): boolean {
  return BLACKPOWDER.has(weapon.physicalWeaponId ?? weapon.id) || weapon.special.includes('blackpowderMisfireRulesAlwaysOn') || weapon.special.includes('experimentalBlackpowderRulesAlwaysOn')
}
const KNIGHTS = new Set(['bretonnian_knights_questing_knight', 'bretonnian_knights_knight_errant'])

export function ladyBlessingActive(warbandTemplateId: string, preBattle: Record<string, string>): boolean {
  return warbandTemplateId === 'bretonnian_knights' && Object.entries(preBattle).some(([key, result]) => key.startsWith('blessing:') && result === 'passed')
}

/** A global blackpowder curse, plus protection for the two printed Knight types against other missiles. */
export function ladyBlessingReason(weapon: Weapon, attackerWarbandId: string, targetWarbandId: string, targetUnitId: string | undefined, blessedWarbandIds: readonly string[]): string | undefined {
  const opponents = blessedWarbandIds.filter(id => id !== attackerWarbandId)
  if (!opponents.length) return
  if (isBlackpowderWeapon(weapon)) return 'Blessing of the Lady: roll 4+ before firing this blackpowder shot.'
  if (weapon.type === 'ranged' && opponents.includes(targetWarbandId) && targetUnitId && KNIGHTS.has(targetUnitId)) return 'Blessing of the Lady: roll 4+ before shooting at this Questing Knight or Knight Errant.'
}
