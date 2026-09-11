import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'
import type { LineShotTarget } from './lineShot'

export type GrapeShotSpread = BattleLiveState['grapeShotSpreads'][number]
export type GrapeShotCandidate = LineShotTarget & {
  distance: number
  enemy: boolean
  inLineOfSight: boolean
  inCover: boolean
}

function validD6(die: number): boolean { return Number.isInteger(die) && die >= 1 && die <= 6 }

/** Table positions determine eligibility. Input order breaks equal-distance ties chosen by the player.
 * Hidden models are deliberately not excluded: the printed rule includes them. */
export function grapeShotTargets(primary: LineShotTarget, primaryInCover: boolean, die: number, candidates: readonly GrapeShotCandidate[]): LineShotTarget[] {
  if (!validD6(die)) throw new Error('A valid Grape Shot D6 is required.')
  if (new Set(candidates.map(c => c.key)).size !== candidates.length) throw new Error('Each candidate must be a distinct model.')
  if (candidates.some(c => !Number.isFinite(c.distance) || c.distance < 0)) throw new Error('Enter a valid distance for each candidate.')
  return candidates.filter(c => c.key !== primary.key && c.enemy && c.distance <= 4 && c.inLineOfSight && (primaryInCover || !c.inCover))
    .sort((a, b) => a.distance - b.distance).slice(0, die)
    .map(({ key, warbandId, warriorId, name }) => ({ key, warbandId, warriorId, name }))
}

/** Called only once the primary shot has hit; this does not declare another firing attempt. */
export function startGrapeShotSpread(sheet: BattleLiveState, input: Omit<GrapeShotSpread, 'die' | 'targets'>): BattleLiveState {
  const existing = sheet.grapeShotSpreads.find(s => s.shotId === input.shotId)
  if (existing && (existing.original !== undefined || existing.die !== undefined || input.original === undefined)) return sheet
  if (existing) input = { ...existing, original: input.original }
  const shot = sheet.blackpowderShots.find(s => s.id === input.shotId && s.warriorId === input.warriorId && !s.correction)
  if (!shot || shot.misfirePending || (shot.misfireDie !== undefined && shot.misfireDie !== 6)) throw new Error('An active, fired shot is required before resolving Grape Shot.')
  if (input.original !== undefined && !validD6(input.original)) throw new Error('A valid Grape Shot D6 is required.')
  const spread = { ...input, primary: { ...input.primary }, die: undefined, targets: undefined }
  return withRollAttempt({ ...sheet, grapeShotSpreads: existing ? sheet.grapeShotSpreads.map(s => s.shotId === input.shotId ? spread : s) : [...sheet.grapeShotSpreads, spread] }, {
    id: `grape-spread:${input.shotId}`, at: input.at, turn: sheet.turn, kind: 'attack', status: 'incomplete', label: `${input.shooterName}: Grape Shot additional hits`,
    rolls: [`Primary target: ${input.primary.name} (${input.primaryInCover ? 'in cover' : 'in the open'}).`, input.original === undefined ? 'Awaiting tabletop D6 for additional hits.' : `App rolled ${input.original}. Awaiting confirmation; edits will be recorded.`],
  })
}

export function confirmGrapeShotSpread(sheet: BattleLiveState, shotId: string, die: number, candidates: readonly GrapeShotCandidate[]): BattleLiveState {
  const spread = sheet.grapeShotSpreads.find(s => s.shotId === shotId)
  if (!spread || spread.die !== undefined) return sheet
  if (!sheet.blackpowderShots.some(s => s.id === shotId && !s.correction)) throw new Error('This firing attempt has been corrected.')
  const targets = grapeShotTargets(spread.primary, spread.primaryInCover, die, candidates)
  return withRollAttempt({ ...sheet, grapeShotSpreads: sheet.grapeShotSpreads.map(s => s.shotId === shotId ? { ...s, die, targets } : s) }, {
    id: `grape-spread:${shotId}`, at: spread.at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${spread.shooterName}: Grape Shot additional hits`,
    rolls: [spread.original === undefined ? `Tabletop additional-hits D6 entered: ${die}.` : spread.original === die ? `App rolled ${die}.` : `App rolled ${spread.original}; player changed it to ${die}.`,
      targets.length ? `One automatic hit each, nearest first: ${targets.map(t => t.name).join(', ')}.` : 'No eligible additional enemies within 4 inches and line of sight.',
      'The primary target is not hit again. Resolve each additional model once without another firing or Blessing test.'],
  })
}

export function unresolvedGrapeShotTargets(spread: GrapeShotSpread, events: readonly BattleEventRow[]): LineShotTarget[] {
  return (spread.targets ?? []).filter(t => !events.some(e => !e.reverted_at && e.payload.grapeShotId === spread.shotId && e.payload.grapeTargetKey === t.key && e.payload.attacker_id === spread.warriorId && e.payload.attacker_warband_id === spread.warbandId && e.payload.target_id === t.warriorId && e.payload.target_warband_id === t.warbandId))
}
