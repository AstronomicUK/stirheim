/** Rebuilt from applied reports, so withdrawn reports leave no phantom consequences. */
export interface ScenarioCampaignEffect { caravanTreachery?: number; caravanTrade?: { percent: -20 | 20; rounding: 'up' | 'down' } }
export interface ScenarioEffectReport { id: string; matchId: string; campaignId: string; submittedAt: string; battleAt?: string; effects?: ScenarioCampaignEffect }
export interface ScenarioCampaignState { caravanBannedCampaigns: string[]; rarePenalty: number; rareGamesRemaining: number; trade?: { percent: -20 | 20; rounding: 'up' | 'down' }; notes: string[] }
export function scenarioCampaignEffects(reports: ScenarioEffectReport[], starts: { id: string; startedAt: string }[], excludeMatchId?: string): ScenarioCampaignState {
  const time = (r: ScenarioEffectReport) => r.battleAt ?? r.submittedAt
  const ordered = [...reports].sort((a, b) => time(a).localeCompare(time(b)) || a.id.localeCompare(b.id))
  const current = excludeMatchId ? ordered.find(r => r.matchId === excludeMatchId) : undefined
  const cutoff = current ? time(current) : starts.find(s => s.id === excludeMatchId)?.startedAt
  const history = ordered.filter(r => r.matchId !== excludeMatchId && (!cutoff || time(r) < cutoff))
  const out: ScenarioCampaignState = { caravanBannedCampaigns: [], rarePenalty: 0, rareGamesRemaining: 0, notes: [] }
  for (let i = 0; i < history.length; i++) {
    const r = history[i], e = r.effects
    if (e?.caravanTreachery) {
      if (!out.caravanBannedCampaigns.includes(r.campaignId)) out.caravanBannedCampaigns.push(r.campaignId)
      const later = history.slice(i + 1).length
      out.rareGamesRemaining = Math.max(out.rareGamesRemaining, e.caravanTreachery - later)
    }
    if (e?.caravanTrade) {
      const nextBattle = starts.some(s => s.id !== r.matchId && s.id !== excludeMatchId && s.startedAt > time(r) && (!cutoff || s.startedAt < cutoff))
      if (!nextBattle) out.trade = e.caravanTrade
    }
  }
  if (out.rareGamesRemaining > 0) { out.rarePenalty = -1; out.notes.push(`Caravan betrayal: −1 on rare-item searches for ${out.rareGamesRemaining} more game${out.rareGamesRemaining === 1 ? '' : 's'}.`) }
  if (out.trade) out.notes.push(`A Friend in the Business: equipment ${out.trade.percent < 0 ? '20% cheaper' : '20% dearer'} until the next battle starts; round each purchase ${out.trade.rounding}.`)
  return out
}
export function scenarioPurchasePrice(total: number, effect?: ScenarioCampaignState['trade']): number {
  if (!effect) return total
  return (effect.rounding === 'up' ? Math.ceil : Math.floor)(total * (100 + effect.percent) / 100)
}
