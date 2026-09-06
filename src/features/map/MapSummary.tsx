// The campaign page's map card: who controls how many districts, and the way to the full map.

import { useMemo } from 'react'
import type { CampaignMemberView } from '../../api/campaigns'
import { useMapEvents } from '../../api/map'
import { MAP_DISTRICTS } from '../../rules/data/map/districts'
import { deriveMapState, standings } from '../../rules/resolve/mapCampaign'
import { Spinner } from '../../ui'
import { Card, Section, TextLink } from '../campaign/bits'
import { Ink } from './DistrictPanel'
import { mapWarbands, warbandById } from './model'

export function MapSummary({ campaignId, members, former }: { campaignId: string; members: CampaignMemberView[]; former: CampaignMemberView[] }) {
  const events = useMapEvents(campaignId)
  const warbands = useMemo(() => mapWarbands(members, former), [members, former])
  const byId = useMemo(() => warbandById(warbands), [warbands])
  const state = useMemo(() => deriveMapState(events.data?.events ?? []), [events.data])
  const table = useMemo(() => standings(state, members.map((m) => m.warband_id)), [state, members])
  const controlled = table.reduce((n, r) => n + r.controlled.length, 0)

  return (
    <Section title="Campaign map" aside={<TextLink to={`/campaigns/${campaignId}/map`}>Open the map</TextLink>}>
      <Card className="flex flex-col gap-2 px-4 py-3">
        {events.isPending ? <Spinner label="Loading the map" /> : null}
        {events.data ? (
          <>
            <p className="text-sm text-ink-dim">
              {controlled} of {MAP_DISTRICTS.length} districts controlled.
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {table.slice(0, 6).map((row) => {
                const w = byId.get(row.warbandId)
                if (!w) return null
                return (
                  <li key={row.warbandId} className="flex items-center justify-between gap-3">
                    <Ink w={w} />
                    <span className="tabular-nums text-ink-dim">
                      {row.controlled.length} controlled, {row.footholds.length} foothold{row.footholds.length === 1 ? '' : 's'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}
      </Card>
    </Section>
  )
}
