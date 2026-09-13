import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'
import { newPowderKegAttempt, rollPowderKegDie, confirmPowderKegDie, declarePowderKegTargets, powderKegDestroyed, type PowderKegAttempt } from './powderKeg'

function write(sheet: BattleLiveState, attempt: PowderKegAttempt, message: string): BattleLiveState {
  const supplyId = `powder-keg:${attempt.id}`
  const supplies = attempt.correction ? sheet.warbandConsumables.map(use => use.id === supplyId ? { ...use, correction: attempt.correction } : use)
    : attempt.inventory && powderKegDestroyed(attempt) && !sheet.warbandConsumables.some(use => use.id === supplyId)
      ? [...sheet.warbandConsumables, { id: supplyId, itemRulesId: 'powder_keg', itemRowId: attempt.inventory.itemRowId, holderKey: attempt.inventory.holderKey, at: attempt.at }]
      : sheet.warbandConsumables
  const historyId = `powder-keg-history:${attempt.id}`
  const history = sheet.rollAttempts.find(entry => entry.id === historyId)?.rolls ?? []
  return withRollAttempt({ ...sheet, warbandConsumables: supplies, powderKegAttempts: sheet.powderKegAttempts.map(a => a.id === attempt.id ? attempt : a) }, {
    id: historyId, at: attempt.at, turn: attempt.turn, kind: 'attack', status: attempt.correction || ['complete', 'stopped'].includes(attempt.stage) ? 'complete' : 'incomplete', label: `${attempt.kegName}: explosion and blast`, rolls: [...history, message],
  })
}
function active(sheet: BattleLiveState, id: string): PowderKegAttempt {
  const attempt = sheet.powderKegAttempts.find(a => a.id === id && !a.correction)
  if (!attempt) throw new Error('This Powder Keg attempt is no longer active.')
  return attempt
}
export function beginPowderKeg(sheet: BattleLiveState, input: Parameters<typeof newPowderKegAttempt>[0]): BattleLiveState {
  if (sheet.powderKegAttempts.some(a => a.id === input.id)) return sheet
  if (sheet.powderKegAttempts.some(a => a.kegKey === input.kegKey && !a.correction && (powderKegDestroyed(a) || a.stage !== 'stopped'))) throw new Error('This keg has already exploded or has an unresolved attempt.')
  const attempt = newPowderKegAttempt(input)
  return write({ ...sheet, powderKegAttempts: [...sheet.powderKegAttempts, attempt] }, attempt,
    `${attempt.warriorName} hit and wounded ${attempt.kegName} (Toughness 4) using ${attempt.weaponName}. ${attempt.ignitionNote}${attempt.critical ? ' Critical hit: the keg explodes automatically.' : attempt.explosionDie !== undefined ? ` Explosion roll ${attempt.explosionDie}: ${attempt.explosionDie >= 4 ? 'the keg explodes.' : 'the keg does not explode.'}` : ' Roll one D6: 4+ explodes.'}`)
}
export function savePowderKegDie(sheet: BattleLiveState, id: string, die: number, expectedStage?: PowderKegAttempt['stage']): BattleLiveState {
  const attempt = active(sheet, id)
  if (expectedStage && attempt.stage !== expectedStage) return sheet
  return write(sheet, rollPowderKegDie(attempt, die), `App rolled ${die} for ${attempt.stage}; awaiting confirmation.`)
}
export function acceptPowderKegDie(sheet: BattleLiveState, id: string, die: number, expectedStage?: PowderKegAttempt['stage']): BattleLiveState {
  const attempt = active(sheet, id)
  if (expectedStage && attempt.stage !== expectedStage) return sheet
  const next = confirmPowderKegDie(attempt, die)
  const provenance = attempt.original === undefined ? `Table roll: ${die}.` : attempt.original === die ? `App roll confirmed: ${die}.` : `Player changed app roll ${attempt.original} to ${die}.`
  const result = attempt.stage === 'explosion' ? next.stage === 'stopped' ? 'The keg does not explode.' : 'The keg explodes; remove it from the game.' : attempt.stage === 'radius' ? `Blast radius ${next.radius} inches (D6 + 3); every model in range takes one automatic Strength 6 hit.` : next.caveIn ? 'Tunnel caves in: place a Tunnel Collapse marker at the keg’s position.' : 'No tunnel cave-in.'
  return write(sheet, next, `${provenance} ${result}`)
}
export function setPowderKegVictims(sheet: BattleLiveState, id: string, targets: PowderKegAttempt['targets']): BattleLiveState {
  const next = declarePowderKegTargets(active(sheet, id), targets)
  return write(sheet, next, targets.length ? `Blast victims within ${next.radius} inches: ${targets.map(t => t.name).join(', ')}. Resolve one automatic Strength 6 hit on each.` : `No models within the ${next.radius}-inch blast. The keg is still destroyed.`)
}
export function correctPowderKeg(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  if (!reason.trim()) throw new Error('Explain the Powder Keg correction.')
  const attempt = active(sheet, id)
  return write(sheet, { ...attempt, correction: reason.trim() }, `Player correction: ${reason.trim()}. Existing damage remains in the shared log; correct it separately if needed.`)
}
export function pendingPowderKegVictims(attempt: PowderKegAttempt, events: readonly BattleEventRow[]): PowderKegAttempt['targets'] {
  if (attempt.correction || attempt.stage !== 'complete') return []
  return attempt.targets.filter(target => !events.some(event => !event.reverted_at && event.payload.powderKegAttemptId === attempt.id && event.payload.powderKegTargetKey === target.key && event.payload.target_id === target.warriorId && event.payload.target_warband_id === target.warbandId))
}
