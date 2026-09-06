// What the campaign map adds to each warband in a battle: the Statue of Count Gotthard's +1 Ld for
// the leader, +1 Ld for a leader whose warband held this district against a Surprise Attack, and the
// Cemetery's Fear immunity. Read from the map as it stood before this battle.

import { useMemo } from 'react'
import { useMapEvents } from '../../../api/map'
import type { MatchSummary } from '../../../api/matches'
import { mapPerksFor } from '../../../rules/resolve/mapAdvantages'
import { defenderLdBonus, deriveMapState } from '../../../rules/resolve/mapCampaign'
import { findDistrict } from '../../../rules/data/map/districts'
import type { BattleBoosts } from '../fight/combatants'

export function useBattleBoosts(match: MatchSummary, mapCampaign: boolean): Record<string, BattleBoosts> {
  const events = useMapEvents(match.campaign_id, mapCampaign)
  return useMemo(() => {
    const out: Record<string, BattleBoosts> = {}
    if (!mapCampaign || !events.data) return out
    const state = deriveMapState(events.data.events.filter((e) => e.kind !== 'battle' || e.matchId !== match.id))
    const district = findDistrict(match.district_id)
    for (const p of match.participants) {
      const perks = mapPerksFor(state, p.warband_id)
      const sources: string[] = []
      let leaderLd = 0
      if (perks.leaderLd) {
        leaderLd += perks.leaderLd
        sources.push(perks.leaderLdSource?.districtName ?? 'the map')
      }
      const defended = district ? defenderLdBonus(state, district.id, p.warband_id) : 0
      if (defended) {
        leaderLd += defended
        sources.push(`held ${district!.name} against a Surprise Attack`)
      }
      out[p.warband_id] = { leaderLd, leaderLdSources: sources, fearImmunity: perks.fearImmunity?.districtName ?? null }
    }
    return out
  }, [mapCampaign, events.data, match.id, match.district_id, match.participants])
}
