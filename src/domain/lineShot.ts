import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'

export type LineShot = BattleLiveState['lineShots'][number]
export type LineShotTarget = LineShot['targets'][number]

export function lineShotBlock(sheet: BattleLiveState, warriorId: string, weaponId: LineShot['weaponId'], ownTurn: number, shooterSlot = 0): string | null {
  const used = sheet.lineShots.filter(shot => !shot.cancelled && shot.warriorId === warriorId && shot.weaponId === weaponId && shot.shooterSlot === shooterSlot)
  if (!used.length) return null
  if (weaponId === 'blunderbuss') return 'This Blunderbuss has already fired in this battle.'
  const last = Math.max(...used.map(shot => shot.ownTurn))
  return ownTurn < last + 2 ? 'The Chaos Dwarf Blunderbuss needs a complete own turn to reload.' : null
}

/** Freeze the declared line before any victim is resolved; one shot can hit friends and enemies. */
export function declareLineShot(sheet: BattleLiveState, input: Omit<LineShot, 'at' | 'cancelled'>, name: string, turn = sheet.turn): BattleLiveState {
  if (sheet.lineShots.some(shot => shot.id === input.id)) return sheet
  const blocked = lineShotBlock(sheet, input.warriorId, input.weaponId, input.ownTurn, input.shooterSlot)
  if (blocked) throw new Error(blocked)
  if (!Number.isInteger(input.ownTurn) || input.ownTurn < 0) throw new Error('A valid own turn is required.')
  if (!input.targets.length) throw new Error('Choose the models in the line before firing.')
  if (new Set(input.targets.map(target => target.key)).size !== input.targets.length) throw new Error('Each target in the line must have a distinct identity.')
  const at = new Date().toISOString()
  const shot: LineShot = { ...input, targets: input.targets.map(target => ({ ...target })), at, cancelled: false }
  return withRollAttempt({ ...sheet, lineShots: [...sheet.lineShots, shot] }, {
    id: crypto.randomUUID(), at, turn, kind: 'attack', status: 'complete', label: `${name}: Blunderbuss fired`,
    rolls: [`Declared one straight 16-inch by 1-inch line, hitting ${shot.targets.map(target => target.name).join(', ')}.`, 'Each listed model takes one automatic Strength 3 hit, including friendly models. Resolve each target separately; this remains one shot.'],
  })
}

export function unresolvedLineTargets(shot: LineShot, events: readonly BattleEventRow[]): LineShotTarget[] {
  const done = new Set(events.filter(event => !event.reverted_at && event.payload.lineShotId === shot.id && event.payload.attacker_id === shot.warriorId && shot.targets.some(target => target.key === event.payload.lineShotTargetKey && target.warriorId === event.payload.target_id && target.warbandId === event.payload.target_warband_id)).map(event => event.payload.lineShotTargetKey))
  return shot.targets.filter(target => !done.has(target.key))
}

/** Restore usage by an explained correction; already logged target results are not silently removed. */
export function correctLineShot(sheet: BattleLiveState, shotId: string, reason: string, turn = sheet.turn): BattleLiveState {
  const shot = sheet.lineShots.find(entry => entry.id === shotId)
  if (!shot || shot.cancelled || !reason.trim()) return sheet
  return withRollAttempt({ ...sheet, lineShots: sheet.lineShots.map(entry => entry.id === shotId ? { ...entry, cancelled: true } : entry) }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn, kind: 'attack', status: 'complete', label: 'Blunderbuss firing corrected',
    rolls: [`Restored firing availability by player correction: ${reason.trim()}.`, 'Existing target results remain in the shared log; revert any incorrect result separately.'],
  })
}


export type LinePermissionTest = BattleLiveState['linePermissionTests'][number]

/** Save the original app die immediately, so closing or reloading cannot discard a failed attempt. */
export function startLinePermission(sheet: BattleLiveState, test: LinePermissionTest, name: string): BattleLiveState {
  if (sheet.linePermissionTests.some(t => t.id === test.id)) return sheet
  if (test.original !== undefined && (!Number.isInteger(test.original) || test.original < 1 || test.original > 6)) throw new Error('A valid D6 is required.')
  if (!test.targets.length) throw new Error('Choose the line before testing the blessing.')
  const previous = sheet.linePermissionTests.some(t => t.warriorId === test.warriorId && t.weaponId === test.weaponId && t.shooterSlot === test.shooterSlot && t.ownTurn === test.ownTurn)
  if (previous && !test.reason.trim()) throw new Error('Explain the additional firing attempt this turn.')
  const blocked = lineShotBlock(sheet, test.warriorId, test.weaponId, test.ownTurn, test.shooterSlot)
  if (blocked) throw new Error(blocked)
  const pending = { ...test, die: undefined, targets: test.targets.map(t => ({ ...t })) }
  return withRollAttempt({ ...sheet, linePermissionTests: [...sheet.linePermissionTests, pending] }, {
    id: test.id, at: test.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${name}: Blessing firing test in progress`,
    rolls: [...(test.reason.trim() ? [`Additional attempt: ${test.reason.trim()}.`] : []), ...(test.original === undefined ? ['Tabletop D6 awaiting confirmation.'] : [`App rolled ${test.original}. Awaiting confirmation; edits will be recorded.`]), `Declared line: ${test.targets.map(t => t.name).join(', ')}.`],
  })
}

/** One permission test governs the entire line. A failure consumes no ammunition or reload cycle. */
export function finishLinePermission(sheet: BattleLiveState, id: string, die: number, name: string): BattleLiveState {
  const test = sheet.linePermissionTests.find(t => t.id === id)
  if (!test || test.die !== undefined) return sheet
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('A valid D6 is required.')
  let next = withRollAttempt({ ...sheet, linePermissionTests: sheet.linePermissionTests.map(t => t.id === id ? { ...t, die } : t) }, {
    id, at: test.at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${name}: Blessing firing test`,
    rolls: [...(test.reason.trim() ? [`Additional attempt: ${test.reason.trim()}.`] : []), test.original === undefined ? `Tabletop D6 entered: ${die}.` : test.original === die ? `App rolled ${die}.` : `App rolled ${test.original}; player changed it to ${die}.`, die >= 4 ? 'Passed: fire the declared line. Do not repeat this test for each target.' : 'Failed: unable to fire this turn. No ammunition spent; no reload started.'],
  })
  if (die >= 4) next = declareLineShot(next, { id: `blessing:${id}`, warriorId: test.warriorId, weaponId: test.weaponId, shooterSlot: test.shooterSlot, ownTurn: test.ownTurn, targets: test.targets }, name)
  return next
}
