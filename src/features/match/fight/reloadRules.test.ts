import { expect, it } from 'vitest'
import { reloadTurnsFor } from './reloadRules'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import { blackpowderBlock, correctBlackpowderShot, recordBlackpowderShot } from '../../../domain/blackpowderShot'
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

it('preserves handgun reload across reopening the battle without blocking another group member’s gun', () => {
 const shot = { id: 'handgun-shot', warriorId: 'marksmen', weaponKey: 'item:handguns:0', weaponName: 'Handgun', ownTurn: 1, reloadTurns: reloadTurnsFor(handgun, [])!, experimental: false, at: '2026-09-12T10:00:00Z' }
 const saved = recordBlackpowderShot(emptyBattleLiveState(), shot, 'Marksmen')
 const reopened = parseBattleLiveState(JSON.parse(JSON.stringify(saved)))
 expect(blackpowderBlock(reopened, 'marksmen', shot.weaponKey, 1)).toContain('turn 3')
 expect(blackpowderBlock(reopened, 'marksmen', shot.weaponKey, 2)).toContain('turn 3')
 expect(blackpowderBlock(reopened, 'marksmen', shot.weaponKey, 3)).toBeNull()
 expect(blackpowderBlock(reopened, 'marksmen', 'item:handguns:1', 1)).toBeNull()
 const corrected = correctBlackpowderShot(reopened, shot.id, 'Wrong group member selected')
 expect(blackpowderBlock(corrected, 'marksmen', shot.weaponKey, 1)).toBeNull()
 expect(corrected.rollAttempts.flatMap(attempt => attempt.rolls).join(' ')).toContain('Wrong group member selected')
})

it('allows a Hunter to fire next own turn but never grants another shot in the same turn', () => {
 const shot = { id: 'hunter-shot', warriorId: 'hero', weaponKey: 'handgun', weaponName: 'Handgun', ownTurn: 1, reloadTurns: reloadTurnsFor(handgun, ['hunter'])!, experimental: false, at: '2026-09-12T10:00:00Z' }
 const saved = recordBlackpowderShot(emptyBattleLiveState(), shot, 'Hunter')
 expect(blackpowderBlock(saved, 'hero', 'handgun', 1)).toContain('turn 2')
 expect(blackpowderBlock(saved, 'hero', 'handgun', 2)).toBeNull()
})
