import { withRollAttempt, type BattleLiveState } from './battle'
import { blackpowderMisfire } from '../rules/resolve/blackpowderMisfire'

export type BlackpowderShot = BattleLiveState['blackpowderShots'][number]

/** weaponKey identifies a physical gun/model slot, shared by all of that gun's ammunition profiles. */
export function blackpowderBlock(sheet: BattleLiveState, warriorId: string, weaponKey: string, ownTurn: number): string | null {
  const shots = sheet.blackpowderShots.filter(s => s.warriorId === warriorId && s.weaponKey === weaponKey && !s.correction)
  for (const shot of shots) {
    if (shot.misfirePending) return 'Confirm the pending misfire before using this weapon again.';
    if (shot.misfireDie === 1) return 'This weapon was destroyed by its misfire. Resolve its removal from the roster.'
    if (shot.misfireDie === 2) return 'This weapon is jammed for the rest of the battle.'
  }
  const next = Math.max(-1, ...shots.map(s => s.ownTurn + 1 + Math.max(s.reloadTurns, s.experimental && s.misfireDie !== undefined ? 1 : 0) + (s.misfireDie === 3 ? 1 : 0)))
  return ownTurn < next ? `This weapon can next fire in own turn ${next}.` : null
}

/** Declare a firing attempt once. A failed Blessing permission is not a shot and must not call this. */
export function recordBlackpowderShot(sheet: BattleLiveState, shot: BlackpowderShot, name: string): BattleLiveState {
  if (sheet.blackpowderShots.some(s => s.id === shot.id)) return sheet
  if (!Number.isInteger(shot.ownTurn) || shot.ownTurn < 0 || !Number.isInteger(shot.reloadTurns) || shot.reloadTurns < 0) throw new Error('Valid own-turn and reload values are required.')
  const blocked = blackpowderBlock(sheet, shot.warriorId, shot.weaponKey, shot.ownTurn)
  if (blocked) throw new Error(blocked)
  return withRollAttempt({ ...sheet, blackpowderShots: [...sheet.blackpowderShots, { ...shot, misfireDie: undefined, misfirePending: false, misfireOriginal: undefined, correction: undefined }] }, {
    id: shot.id, at: shot.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${name}: ${shot.weaponName} firing attempt`,
    rolls: ['Firing attempt recorded. Resolve the to-hit roll and any required misfire.'],
  })
}

/** App misfire dice are saved before confirmation; an edited result never replaces the original silently. */
export function recordMisfireDie(sheet: BattleLiveState, shotId: string, die: number, original?: number, confirmed = true): BattleLiveState {
  const shot = sheet.blackpowderShots.find(s => s.id === shotId)
  if (!shot || shot.correction || shot.misfireDie !== undefined) return sheet
  const result = blackpowderMisfire(die)
  if (original !== undefined) blackpowderMisfire(original)
  const first = shot.misfireOriginal ?? original
  return withRollAttempt({ ...sheet, blackpowderShots: sheet.blackpowderShots.map(s => s.id === shotId ? { ...s, misfireOriginal: first, misfirePending: !confirmed, misfireDie: confirmed ? die : undefined } : s) }, {
    id: `misfire:${shotId}`, at: shot.at, turn: sheet.turn, kind: 'attack', status: confirmed ? 'complete' : 'incomplete', label: `${shot.weaponName}: misfire${confirmed ? ` — ${result.name}` : ' in progress'}`,
    rolls: [first === undefined ? `Tabletop misfire D6 entered: ${die}.` : first === die ? `App rolled ${die}.` : `App rolled ${first}; player changed it to ${die}.`, ...(confirmed ? [result.detail, ...(shot.experimental && !result.weaponDestroyed ? ['Experimental weapon: reload after this result.'] : [])] : ['Awaiting confirmation; the original die is preserved.'])],
  })
}

export function correctBlackpowderShot(sheet: BattleLiveState, shotId: string, reason: string): BattleLiveState {
  const shot = sheet.blackpowderShots.find(s => s.id === shotId)
  if (!shot || shot.correction || !reason.trim()) return sheet
  return withRollAttempt({ ...sheet, blackpowderShots: sheet.blackpowderShots.map(s => s.id === shotId ? { ...s, correction: reason.trim() } : s) }, {
    id: `correct-shot:${shotId}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete', label: `${shot.weaponName}: firing correction`,
    rolls: [`Restored firing availability: ${reason.trim()}.`, 'Existing damage and roster changes are not undone; correct those separately.'],
  })
}

/** Saved BOOM results remain actionable after reloading; a logged physical break already settles that copy. */
export function pendingBlackpowderLosses(sheet: BattleLiveState, events: readonly import('./battleEvent').BattleEventRow[]) {
  return sheet.blackpowderShots.filter(shot => shot.misfireDie === 1 && !shot.correction && shot.heldWeapon && !events.some(event => !event.reverted_at && event.payload.brokenWeapons?.some(loss => loss.warbandId === shot.heldWeapon!.warbandId && loss.itemId === shot.heldWeapon!.itemId && shot.heldWeapon!.copyIndex >= loss.copyIndex && shot.heldWeapon!.copyIndex < loss.copyIndex + loss.quantity)))
}
