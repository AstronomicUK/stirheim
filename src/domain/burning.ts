import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'

/** A successful extinguishing attempt clears only the ignition events it actually covered. */
export function activeFires(state: BattleLiveState, events: readonly BattleEventRow[], warbandId: string) {
  const cleared = new Set(state.fireRecoveryTests.filter(t => t.confirmed && t.die >= 4).flatMap(t => t.eventIds))
  return events.filter(e => !e.reverted_at && e.payload.targetOnFire && !e.payload.out_of_action && e.payload.target_warband_id === warbandId && !cleared.has(e.id))
}

export function warriorIsBurning(state: BattleLiveState, events: readonly BattleEventRow[], warbandId: string, warriorId: string): boolean {
  return activeFires(state, events, warbandId).some(e => e.payload.target_id === warriorId && e.payload.target_size === 1)
}

/** Only a failed victim test causes the S4 hit; a helper's failure does not. */
export function pendingFireHits(state: BattleLiveState, events: readonly BattleEventRow[]) {
  return state.fireRecoveryTests.filter(t => t.confirmed && t.die < 4 && t.actorId === t.warriorId
    && t.eventIds.some(id => events.some(e => e.id === id && !e.reverted_at))
    && !events.some(e => !e.reverted_at && e.payload.fireRecoveryId === t.id))
}

export function recordFireRecovery(state: BattleLiveState, events: readonly BattleEventRow[], options: {
  id: string; warbandId: string; warriorId: string; warriorName: string; actorId: string; actorName: string;
  turnKey: string; die: number; originalDie?: number; reason?: string; pending?: boolean;
}): BattleLiveState {
  const { id, warriorId, actorId, turnKey, die, originalDie } = options
  if (!Number.isInteger(die) || die < 1 || die > 6 || originalDie !== undefined && (!Number.isInteger(originalDie) || originalDie < 1 || originalDie > 6)) throw new Error('Enter a D6 result from 1 to 6.')
  const existing = state.fireRecoveryTests.find(t => t.id === id)
  if (existing && (existing.warriorId !== warriorId || existing.actorId !== actorId || existing.turnKey !== turnKey)) throw new Error('This attempt belongs to a different warrior or turn.')
  const earlier = state.fireRecoveryTests.filter(t => t.warriorId === warriorId && t.actorId === actorId && t.turnKey === turnKey && t.id !== id)
  if ((earlier.length || existing?.confirmed) && !options.reason?.trim()) throw new Error('Explain why the fire recovery attempt is being corrected.')
  const active = activeFires(state, events, options.warbandId).filter(e => e.payload.target_id === warriorId)
  // Corrections retain their original ignition set, including after a successful attempt.
  const eventIds = existing?.eventIds ?? earlier.at(-1)?.eventIds ?? active.map(e => e.id)
  if (!eventIds.length || !eventIds.some(id => events.some(e => e.id === id && !e.reverted_at && e.payload.targetOnFire && e.payload.target_size === 1))) throw new Error('There is no active fire on an individually identified warrior.')
  const original = existing?.originalDie ?? originalDie
  if (existing?.originalDie !== undefined && originalDie !== undefined && originalDie !== existing.originalDie) throw new Error('Keep the original app roll when correcting the result.')
  const result = { id, warriorId, actorId, actorName: options.actorName, turnKey, eventIds, die, originalDie: original, confirmed: !options.pending }
  const replaced = new Set([id, ...earlier.map(t => t.id)])
  return withRollAttempt({ ...state, fireRecoveryTests: [...state.fireRecoveryTests.filter(t => !replaced.has(t.id)), result] }, {
    id, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: options.pending ? 'incomplete' : 'complete',
    label: `${options.warriorName}: ${actorId === warriorId ? 'extinguish fire' : `fire assistance from ${options.actorName}`}`,
    rolls: [...(options.reason?.trim() ? [`Correction: ${options.reason.trim()}`] : []), original === undefined ? `Player entered ${die}.` : `App rolled ${original}${die !== original ? `; player changed it to ${die}` : ''}.`,
      options.pending ? 'Awaiting confirmation.' : die >= 4 ? 'Fire extinguished (4+).' : actorId === warriorId ? 'Still on fire: resolve one automatic Strength 4 hit. Only movement is allowed while burning.' : 'The helper failed to extinguish the fire (needs 4+); no extra hit from this assistance attempt.']
  })
}
