/** Full own turns a fired physical weapon must spend reloading. Does not grant extra shots. */
export function doubleBarrelReloadSkill(weaponId: string, skills: readonly string[]): 'hunter' | 'pistolier' | null {
  if (['double_barrelled_pistol', 'double_barrelled_duelling_pistol', 'ostlander_double_barrelled_pistol'].includes(weaponId) && skills.includes('pistolier')) return 'pistolier'
  if (['double_barrelled_handgun', 'ostlander_double_barrelled_hunting_rifle'].includes(weaponId) && skills.includes('hunter')) return 'hunter'
  return null
}

export function reloadTurnsFor(weapon: { id: string; special: readonly string[] }, skills: readonly string[], pistolCount = 1): number | null {
  const pistol = weapon.special.includes('prepareShotReloadEveryOtherTurnUnlessBrace')
  const slow = weapon.special.includes('prepareShotReloadEveryOtherTurn')
  if (!pistol && !slow) return null
  // Core Pistolier: a single pistol may fire in the turn it reloads. A brace still uses normal reloads.
  if (pistol && pistolCount === 1 && skills.includes('pistolier')) return 0
  // Hunter changes handgun/long-rifle cadence, not every blackpowder weapon.
  if (skills.includes('hunter') && ['handgun', 'hochland_long_rifle'].includes(weapon.id)) return 0
  return 1
}
