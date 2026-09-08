import { supabase } from './supabase'
import type { MatchmakingHistory } from '../rules/resolve/matchmaking'

export interface MatchmakingHistoryRow {
  id: string
  scheduled_for: string | null
  started_at: string | null
  created_at: string
  matchmaking_round_id: string | null
  matchmaking_bye_warband_id: string | null
  match_participants: { warband_id: string }[]
}

export function toMatchmakingHistory(rows: readonly MatchmakingHistoryRow[]) {
  const history: MatchmakingHistory[] = rows.map((m) => ({
    warbandIds: m.match_participants.map((p) => p.warband_id),
    date: m.started_at ?? m.scheduled_for ?? m.created_at,
  }))
  const rounds = new Set<string>()
  const byeCounts: Record<string, number> = {}
  for (const m of rows) {
    if (!m.matchmaking_round_id || !m.matchmaking_bye_warband_id || rounds.has(m.matchmaking_round_id)) continue
    rounds.add(m.matchmaking_round_id)
    byeCounts[m.matchmaking_bye_warband_id] = (byeCounts[m.matchmaking_bye_warband_id] ?? 0) + 1
  }
  return { history, byeCounts }
}

/** Lean, paginated real match history, including already scheduled games. No report/roster joins. */
export async function fetchMatchmakingHistory(campaignId: string) {
  const rows: MatchmakingHistoryRow[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('matches')
      .select('id, scheduled_for, started_at, created_at, matchmaking_round_id, matchmaking_bye_warband_id, match_participants(warband_id)')
      .eq('campaign_id', campaignId).neq('state', 'cancelled')
      .order('id').range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    rows.push(...data)
    if (data.length < pageSize) break
  }
  return toMatchmakingHistory(rows)
}
