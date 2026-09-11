import type { Weapon } from '../types'

/** Printed weapon exceptions shared by the calculation and its situation controls. */
export function missilePenaltyRules(weapon: Weapon) {
  const balanced = weapon.special.includes('thrownWeaponNoRangeOrMovingPenalty')
  return {
    ignoresMovement: weapon.type === 'ranged' && balanced,
    ignoresLongRange: weapon.type === 'ranged' && (balanced || weapon.special.includes('thrownWeaponNoRangePenalty') || weapon.special.includes('accurateIgnoresLongRangePenalty')),
  }
}
