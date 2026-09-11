export interface BlackpowderMisfire {
  roll: number
  name: string
  fires: boolean
  strengthBonus: number
  selfHit: { strength: number; criticals: false } | null
  weaponDestroyed: boolean
  jammedForBattle: boolean
  extraReloadTurns: number
  detail: string
}

/** Rulebook optional misfire table, mandatory for Swivel Guns and Experimental weapons (03:4319–4331). */
export function blackpowderMisfire(roll: number): BlackpowderMisfire {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new Error('A misfire requires a D6 result from 1 to 6.')
  const base = { roll, fires: false, strengthBonus: 0, selfHit: null, weaponDestroyed: false, jammedForBattle: false, extraReloadTurns: 0 }
  switch (roll) {
    case 1: return { ...base, name: 'BOOM!', selfHit: { strength: 4, criticals: false }, weaponDestroyed: true, detail: 'The weapon is destroyed. The shooter takes one Strength 4 hit, which cannot cause a critical hit.' }
    case 2: return { ...base, name: 'Jammed', jammedForBattle: true, detail: 'The weapon is unusable for the rest of this battle. It works normally in the next battle.' }
    case 3: return { ...base, name: 'Phut', extraReloadTurns: 1, detail: 'The shot must be removed. Wait one extra own turn before firing this weapon again.' }
    case 4:
    case 5: return { ...base, name: 'Click', detail: 'The weapon fails to fire. There is no additional effect.' }
    default: return { ...base, name: 'KA-BOOM!', fires: true, strengthBonus: 1, detail: 'The shot hits the intended target at +1 Strength.' }
  }
}
