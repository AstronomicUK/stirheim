import { z } from 'zod'

/** A keg is scenery/cargo, never a warrior or a permanent roster entry. */
export const powderKegAttemptSchema = z.object({
  id: z.string(), kegKey: z.string().min(1), kegName: z.string().min(1),
  warriorId: z.string(), warbandId: z.string(), warriorName: z.string(), weaponName: z.string(),
  at: z.string(), turn: z.number().int().min(0),
  inventory: z.object({ itemRowId: z.string(), holderKey: z.string() }).optional(),
  ignitionNote: z.string().min(1), critical: z.boolean(), underground: z.boolean(),
  stage: z.enum(['explosion', 'radius', 'caveIn', 'targets', 'complete', 'stopped']),
  original: z.number().int().min(1).max(6).optional(),
  explosionDie: z.number().int().min(1).max(6).optional(),
  radius: z.number().int().min(4).max(9).optional(),
  caveIn: z.boolean().optional(), correction: z.string().optional(),
  targets: z.array(z.object({ key: z.string(), warriorId: z.string(), warbandId: z.string(), name: z.string() })).default([]),
})
export type PowderKegAttempt = z.infer<typeof powderKegAttemptSchema>

/** This stage follows a confirmed successful hit AND wound against Toughness 4.
 * A critical hit bypasses only the explosion test, never the blast-radius die. */
export function newPowderKegAttempt(input: Pick<PowderKegAttempt, 'id' | 'kegKey' | 'kegName' | 'warriorId' | 'warbandId' | 'warriorName' | 'weaponName' | 'at' | 'turn' | 'ignitionNote' | 'critical' | 'underground'> & { explosionDie?: number; inventory?: PowderKegAttempt['inventory'] }): PowderKegAttempt {
  return powderKegAttemptSchema.parse({ ...input, stage: input.critical || (input.explosionDie ?? 0) >= 4 ? 'radius' : 'explosion', targets: [] })
}

export function rollPowderKegDie(attempt: PowderKegAttempt, die: number): PowderKegAttempt {
  checkDie(die)
  if (attempt.correction || !['explosion', 'radius', 'caveIn'].includes(attempt.stage)) throw new Error('There is no pending Powder Keg die.')
  if (attempt.original !== undefined) throw new Error('Confirm the saved die before rolling again.')
  return { ...attempt, original: die }
}

export function confirmPowderKegDie(attempt: PowderKegAttempt, die: number): PowderKegAttempt {
  checkDie(die)
  if (attempt.correction) throw new Error('This Powder Keg attempt has been corrected.')
  const next = { ...attempt, original: undefined }
  switch (attempt.stage) {
    case 'explosion': return { ...next, explosionDie: die, stage: die >= 4 ? 'radius' : 'stopped' }
    case 'radius': return { ...next, radius: die + 3, stage: attempt.underground ? 'caveIn' : 'targets' }
    case 'caveIn': return { ...next, caveIn: die >= 4, stage: 'targets' }
    default: throw new Error('There is no pending Powder Keg die.')
  }
}

export function declarePowderKegTargets(attempt: PowderKegAttempt, targets: PowderKegAttempt['targets']): PowderKegAttempt {
  if (attempt.correction || attempt.stage !== 'targets') throw new Error('Resolve the explosion radius before selecting victims.')
  if (new Set(targets.map(t => t.key)).size !== targets.length) throw new Error('Select each model only once.')
  // No models in range is a valid explosion; the keg is still destroyed.
  return { ...attempt, stage: 'complete', targets: targets.map(t => ({ ...t })) }
}

export function powderKegDestroyed(attempt: PowderKegAttempt): boolean {
  return !attempt.correction && (attempt.critical || (attempt.explosionDie ?? 0) >= 4)
}

function checkDie(die: number): void {
  if (!Number.isInteger(die) || die < 1 || die > 6) throw new Error('A Powder Keg roll needs one D6.')
}
