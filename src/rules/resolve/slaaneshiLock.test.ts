import { describe, expect, it } from 'vitest'
import { canSlaaneshiLock, placeSlaaneshiLock, releaseSlaaneshiLock, slaaneshiEndBattleCaptures, slaaneshiLockRestrictions, type SlaaneshiLock } from './slaaneshiLock'
const lock = (id = 'one', modelIndex = 0): SlaaneshiLock => ({ id, sourceEventId: `event-${id}`, wielder: { warbandId: 'court', warriorId: `whipmaster-${id}` }, target: { warbandId: 'enemy', warriorId: 'henchmen', modelIndex }, targetName: 'Warrior', held: true })
describe('Slaaneshi Man-Catcher lifecycle', () => {
  it('requires the weapon’s unsaved wound and excludes Large models and steeds', () => {
    const hit = { usedManCatcher: true, unsavedWounds: 1, targetLarge: false, targetSteed: false }
    expect(canSlaaneshiLock(hit)).toBe(true)
    expect(canSlaaneshiLock({ ...hit, unsavedWounds: 0 })).toBe(false)
    expect(canSlaaneshiLock({ ...hit, usedManCatcher: false })).toBe(false)
    expect(canSlaaneshiLock({ ...hit, targetLarge: true })).toBe(false)
    expect(canSlaaneshiLock({ ...hit, targetSteed: true })).toBe(false)
  })
  it('holds particular henchmen rather than the whole group, with one target per catcher', () => {
    const first = placeSlaaneshiLock([], lock())
    expect(() => placeSlaaneshiLock(first, lock('two'))).toThrow(/already held/)
    expect(placeSlaaneshiLock(first, lock('two', 1))).toHaveLength(2)
    expect(() => placeSlaaneshiLock(first, { ...lock('two', 1), wielder: first[0].wielder })).toThrow(/already holding/)
  })
  it('prevents ordinary recovery and movement while held, and dragging when otherwise engaged', () => {
    expect(slaaneshiLockRestrictions(lock(), false)).toEqual({ targetCanRecoverNormally: false, targetCanMoveNormally: false, wielderCanDragTarget: true })
    expect(slaaneshiLockRestrictions(lock(), true).wielderCanDragTarget).toBe(false)
    const [released] = releaseSlaaneshiLock([lock()], 'one', 'weaponSwitched')
    expect(slaaneshiLockRestrictions(released, false)).toEqual({ targetCanRecoverNormally: true, targetCanMoveNormally: true, wielderCanDragTarget: false })
  })
  it('converts only confirmed remaining holds to Captured 61 without inventing kill experience', () => {
    const locks = releaseSlaaneshiLock([lock(), lock('two', 1)], 'two', 'magicEscape')
    expect(slaaneshiEndBattleCaptures(locks, ['one'])).toEqual([{ lockId: 'one', sourceEventId: 'event-one', victim: locks[0].target, captorWarbandId: 'court', injuryRoll: 61, killXp: 0 }])
    expect(() => slaaneshiEndBattleCaptures(locks, [])).toThrow(/Confirm every remaining hold/)
    expect(() => slaaneshiEndBattleCaptures(locks, ['one', 'two'])).toThrow(/released hold/)
    expect(slaaneshiEndBattleCaptures(releaseSlaaneshiLock(locks, 'one', 'meleeEnded'), [])).toEqual([])
  })
})
