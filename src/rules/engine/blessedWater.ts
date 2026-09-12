import type { Character, Weapon } from '../types'
import { buildAttackInput, type BuildAttackInputParams } from './buildAttackInput'
import { IMPOSSIBLE } from './dice'

/** Core equipment, reference/rules/02-weapons-armour-equipment.md:1495.
 * Not a catalogue weapon: the battle action must reserve one carried vial per throw.
 */
export function blessedWaterWeapon(attacker: Character): Weapon {
  if (attacker.traits.some(trait => trait === 'undead' || trait === 'possessed')) {
    throw new Error('Undead and Possessed models may not use Blessed Water.')
  }
  return {
    id: 'blessed_water', name: 'Blessed Water', type: 'ranged', strength: 'user',
    critCategory: 'missile', concussion: false, noCriticals: true,
    ignoresArmourSave: true, maxAttacks: 1,
    special: ['thrownWeaponNoRangeOrMovingPenalty'],
    rangedProfile: { shortRange: attacker.stats.S, maxRange: 2 * attacker.stats.S, shotsPerTurn: 1 },
  }
}

export function blessedWaterAttack(params: Omit<BuildAttackInputParams, 'weapon'>) {
  const weapon = blessedWaterWeapon(params.attacker)
  const input = buildAttackInput({ ...params, weapon })
  return {
    ...input,
    automaticWound: params.defender.activeTraitIds.some(trait => ['undead', 'daemon', 'possessed'].includes(trait)),
    // Ordinary targets take no damage; qualifying targets skip the wound die entirely.
    woundThreshold: IMPOSSIBLE,
    armourThreshold: IMPOSSIBLE,
    critTriggerFaces: [],
    autoWoundOnNaturalSixToHit: false,
  }
}
