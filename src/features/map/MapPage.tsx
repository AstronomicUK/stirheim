// The campaign map: who holds which district, what each district gives, where each warband can
// fight next, and the GM's corrections. State is derived on the client from the battles fought in
// districts and the adjustments table (rules/resolve/mapCampaign.ts).

import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useCampaign, type CampaignDetail } from '../../api/campaigns'
import { useMapEvents, type MapAdjustmentRow } from '../../api/map'
import { useSession } from '../../app/session'
import { findDistrict, MAP_DISTRICTS } from '../../rules/data/map/districts'
import { advantagesFor, deriveMapState, gateToll, reachFor, standings } from '../../rules/resolve/mapCampaign'
import { useIsDesktop } from '../../ui/useMediaQuery'
import { Notice, PageHeader, SegmentedControl, SelectField, Spinner, TwoColumn } from '../../ui'
import { formatRelativeTime } from '../campaign/activity'
import { Card, Disclosure, Section, Tag, TextLink } from '../campaign/bits'
import { usePageTitle } from '../onboarding/usePageTitle'
import { DistrictPanel, Ink } from './DistrictPanel'
import { MapCanvas, type MapDisplay } from './MapCanvas'
import { districtViews, mapWarbands, warbandById, type MapWarband } from './model'

export function MapPage() {
  const { id } = useParams<{ id: string }>()
  const campaign = useCampaign(id)
  usePageTitle(campaign.data ? `${campaign.data.campaign.name}: map` : 'Campaign map')

  if (campaign.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the campaign" />
      </div>
    )
  }
  if (campaign.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this campaign">
          {campaign.error.message}
        </Notice>
        <TextLink to="/campaigns">Back to your campaigns</TextLink>
      </>
    )
  }
  return <MapView detail={campaign.data} />
}

