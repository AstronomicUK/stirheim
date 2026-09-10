import { supabase } from './supabase'
import { scenarioCampaignEffects, type ScenarioEffectReport } from '../rules/resolve/scenarioCampaignEffects'
import { reportAppliedSchema } from '../domain/report'
export async function fetchScenarioCampaignEffects(warbandId: string, excludeMatchId?: string) {
  const reports: ScenarioEffectReport[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('match_reports').select('id,match_id,submitted_at,applied,matches!inner(campaign_id,started_at)').eq('warband_id', warbandId).eq('status', 'applied').order('submitted_at').order('id').range(offset, offset + 499)
    if (error) throw new Error(`Could not load scenario consequences: ${error.message}`)
    for (const r of data) {
      const parsed = reportAppliedSchema.safeParse(r.applied)
      reports.push({ id: r.id, matchId: r.match_id, submittedAt: r.submitted_at, campaignId: r.matches.campaign_id, battleAt: r.matches.started_at ?? undefined, effects: parsed.success ? parsed.data.scenario_effects : undefined })
    }
    if (data.length < 500) break
  }
  if (!reports.some(r => r.effects && (r.effects.caravanTrade || r.effects.caravanTreachery))) return scenarioCampaignEffects([], [])
  const starts: { id: string; startedAt: string }[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('match_participants').select('match_id,matches!inner(started_at)').eq('warband_id', warbandId).order('match_id').range(offset, offset + 499)
    if (error) throw new Error(`Could not check whether trading benefits expired: ${error.message}`)
    for (const row of data) if (row.matches.started_at) starts.push({ id: row.match_id, startedAt: row.matches.started_at })
    if (data.length < 500) break
  }
  return scenarioCampaignEffects(reports, starts, excludeMatchId)
}
