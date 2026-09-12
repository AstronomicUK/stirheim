import type { ItemRow } from '../../../domain'
import { useQueries } from '@tanstack/react-query'
import { fetchMatchRoster, matchKeys, useAddictionSupplies, type MatchParticipantView } from '../../../api/matches'
import { withBattleSupplies } from '../battle/battleSupply'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'

export interface EnemyWarband {
  items: ItemRow[]
  participant: MatchParticipantView
  roster: RosterWarband
  template: WarbandTemplate | undefined
}

/** Every other warband's full roster, from the same cache the Enemy tab fills. */
export function useEnemyRosters(matchId: string, participants: MatchParticipantView[]): { isPending: boolean; error: string | null; warbands: EnemyWarband[] } {
  const supplies = useAddictionSupplies(matchId)
  return useQueries({
    queries: participants.map((p) => ({
      queryKey: matchKeys.roster(matchId, p.warband_id),
      queryFn: () => fetchMatchRoster(p.warband_id, matchId),
    })),
    combine: (results) => ({
      isPending: supplies.isPending || results.some((r) => r.isPending),
      error: supplies.error?.message ?? results.find((r) => r.isError)?.error?.message ?? null,
      warbands: results.flatMap((r, i) => (r.data ? [{ participant: participants[i], items: r.data.items, roster: withBattleSupplies(r.data.roster, supplies.data ?? []), template: findWarbandTemplate(r.data.roster.warbandTemplateId) }] : [])),
    }),
  })
}
