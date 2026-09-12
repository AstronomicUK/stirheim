import { withRollAttempt, type BattleLiveState } from './battle'
import { recordBlackpowderShot, recordMisfireDie, correctBlackpowderShot, blackpowderBlock } from './blackpowderShot'
import type { LineShotTarget } from './lineShot'
import type { BattleEventRow } from './battleEvent'
export type MortarShot = BattleLiveState['mortarShots'][number]
export type MortarStage = MortarShot['stage']
const label: Record<MortarStage, string> = { permission: 'firing permission', hit: 'to hit', misfire: 'misfire', scatter: 'scatter', blast: 'blast victims', stopped: 'shot stopped', complete: 'blast' }
function active(sheet: BattleLiveState, id: string) { return sheet.mortarShots.find(s => s.id === id && !s.correction) }
function replace(sheet: BattleLiveState, shot: MortarShot): BattleLiveState { return { ...sheet, mortarShots: sheet.mortarShots.map(s => s.id === shot.id ? shot : s) } }
function fire(sheet: BattleLiveState, shot: MortarShot) { return recordBlackpowderShot(sheet, { id: shot.id, warriorId: shot.warriorId, weaponKey: shot.weaponKey, weaponName: 'Hand-held Mortar', heldWeapon: shot.heldWeapon, ownTurn: shot.ownTurn, reloadTurns: 1, experimental: true, at: shot.at }, shot.shooterName) }
export function beginMortarShot(sheet: BattleLiveState, input: Omit<MortarShot, 'stage' | 'original' | 'strength' | 'onTarget' | 'targets' | 'scatter' | 'correction'>): BattleLiveState {
  if (sheet.mortarShots.some(s => s.id === input.id)) return sheet
  const blocked = blackpowderBlock(sheet, input.warriorId, input.weaponKey, input.ownTurn)
  if (blocked) throw new Error(blocked)
  if (sheet.mortarShots.some(s => s.warriorId === input.warriorId && s.weaponKey === input.weaponKey && !s.correction && (s.ownTurn === input.ownTurn || !['complete', 'stopped'].includes(s.stage)))) throw new Error('Finish or correct the earlier Mortar attempt first.')
  if (!Number.isInteger(input.ownTurn) || input.ownTurn < 0 || !Number.isFinite(input.hitThreshold)) throw new Error('Valid turn and hit threshold required.')
  const shot: MortarShot = { ...input, primary: { ...input.primary }, strength: 4, onTarget: false, stage: input.permissionRequired ? 'permission' : 'hit' }
  let next = { ...sheet, mortarShots: [...sheet.mortarShots, shot] }
  if (!input.permissionRequired) next = fire(next, shot)
  return withRollAttempt(next, { id: `mortar-start:${shot.id}`, at: shot.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${shot.shooterName}: Mortar launch`, rolls: [`Intended target: ${shot.primary.name}.`, `Awaiting ${label[shot.stage]}.`] })
}
function validDice(stage: MortarStage, dice: readonly number[]) {
  const sides = stage === 'scatter' ? [6, 6, 12] : ['permission', 'hit', 'misfire'].includes(stage) ? [6] : []
  return sides.length > 0 && dice.length === sides.length && dice.every((d, i) => Number.isInteger(d) && d >= 1 && d <= sides[i])
}
/** Record before revealing an app roll. Stage guards make stale/repeated callbacks harmless. */
export function rollMortarStage(sheet: BattleLiveState, id: string, stage: MortarStage, dice: readonly number[]): BattleLiveState {
  const shot = active(sheet, id)
  if (!shot || shot.stage !== stage || shot.original) return sheet
  if (!validDice(stage, dice)) throw new Error('Invalid Mortar dice.')
  return withRollAttempt(replace(sheet, { ...shot, original: [...dice] }), { id: `mortar-${stage}:${id}`, at: shot.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${shot.shooterName}: Mortar ${label[stage]}`, rolls: [`App rolled ${dice.join(', ')}. Awaiting confirmation; changes retain these originals.`] })
}
export function confirmMortarStage(sheet: BattleLiveState, id: string, stage: MortarStage, dice: readonly number[]): BattleLiveState {
  const shot = active(sheet, id)
  if (!shot || shot.stage !== stage) return sheet
  if (!validDice(stage, dice)) throw new Error('Invalid Mortar dice.')
  let next = sheet
  const saved = { ...shot, original: undefined }
  let outcome = ''
  const die = dice[0]
  if (stage === 'permission') {
    saved.stage = die >= 4 ? 'hit' : 'stopped'
    if (die >= 4) next = fire(next, shot)
    outcome = die >= 4 ? 'Passed: fire one shell.' : 'Failed: no shell fired and no reload consumed.'
  } else if (stage === 'hit') {
    saved.onTarget = die > 1 && (die === 6 || die >= shot.hitThreshold)
    saved.stage = die === 1 ? 'misfire' : saved.onTarget ? 'blast' : 'scatter'
    if (die === 1) next = { ...next, blackpowderShots: next.blackpowderShots.map(s => s.id === id ? { ...s, misfirePending: true } : s) }
    outcome = die === 1 ? 'Natural 1: resolve the mandatory misfire before any scatter.' : saved.onTarget ? 'On target: select the central model and everyone within 1½ inches.' : 'Missed: scatter 2D6 inches in a random direction.'
  } else if (stage === 'misfire') {
    next = recordMisfireDie(next, id, die, shot.original?.[0])
    saved.stage = die === 6 ? 'blast' : 'stopped'
    saved.onTarget = die === 6
    saved.strength = die === 6 ? 5 : 4
    outcome = die === 6 ? 'KA-BOOM: hits the intended target at +1 Strength. Select the blast victims.' : 'No shell reaches the target; do not scatter. Follow the recorded misfire consequences.'
  } else if (stage === 'scatter') {
    saved.stage = 'blast'; saved.scatter = [...dice]
    outcome = `Scatter ${dice[0] + dice[1]} inches toward ${dice[2]} o’clock (12 is directly away from the firer). Mark that point and select every model within 1½ inches.`
  }
  const provenance = shot.original ? shot.original.every((d, i) => d === dice[i]) ? `App rolled ${dice.join(', ')}.` : `App rolled ${shot.original.join(', ')}; player changed this to ${dice.join(', ')}.` : `Tabletop dice entered: ${dice.join(', ')}.`
  return withRollAttempt(replace(next, saved), { id: `mortar-${stage}:${id}`, at: shot.at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${shot.shooterName}: Mortar ${label[stage]}`, rolls: [provenance, outcome] })
}
export function declareMortarBlast(sheet: BattleLiveState, id: string, targets: readonly LineShotTarget[]): BattleLiveState {
  const shot = active(sheet, id)
  if (!shot || shot.stage !== 'blast') return sheet
  if (shot.onTarget && !targets.some(t => t.key === shot.primary.key && t.warriorId === shot.primary.warriorId && t.warbandId === shot.primary.warbandId)) throw new Error('Include the model at the centre of the blast.')
  if (new Set(targets.map(t => t.key)).size !== targets.length) throw new Error('Each blast victim must be a distinct model.')
  return withRollAttempt(replace(sheet, { ...shot, stage: 'complete', targets: targets.map(t => ({ ...t })) }), { id: `mortar-blast:${id}`, at: shot.at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${shot.shooterName}: Mortar blast`, rolls: [targets.length ? `One Strength ${shot.strength} hit each: ${targets.map(t => t.name).join(', ')}.` : 'The shell landed clear of every model; no hits.', 'Friends and enemies within 1½ inches are included. No further firing or permission tests.'] })
}
export function correctMortarShot(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const shot = active(sheet, id)
  if (!shot || !reason.trim()) return sheet
  const next = correctBlackpowderShot(sheet, id, reason)
  return withRollAttempt(replace(next, { ...shot, correction: reason.trim() }), { id: `mortar-correct:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete', label: `${shot.shooterName}: Mortar correction`, rolls: [reason.trim(), 'Original rolls remain. Correct any shared damage separately.'] })
}
export function unresolvedMortarTargets(shot: MortarShot, events: readonly BattleEventRow[]): LineShotTarget[] {
  return (shot.targets ?? []).filter(t => !events.some(e => !e.reverted_at && e.payload.mortarShotId === shot.id && e.payload.mortarTargetKey === t.key && e.payload.attacker_id === shot.warriorId && e.payload.attacker_warband_id === shot.warbandId && e.payload.target_id === t.warriorId && e.payload.target_warband_id === t.warbandId))
}
