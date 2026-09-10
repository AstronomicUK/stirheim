import { supabase } from './supabase'
import { explorationDiscoveries, type DiscoveryReport } from '../rules/resolve/explorationDiscoveries'

/** Read only applied discoveries; ignore this match when editing its report/battle sheet. */
export async function fetchExplorationDiscoveries(warbandId: string, excludeMatchId?: string) {
  const reports: DiscoveryReport[] = []
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from('match_reports').select('id,exploration').eq('warband_id', warbandId).eq('status', 'applied').order('submitted_at').order('id').range(offset, offset + 499)
    if (excludeMatchId) query = query.neq('match_id', excludeMatchId)
    const { data, error } = await query
    if (error) throw new Error(`Could not load exploration discoveries: ${error.message}`)
    reports.push(...data.map(row => ({ id: row.id, exploration: row.exploration as DiscoveryReport['exploration'] })))
    if (data.length < 500) break
  }
  return explorationDiscoveries(reports)
}
