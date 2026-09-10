import { supabase } from './supabase'
import { discoveryHistory, explorationDiscoveries, type DatedDiscoveryReport, type DiscoveryReport } from '../rules/resolve/explorationDiscoveries'

/** Read only applied discoveries; ignore this match when editing its report/battle sheet. */
export async function fetchExplorationDiscoveries(warbandId: string, excludeMatchId?: string) {
  const reports: DatedDiscoveryReport[] = []
  let before: string | undefined
  if (excludeMatchId) {
    const current = await supabase.from('match_reports').select('submitted_at,matches!inner(started_at)').eq('warband_id',warbandId).eq('match_id',excludeMatchId).maybeSingle()
    if (current.error) throw new Error(`Could not load report chronology: ${current.error.message}`)
    before = current.data?.matches.started_at ?? current.data?.submitted_at
    if (!current.data) {
      const match = await supabase.from('matches').select('started_at').eq('id',excludeMatchId).maybeSingle()
      if (match.error) throw new Error(`Could not load battle chronology: ${match.error.message}`)
      before = match.data?.started_at ?? undefined
    }
  }
  for (let offset = 0; ; offset += 500) {
    const query = supabase.from('match_reports').select('id,match_id,submitted_at,exploration,applied,matches!inner(started_at)').eq('warband_id', warbandId).eq('status', 'applied').order('submitted_at').order('id').range(offset, offset + 499)
    const { data, error } = await query
    if (error) throw new Error(`Could not load exploration discoveries: ${error.message}`)
    reports.push(...data.map(row => ({ id: row.id, matchId: row.match_id, submittedAt: row.submitted_at, battleAt: row.matches.started_at ?? undefined, applied: row.applied as DiscoveryReport['applied'], exploration: row.exploration as DiscoveryReport['exploration'] })))
    if (data.length < 500) break
  }
  return explorationDiscoveries(discoveryHistory(reports, excludeMatchId, before))
}
