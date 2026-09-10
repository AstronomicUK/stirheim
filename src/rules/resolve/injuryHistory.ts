import type { AppliedInjury, WarriorFlags } from '../types/roster'

/** Keep event records for history without presenting them as lasting conditions. */
export function injuryRecordKind(injury: AppliedInjury, flags: WarriorFlags, records?: readonly AppliedInjury[]): 'lasting' | 'pending' | 'history' {
  const latest = !records || records.findLast(i => i.injuryCode === injury.injuryCode) === injury
  switch (injury.injuryCode) {
    case 'sold_to_the_pits': return flags.pitFightOwed && latest ? 'pending' : 'history'
    case 'captured': return flags.captured && latest ? 'pending' : 'history'
    case 'full_recovery':
    case 'robbed':
    case 'survives_against_the_odds':
    case 'multiple_injuries':
    case 'dead': return 'history'
    case 'arm_wound':
    case 'smashed_leg':
      return injury.rolled.subRoll !== undefined && injury.rolled.subRoll > 1 ? flags.missNextGames ? 'pending' : 'history' : 'lasting'
    case 'deep_wound': return flags.missNextGames ? 'pending' : 'history'
    default: return 'lasting'
  }
}