function MapView({ detail }: { detail: CampaignDetail }) {
  const { campaign, members, former_members, settings } = detail
  const desktop = useIsDesktop()
  const user = useSession((s) => s.user)
  const isGm = user?.id === campaign.gm_id
  const events = useMapEvents(campaign.id)
  const warbands = useMemo(() => mapWarbands(members, former_members), [members, former_members])
  const byId = useMemo(() => warbandById(warbands), [warbands])
  const state = useMemo(() => deriveMapState(events.data?.events ?? []), [events.data])
  const views = useMemo(() => districtViews(state, byId), [state, byId])
  const [mode, setMode] = useState<MapDisplay>('control')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mine = members.filter((m) => m.user_id === user?.id)
  const [viewAs, setViewAs] = useState<string>(mine[0]?.warband_id ?? members[0]?.warband_id ?? '')
  const chosen = viewAs ? byId.get(viewAs) : undefined
  const reach = useMemo(() => (viewAs ? reachFor(state, viewAs) : null), [state, viewAs])
  const available = reach ? MAP_DISTRICTS.filter((d) => reach.reachable.has(d.id)) : []
  const table = useMemo(() => standings(state, members.map((m) => m.warband_id)), [state, members])
  const selected = selectedId ? views.get(selectedId) : undefined
  const districtPanel = selected ? <DistrictPanel key={selected.district.id} view={selected} views={views} warbands={warbands.filter((w) => members.some((m) => m.warband_id === w.id))} campaignId={campaign.id} isGm={isGm} userId={user?.id} archived={campaign.archived} onSelect={setSelectedId} /> : null

  return (
    <>
      <PageHeader
        eyebrow={campaign.name}
        title="Campaign map"
        description="Thirty districts of the ruined city. Win a battle in a district for a foothold and its advantage; hold it alone to control it."
        aside={<TextLink to={`/campaigns/${campaign.id}`}>Campaign</TextLink>}
      />
      {!settings.mapCampaign ? (
        <Notice tone="info" title="Not a map campaign">
          This campaign is not being played on the map. {isGm ? 'Turn it on from Settings › Campaign map and battles will ask for a district.' : 'The GM can turn it on from the campaign settings.'}
        </Notice>
      ) : null}
      {events.data?.warnings?.map(w=><Notice key={w} tone="warn">{w}</Notice>)}
      {events.isError ? <Notice tone="error">{events.error.message}</Notice> : null}

      <TwoColumn
        stickyRail={false}
        rail={
          <>
            {desktop && (districtPanel ?? <Card className="px-4 py-3"><p className="text-sm text-ink-dim">Tap a district on the map for its details.</p></Card>)}
            <Section title="Standings">
              <Card className="flex flex-col divide-y divide-border px-4">
                {table.length === 0 ? <p className="py-3 text-sm text-ink-dim">Nobody has enrolled yet.</p> : null}
                {table.map((row) => {
                  const w = byId.get(row.warbandId)
                  if (!w) return null
                  return (
                    <div key={row.warbandId} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Ink w={w} />
                      <span className="shrink-0 tabular-nums text-ink-dim" title="controlled / footholds / explored">
                        {row.controlled.length} · {row.footholds.length} · {row.explored.length}
                      </span>
                    </div>
                  )
                })}
                <p className="py-2 text-[10px] uppercase tracking-wider text-ink-dim">controlled · footholds · explored</p>
              </Card>
            </Section>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <SegmentedControl label="Map display" value={mode} onChange={setMode} options={[{ value: 'control', label: 'Control' }, { value: 'reach', label: 'Where can I fight?' }]} />
          {mode === 'reach' && members.length > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <SelectField label="Choose your warband" value={viewAs} onChange={(e) => setViewAs(e.target.value)}>
                  <option value="">Choose a warband</option>
                  {warbands
                    .filter((w) => members.some((m) => m.warband_id === w.id))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.ownerName})
                      </option>
                    ))}
                </SelectField>
              </div>
              {chosen && reach ? (
                <p className="pb-2 text-sm text-ink-dim">
                  {reach.reachable.size} district{reach.reachable.size === 1 ? '' : 's'} in reach — look for the numbered teal markers.
                </p>
              ) : null}
            </div>
          ) : null}
          <MapCanvas mode={mode} views={views} selectedId={selectedId} onSelect={setSelectedId} reachable={mode === 'reach' ? reach?.reachable ?? null : null} />
          {mode === 'reach' && !chosen && <Notice tone="info">Choose a warband to see where it can fight.</Notice>}
          {!desktop && districtPanel}
          {mode === 'control' ? <div className="rounded-md border border-border bg-surface-low p-3">
            <h2 className="mb-2 text-sm font-semibold text-ink">Control key</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2">{warbands.map((w) => <span key={w.id} className="inline-flex items-center gap-2 text-xs text-ink"><span aria-hidden="true" className="h-3 w-3 rounded-sm border border-black/20" style={{ backgroundColor: w.colour }} />{w.name}</span>)}</div>
            <p className="mt-3 text-xs text-ink-dim">No shading: unoccupied. Stripes: contested, with coloured dots for each warband’s foothold. A blue outline marks the selected district.</p>
          </div> : chosen && reach ? <section className="rounded-md border border-border bg-surface-low p-3" aria-label="Districts in reach">
            <h2 className="text-sm font-semibold text-ink">Where {chosen.name} can fight</h2>
            <p className="mb-3 mt-1 text-xs text-ink-dim">Numbers match the teal markers on the map. Any gate toll is listed below.</p>
            <div className="grid gap-2 sm:grid-cols-2">{available.map((d, i) => { const toll = gateToll(state, viewAs, d.id); return <button key={d.id} type="button" aria-pressed={selectedId === d.id} onClick={() => setSelectedId(d.id)} className={`flex min-h-14 items-center gap-3 rounded-md border p-2 text-left ${selectedId === d.id ? 'border-blue-600 bg-blue-600/10' : 'border-border hover:border-brass'}`}>
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#087f75] text-sm font-bold text-white">{i + 1}</span>
              <span className="min-w-0"><span className="block text-sm font-semibold text-ink">{d.name}</span><span className="block text-xs text-ink-dim">{toll ? `${toll} gc gate toll` : 'No gate toll'}{reach.explored.has(d.id) ? ' · Explored' : ''}</span></span>
            </button> })}</div>
          </section> : null}
          {events.isPending ? <Spinner label="Loading the battles" /> : null}
        </div>

        {mode === 'reach' && chosen ? <WarbandOutlook warband={chosen} state={state} /> : null}

        <Section title="Every district">
          <Card className="flex flex-col divide-y divide-border px-4">
            {MAP_DISTRICTS.map((d) => {
              const v = views.get(d.id)!
              const toll = viewAs ? gateToll(state, viewAs, d.id) : null
              return (
                <button key={d.id} type="button" onClick={() => setSelectedId(d.id)} className="flex items-start justify-between gap-3 py-2 text-left hover:bg-surface-high/50">
                  <span className="flex min-w-0 flex-col">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm text-ink">
                      {d.name}
                      {d.gate ? <Tag tone="neutral">Gate</Tag> : null}
                      {d.hard ? <Tag tone="warn">Hard Fought</Tag> : null}
                      {d.abundance ? <Tag tone="brass">Wyrdstone</Tag> : null}
                    </span>
                    <span className="text-xs text-ink-dim">{d.advantage}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end text-xs text-ink-dim">
                    {v.controller ? <Ink w={v.controller} /> : v.footholds.length > 1 ? 'Contested' : '—'}
                    {mode === 'reach' && viewAs ? <span>{toll === null ? 'Out of reach' : toll > 0 ? `In reach, ${toll} gc gate toll` : 'In reach'}</span> : null}
                  </span>
                </button>
              )
            })}
          </Card>
        </Section>

        {events.data && events.data.adjustments.length > 0 ? <Corrections rows={events.data.adjustments} byId={byId} /> : null}
      </TwoColumn>
    </>
  )
}

