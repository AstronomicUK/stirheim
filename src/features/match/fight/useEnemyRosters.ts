import { useQueries } from '@tanstack/react-query'
import { fetchMatchRoster, matchKeys, type MatchParticipantView } from '../../../api/matches'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'

export interface EnemyWarband {
  participant: MatchParticipantView
  roster: RosterWarband
  template: WarbandTemplate | undefined
}

/** Every other warband's full roster, from the same cache the Enemy tab fills. */
export function useEnemyRosters(matchId: string, participants: MatchParticipantView[]): { isPending: boolean; error: string | null; warbands: EnemyWarband[] } {
  return useQueries({
    queries: participants.map((p) => ({
      queryKey: matchKeys.roster(matchId, p.warband_id),
      queryFn: () => fetchMatchRoster(p.warband_id),
    })),
    combine: (results) => ({
      isPending: results.some((r) => r.isPending),
      error: results.find((r) => r.isError)?.error?.message ?? null,
      warbands: results.flatMap((r, i) => (r.data ? [{ participant: participants[i], roster: r.data.roster, template: findWarbandTemplate(r.data.roster.warbandTemplateId) }] : [])),
    }),
  })
}
