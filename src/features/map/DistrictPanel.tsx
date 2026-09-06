// The selected district: its advantage and flags, who holds and has explored it, its neighbours,
// the way to book a battle there, and (for the GM) corrections with a reason.

import { useState } from 'react'
import { Link } from 'react-router'
import { useAddMapAdjustment } from '../../api/map'
import { findDistrict } from '../../rules/data/map/districts'
import { districtFlags } from '../../rules/resolve/mapCampaign'
import { Button, Notice, SegmentedControl, SelectField, TextArea } from '../../ui'
import { Card, Tag } from '../campaign/bits'
import type { DistrictView, MapWarband } from './model'

export interface DistrictPanelProps {
  view: DistrictView
  views: Map<string, DistrictView>
  warbands: MapWarband[]
  campaignId: string
  isGm: boolean
  userId: string | undefined
  archived: boolean
  onSelect: (id: string) => void
}

export function DistrictPanel({ view, views, warbands, campaignId, isGm, userId, archived, onSelect }: DistrictPanelProps) {
  const { district, controller, footholds, explored } = view
  const flags = districtFlags(district)
  return (
    <Card className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-headline text-xl leading-tight text-ink">{district.name}</h3>
          {flags.map((f) => (
            <Tag key={f} tone={f === 'Hard Fought' ? 'warn' : f === 'Wyrdstone' ? 'brass' : 'neutral'}>
              {f}
            </Tag>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink">{district.advantage}</p>
        {district.hard ? <p className="text-xs text-ink-dim">Hard Fought: only the warband that controls this district gains the advantage.</p> : null}
        {district.abundance ? <p className="text-xs text-ink-dim">Abundance of Wyrdstone: the winner of a battle here gains D3 extra shards.</p> : null}
        {district.gate ? <p className="text-xs text-ink-dim">A gate: everyone&apos;s first battle is at one; entering the city here without a foothold costs 5 gc.</p> : null}
      </div>

      <dl className="grid grid-cols-1 gap-2 border-t border-border pt-3 text-sm">
        <Row label="Controlled by">{controller ? <Ink w={controller} /> : footholds.length > 1 ? 'Contested (more than one foothold)' : 'Nobody'}</Row>
        <Row label="Footholds">{footholds.length ? <InkList ws={footholds} /> : 'None'}</Row>
        <Row label="Explored by">{explored.length ? <InkList ws={explored} /> : 'Nobody yet'}</Row>
      </dl>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <span className="text-[10px] uppercase tracking-wider text-ink-dim">Borders</span>
        <div className="flex flex-wrap gap-1.5">
          {district.connections.map((id) => {
            const n = findDistrict(id)!
            const c = views.get(id)?.controller
            return (
              <button key={id} type="button" onClick={() => onSelect(id)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-ink hover:border-ink-dim">
                {c ? <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.colour }} aria-hidden /> : null}
                {n.name}
              </button>
            )
          })}
        </div>
      </div>

      {!archived ? (
        <Link to={`/campaigns/${campaignId}/matches/new?district=${district.id}`} className="text-sm text-brass underline-offset-4 hover:underline">
          Book a battle here
        </Link>
      ) : null}

      {isGm && !archived && userId ? <GmCorrections view={view} warbands={warbands} campaignId={campaignId} userId={userId} /> : null}
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  )
}

export function Ink({ w }: { w: MapWarband }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: w.colour }} aria-hidden />
      {w.name}
      {w.ownerName ? <span className="text-ink-dim"> ({w.ownerName})</span> : null}
    </span>
  )
}

function InkList({ ws }: { ws: MapWarband[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {ws.map((w) => (
        <Ink key={w.id} w={w} />
      ))}
    </span>
  )
}

function GmCorrections({ view, warbands, campaignId, userId }: { view: DistrictView; warbands: MapWarband[]; campaignId: string; userId: string }) {
  const add = useAddMapAdjustment(campaignId)
  const [open, setOpen] = useState(false)
  const [warbandId, setWarbandId] = useState(warbands[0]?.id ?? '')
  const [kind, setKind] = useState<'foothold' | 'explored'>('foothold')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const has = kind === 'foothold' ? view.footholds.some((w) => w.id === warbandId) : view.explored.some((w) => w.id === warbandId)
  const name = warbands.find((w) => w.id === warbandId)?.name ?? 'this warband'

  async function apply(value: boolean) {
    setError(null)
    if (!reason.trim()) {
      setError('Say why the map is being corrected; it goes on the record.')
      return
    }
    try {
      await add.mutateAsync({ campaignId, districtId: view.district.id, warbandId, kind, value, reason, actorId: userId })
      setReason('')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the correction.')
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-brass underline-offset-4 hover:underline">
        Correct this district (GM)
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-sm text-ink-dim">Footholds and explored marks follow the battles reported in the app. Use this for a game played off the app or a mistake, with a reason.</p>
      <SelectField label="Warband" value={warbandId} onChange={(e) => setWarbandId(e.target.value)}>
        {warbands.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </SelectField>
      <SegmentedControl
        label="What to change"
        value={kind}
        options={[
          { value: 'foothold', label: 'Foothold' },
          { value: 'explored', label: 'Explored' },
        ]}
        onChange={setKind}
      />
      <TextArea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Played at the club on Tuesday, result 2-1 to the Reikland Watch" maxLength={300} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={has ? 'secondary' : 'primary'} disabled={add.isPending || has} onClick={() => void apply(true)}>
          {kind === 'foothold' ? `Give ${name} a foothold` : `Mark explored by ${name}`}
        </Button>
        <Button type="button" variant="secondary" disabled={add.isPending || !has} onClick={() => void apply(false)}>
          {kind === 'foothold' ? 'Take the foothold away' : 'Remove the explored mark'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
