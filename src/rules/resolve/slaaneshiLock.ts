import { RulesError } from './errors'

/** Slaaneshi Man-Catcher, grade-1c.md:915–917. These are table facts, not distances inferred by the app. */
export interface SlaaneshiLock {
  id: string
  sourceEventId: string
  wielder: { warbandId: string; warriorId: string }
  target: { warbandId: string; warriorId: string; modelIndex: number }
  targetName: string
  held: boolean
  releasedBecause?: LockReleaseReason
}
export type LockReleaseReason = 'weaponSwitched' | 'magicEscape' | 'meleeEnded' | 'wielderOutOfAction' | 'targetOutOfAction'

export function canSlaaneshiLock(input: { usedManCatcher: boolean; unsavedWounds: number; targetLarge: boolean; targetSteed: boolean }) {
  return input.usedManCatcher && input.unsavedWounds > 0 && !input.targetLarge && !input.targetSteed
}

/** One physical catcher holds one model, including one individual within a henchman group. */
export function placeSlaaneshiLock(locks: readonly SlaaneshiLock[], lock: SlaaneshiLock): SlaaneshiLock[] {
  if (!Number.isInteger(lock.target.modelIndex) || lock.target.modelIndex < 0) throw new RulesError('lock.model', 'Choose the particular model being held.')
  if (!lock.held || lock.releasedBecause) throw new RulesError('lock.state', 'A new hold must still be in effect.')
  if (lock.wielder.warbandId === lock.target.warbandId) throw new RulesError('lock.enemy', 'Choose an enemy model for the Man-Catcher.')
  if (locks.some(l => l.id === lock.id || l.sourceEventId === lock.sourceEventId)) throw new RulesError('lock.duplicate', 'This Man-Catcher result is already recorded.')
  if (locks.some(l => l.held && l.wielder.warbandId === lock.wielder.warbandId && l.wielder.warriorId === lock.wielder.warriorId)) throw new RulesError('lock.occupied', 'This wielder is already holding a model. Resolve that hold first.')
  if (locks.some(l => l.held && l.target.warbandId === lock.target.warbandId && l.target.warriorId === lock.target.warriorId && l.target.modelIndex === lock.target.modelIndex)) throw new RulesError('lock.targetHeld', 'That model is already held by a Man-Catcher.')
  return [...locks, lock]
}

/** Releasing the hold does not stand the victim up; normal Recovery is still required. */
export function releaseSlaaneshiLock(locks: readonly SlaaneshiLock[], id: string, reason: LockReleaseReason): SlaaneshiLock[] {
  if (!locks.some(l => l.id === id && l.held)) throw new RulesError('lock.notHeld', 'This Man-Catcher hold has already ended.')
  return locks.map(l => l.id === id ? { ...l, held: false, releasedBecause: reason } : l)
}

export function slaaneshiLockRestrictions(lock: SlaaneshiLock, wielderEngagedWithAnotherModel: boolean) {
  return { targetCanRecoverNormally: !lock.held, targetCanMoveNormally: !lock.held, wielderCanDragTarget: lock.held && !wielderEngagedWithAnotherModel }
}

/** Only a hold confirmed to remain at the end becomes Captured 61. No kill XP is implied. */
export function slaaneshiEndBattleCaptures(locks: readonly SlaaneshiLock[], stillHeldIds: readonly string[]) {
  if (new Set(stillHeldIds).size !== stillHeldIds.length) throw new RulesError('lock.duplicateConfirmation', 'Confirm each held model only once.')
  if (locks.some(lock => lock.held && !stillHeldIds.includes(lock.id))) throw new RulesError('lock.unconfirmed', 'Confirm every remaining hold, or record why it ended before finishing the battle.')
  return stillHeldIds.map(id => {
    const lock = locks.find(l => l.id === id && l.held)
    if (!lock) throw new RulesError('lock.ended', 'A released hold cannot become an end-of-battle capture.')
    return { lockId: lock.id, sourceEventId: lock.sourceEventId, victim: lock.target, captorWarbandId: lock.wielder.warbandId, injuryRoll: 61 as const, killXp: 0 as const }
  })
}
