// One trading action = one record_trade call. A tab runs a resolver on the loaded roster, hands
// the result here, and this diffs it against the loaded rows and posts the batch. There is no
// local cart: after each call the queries refetch, so the screen always shows what the database holds.

import { useState } from 'react'
import { useRecordTrade, type TradePhaseStateRow } from '../../api/trading'
import type { WarbandDetail } from '../../api/warbands'
import { diffRoster } from '../../domain/rosterDiff'
import type { CampaignHouseRules, RosterWarband } from '../../rules/types/roster'

export interface TradeOptions {
  wyrdstoneSold?: boolean
  heroesSearched?: string[]
  /** Audit reason carrying an override note ('trading · Price overridden: …'). */
  reason?: string
}

export interface PhaseInfo {
  /** The latest report's match, or null when the warband has never filed one (no limits). */
  matchId: string | null
  wyrdstoneSold: boolean
  heroesSearched: string[]
  /** Heroes the filed report lists as out of action: they may not search (rulebook 03:1087). */
  heroesOutOfAction: string[]
}

export interface TradeContext {
  detail: WarbandDetail
  roster: RosterWarband
  houseRules: CampaignHouseRules
  phase: PhaseInfo
  canTrade: boolean
  pending: boolean
  /**
   * Run `build` (a resolver call; return the roster unchanged to only record a search), diff the
   * result and post it. Resolver errors and server refusals both land in `error`. Resolves to true on success.
   */
  run: (build: () => RosterWarband, opts?: TradeOptions) => Promise<boolean>
  error: string | null
  clearError: () => void
}

export function phaseInfo(matchId: string | null, state: TradePhaseStateRow | null | undefined, heroesOutOfAction: string[] = []): PhaseInfo {
  return { matchId, wyrdstoneSold: state?.wyrdstone_sold ?? false, heroesSearched: state?.heroes_searched ?? [], heroesOutOfAction }
}

export function useTrade(detail: WarbandDetail, houseRules: CampaignHouseRules, phase: PhaseInfo, canTrade: boolean): TradeContext {
  const mutation = useRecordTrade(detail.warband.id)
  const [error, setError] = useState<string | null>(null)

  async function run(build: () => RosterWarband, opts: TradeOptions = {}): Promise<boolean> {
    setError(null)
    if (!canTrade) {
      setError('Only the owner of this warband can trade.')
      return false
    }
    try {
      const changes = diffRoster(detail, build())
      await mutation.mutateAsync({
        matchId: phase.matchId,
        changes,
        wyrdstoneSold: opts.wyrdstoneSold ?? false,
        heroesSearched: opts.heroesSearched ?? [],
        reason: opts.reason,
      })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The trade could not be recorded.')
      return false
    }
  }

  return {
    detail,
    roster: detail.roster,
    houseRules,
    phase,
    canTrade,
    pending: mutation.isPending,
    run,
    error,
    clearError: () => setError(null),
  }
}