function WarbandOutlook({ warband, state }: { warband: MapWarband; state: ReturnType<typeof deriveMapState> }) {
  const advantages = advantagesFor(state, warband.id)
  return (
    <Section title={`${warband.name}: advantages in play`}>
      <Card className="flex flex-col gap-2 px-4 py-3">
        {advantages.length === 0 ? <p className="text-sm text-ink-dim">No footholds yet. Win a battle in a district to gain one.</p> : null}
        {advantages.map(({ district, contested }) => (
          <div key={district.id} className={`flex flex-col gap-0.5 text-sm ${contested ? 'opacity-60' : ''}`}>
            <span className="text-ink">
              {district.name}
              {contested ? <span className="text-ink-dim"> (Hard Fought, held by another: no advantage until controlled)</span> : null}
            </span>
            <span className="text-xs text-ink-dim">{district.advantage}</span>
          </div>
        ))}
      </Card>
    </Section>
  )
}

function Corrections({ rows, byId }: { rows: MapAdjustmentRow[]; byId: Map<string, MapWarband> }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <Disclosure open={open} onToggle={() => setOpen((v) => !v)} label="GM corrections" count={rows.length} />
      {open ? (
        <Card className="flex flex-col divide-y divide-border px-4">
          {[...rows].reverse().map((r) => (
            <div key={r.id} className="flex flex-col gap-0.5 py-2 text-sm">
              <span className="text-ink">
                {r.value ? (r.kind === 'foothold' ? 'Foothold given to' : 'Marked explored by') : r.kind === 'foothold' ? 'Foothold taken from' : 'Explored mark removed from'} {byId.get(r.warband_id)?.name ?? 'a former warband'} in {findDistrict(r.district_id)?.name ?? r.district_id}
              </span>
              <span className="text-xs text-ink-dim">
                {r.actor_display_name}, {formatRelativeTime(r.at)}
                {r.reason ? `: ${r.reason}` : ''}
              </span>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  )
}
