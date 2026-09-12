import type { RollState } from './rollThrough'

/** Permission failure spends no ammunition. Automatic hits do: their first prompt may be
 * Dodge, Lucky Charm or a wound roll rather than a to-hit roll. */
export function firingAttemptStarted(previous: RollState | null | undefined, next: RollState): boolean {
  return (!previous || previous.pending?.kind === 'firePermission')
    && next.pending?.kind !== 'firePermission'
    && !next.outcomes.includes('cannotFire')
}
