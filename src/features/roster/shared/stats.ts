import type { Stats } from '../../../rules/types'
import type { StatKey } from '../../../rules/types/common'
export const STAT_ORDER = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const

/** Which characteristics sit above or below a starting profile. */
export function statDrift(stats: Stats, base: Stats | undefined): { raised: StatKey[]; lowered: StatKey[] } {
  if (!base) return { raised: [], lowered: [] }
  return {
    raised: STAT_ORDER.filter((k) => stats[k] > base[k]),
    lowered: STAT_ORDER.filter((k) => stats[k] < base[k]),
  }
}
