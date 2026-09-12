import { expect, it } from 'vitest'
import { reloadTurnsFor } from './reloadRules'
const pistol = { id: 'pistol', special: ['prepareShotReloadEveryOtherTurnUnlessBrace'] }
const handgun = { id: 'handgun', special: ['prepareShotReloadEveryOtherTurn'] }
it('keeps normal reload per physical pistol, allowing two copies to alternate', () => {
 expect(reloadTurnsFor(pistol, [], 1)).toBe(1)
 expect(reloadTurnsFor(pistol, [], 2)).toBe(1)
})
it('Pistolier accelerates a single pistol but does not remove brace reloads', () => {
 expect(reloadTurnsFor(pistol, ['pistolier'], 1)).toBe(0)
 expect(reloadTurnsFor(pistol, ['pistolier'], 2)).toBe(1)
})
it('Hunter only accelerates its specified weapons', () => {
 expect(reloadTurnsFor(handgun, ['hunter'])).toBe(0)
 expect(reloadTurnsFor(pistol, ['hunter'])).toBe(1)
 expect(reloadTurnsFor(handgun, [])).toBe(1)
 expect(reloadTurnsFor({ id: 'bow', special: [] }, ['hunter'])).toBeNull()
})
