// The map advantages a warband holds in its campaign, for the screens that apply them. Null when
// the campaign is not played on the map (or the warband is in none), so callers can skip the
// whole subject. `excludeMatchId` reads the map as it stood before a given battle, for its report.

import { useMemo } from 'react'
import { useMapEvents } from '../../api/map'
import { deriveMapState } from '../../rules/resolve/mapCampaign'
import { mapPerksFor, type MapPerks } from '../../rules/resolve/mapAdvantages'

export function useMapPerks(campaignId: string | null | undefined, warbandId: string | undefined, mapCampaign: boolean, excludeMatchId?: string): { perks: MapPerks | null; pending: boolean } {
  const enabled = Boolean(campaignId) && Boolean(warbandId) && mapCampaign
  const events = useMapEvents(campaignId ?? undefined, enabled)
  const perks = useMemo(() => {
    if (!enabled || !events.data || !warbandId) return null
    const list = excludeMatchId ? events.data.events.filter((e) => e.kind !== 'battle' || e.matchId !== excludeMatchId) : events.data.events
    return mapPerksFor(deriveMapState(list), warbandId)
  }, [enabled, events.data, warbandId, excludeMatchId])
  return { perks, pending: enabled && events.isPending }
}
