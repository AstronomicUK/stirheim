import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'
import type { LineShotTarget } from './lineShot'

export type PigeonLaunch = BattleLiveState['pigeonLaunches'][number]

function validD6(die: number): boolean { return Number.isInteger(die) && die >= 1 && die <= 6 }

/** Preserve the intended target and app die before the player can see or edit the result. */
export function startPigeonLaunch(sheet: BattleLiveState, launch: Omit<PigeonLaunch, 'die' | 'targets'>): BattleLiveState {
  if (sheet.pigeonLaunches.some(l => l.id === launch.id)) return sheet
  if (!Number.isInteger(launch.ownTurn) || launch.ownTurn < 0) throw new Error('A valid own turn is required.')
  if (launch.original !== undefined && !validD6(launch.original)) throw new Error('A valid launch D6 is required.')
  if (sheet.pigeonLaunches.some(l => l.warriorId === launch.warriorId && l.ownTurn === launch.ownTurn) && !launch.reason.trim()) throw new Error('Explain the additional Pigeon Bomb launch this turn.')
  const saved: PigeonLaunch = { ...launch, die: undefined, targets: undefined, intendedTarget: { ...launch.intendedTarget } }
  return withRollAttempt({ ...sheet, pigeonLaunches: [...sheet.pigeonLaunches, saved] }, {
    id: launch.id, at: launch.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${launch.shooterName}: Pigeon Bomb launch in progress`,
    rolls: [...(launch.permissionNote ? [launch.permissionNote] : []), ...(launch.reason.trim() ? [`Additional launch: ${launch.reason.trim()}.`] : []), `Intended target: ${launch.intendedTarget.name}.`, launch.original === undefined ? 'Awaiting the tabletop launch D6.' : `App rolled ${launch.original}. Awaiting confirmation; edits will be recorded.`],
  })
}

export function confirmPigeonLaunch(sheet: BattleLiveState, id: string, die: number): BattleLiveState {
  const launch = sheet.pigeonLaunches.find(l => l.id === id)
  if (!launch || launch.die !== undefined) return sheet
  if (!validD6(die)) throw new Error('A valid launch D6 is required.')
  const outcome = die === 1 ? 'Backfire: the firer and everyone within 1½ inches take one Strength 4 hit.' : die >= 5 ? 'On target: the target and everyone within 1½ inches take one Strength 4 hit.' : 'The bomb explodes harmlessly in the air. Nobody is hit.'
  return withRollAttempt({ ...sheet, pigeonLaunches: sheet.pigeonLaunches.map(l => l.id === id ? { ...l, die, targets: die >= 2 && die <= 4 ? [] : undefined } : l) }, {
    id, at: launch.at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${launch.shooterName}: Pigeon Bomb launch`,
    rolls: [...(launch.permissionNote ? [launch.permissionNote] : []), ...(launch.reason.trim() ? [`Additional launch: ${launch.reason.trim()}.`] : []), `Intended target: ${launch.intendedTarget.name}.`, launch.original === undefined ? `Tabletop launch D6 entered: ${die}.` : launch.original === die ? `App rolled ${die}.` : `App rolled ${launch.original}; player changed it to ${die}.`, outcome],
  })
}

/** The centre is always a victim; nearby friends and enemies are chosen from physical table positions. */
export function pigeonBlastCentre(launch: PigeonLaunch): LineShotTarget | null {
  if (launch.die === 1) return { key: `${launch.warbandId}:${launch.warriorId}:0`, warbandId: launch.warbandId, warriorId: launch.warriorId, name: launch.shooterName }
  return launch.die !== undefined && launch.die >= 5 ? launch.intendedTarget : null
}

export function declarePigeonBlast(sheet: BattleLiveState, id: string, targets: readonly LineShotTarget[]): BattleLiveState {
  const launch = sheet.pigeonLaunches.find(l => l.id === id)
  if (!launch || launch.targets !== undefined) return sheet
  const centre = pigeonBlastCentre(launch)
  if (!centre) throw new Error('Confirm a launch that causes an explosion before choosing victims.')
  if (!targets.some(t => t.key === centre.key && t.warriorId === centre.warriorId && t.warbandId === centre.warbandId)) throw new Error('Include the model at the centre of the explosion.')
  if (new Set(targets.map(t => t.key)).size !== targets.length) throw new Error('Each blast victim must have a distinct model identity.')
  return withRollAttempt({ ...sheet, pigeonLaunches: sheet.pigeonLaunches.map(l => l.id === id ? { ...l, targets: targets.map(t => ({ ...t })) } : l) }, {
    id: `pigeon-blast:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete', label: `${launch.shooterName}: Pigeon Bomb blast victims`,
    rolls: [`One Strength 4 hit each: ${targets.map(t => t.name).join(', ')}.`, 'Includes friends and enemies within 1½ inches. Resolve each victim once; the launch is not repeated.'],
  })
}

export function unresolvedPigeonVictims(launch: PigeonLaunch, events: readonly BattleEventRow[]): LineShotTarget[] {
  const targets = launch.targets ?? []
  const done = new Set(events.filter(e => !e.reverted_at && e.payload.pigeonLaunchId === launch.id && e.payload.attacker_id === launch.warriorId && e.payload.attacker_warband_id === launch.warbandId && targets.some(t => t.key === e.payload.pigeonTargetKey && t.warriorId === e.payload.target_id && t.warbandId === e.payload.target_warband_id)).map(e => e.payload.pigeonTargetKey))
  return targets.filter(t => !done.has(t.key))
}
