import type { Weapon } from '../types'

/** Core rulebook pp29–32. The crossbow pistol's BS shot is a separate opening action. */
export function corePistolCombatProfile(source: Weapon): Weapon | null {
  if (!['pistol', 'duelling_pistol', 'warplock_pistol', 'crossbow_pistol'].includes(source.id)) return null
  const crossbow = source.id === 'crossbow_pistol'
  return {
    ...source, id: `${source.id}:combat`, physicalWeaponId: source.id,
    name: `${source.name} (${crossbow ? 'opening shot' : 'close combat'})`,
    type: crossbow ? 'ranged' : 'melee', fixedAttacks: 1, maxAttacks: 1,
    rangedProfile: crossbow ? { shortRange: 5, maxRange: 10, shotsPerTurn: 1 } : null,
    moveOrFire: false, paired: false,
    toHitBonus: crossbow ? -2 : source.toHitBonus,
    special: [crossbow ? 'crossbowPistolOpeningShot' : 'pistolHandToHand'],
  }
}
