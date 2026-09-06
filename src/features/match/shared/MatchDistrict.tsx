// The district line on a match page: where the battle is fought, its flags and advantage, the
// scenario the map rules call for, tolls, and (while the match is open) a way for the GM or a
// participant to move it.

import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMapEvents, useMatchTolls, usePayMapToll, useSetMatchDistrict, type MapTollRow } from '../../../api/map'
import type { MatchSummary } from '../../../api/matches'
import { findDistrict, MAP_DISTRICTS } from '../../../rules/data/map/districts'
import { bridgeTollOwedTo, deriveMapState, districtFlags, gateToll, suggestedScenario } from '../../../rules/resolve/mapCampaign'
import { Button, DieField, Notice, SelectField } from '../../../ui'
import { useSession } from '../../../app/session'
import { GATE_TOLL_GC } from '../../../rules/data/map/districts'
import { formatRelativeTime } from '../../campaign/activity'
import { Tag } from '../../campaign/bits'

export function MatchDistrict({ match, isGm, userId }: { match: MatchSummary; isGm: boolean; userId: string | undefined }) {
  const events = useMapEvents(match.campaign_id)
  const state = useMemo(() => deriveMapState((events.data?.events ?? []).filter((e) => e.kind !== 'battle' || e.matchId !== match.id)), [events.data, match.id])
  const district = findDistrict(match.district_id)
  const ids = match.participants.map((p) => p.warband_id)
  const nameOf = (id: string) => match.participants.find((p) => p.warband_id === id)?.warband_name ?? 'A warband'
  const open = match.state === 'scheduled' || match.state === 'in_progress' || match.state === 'awaiting_reports'
  const mayMove = open && (isGm || match.participants.some((p) => p.owner_id === userId))
  const [editing, setEditing] = useState(false)
  const [choice, setChoice] = useState(match.district_id ?? '')
  const [error, setError] = useState<string | null>(null)
  const move = useSetMatchDistrict(match.id, match.campaign_id)

  const suggestion = district ? suggestedScenario(state, district.id, ids) : null
  const tolls: TollDue[] = district
    ? ids.flatMap((w) => {
        const lines: TollDue[] = []
        const gate = gateToll(state, w, district.id)
        if (gate) lines.push({ warbandId: w, kind: 'gate', amount: gate, toWarbandId: null, text: `${nameOf(w)} pays ${gate} gc at the gate (no foothold there).` })
        const bridge = bridgeTollOwedTo(state, w, district.id)
        if (bridge) lines.push({ warbandId: w, kind: 'bridge', amount: null, toWarbandId: bridge, text: `${nameOf(w)} crosses the Middle Bridge: 2D6 gc to ${nameOf(bridge)}.` })
        return lines
      })
    : []
  const paid = useMatchTolls(match.id, Boolean(district))
  const user = useSession((s) => s.user)

  async function save() {
    setError(null)
    try {
      await move.mutateAsync(choice || null)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not move the battle.')
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-ink-dim">District</span>
        {district ? (
          <>
            <Link to={`/campaigns/${match.campaign_id}/map`} className="text-sm text-ink underline-offset-4 hover:underline">
              {district.name}
            </Link>
            {districtFlags(district).map((f) => (
              <Tag key={f} tone={f === 'Hard Fought' ? 'warn' : f === 'Wyrdstone' ? 'brass' : 'neutral'}>
                {f}
              </Tag>
            ))}
          </>
        ) : (
          <span className="text-sm text-ink-dim">Not set</span>
        )}
        {mayMove && !editing ? (
          <button type="button" onClick={() => setEditing(true)} className="text-sm text-brass underline-offset-4 hover:underline">
            {district ? 'Move' : 'Set'}
          </button>
        ) : null}
      </div>
      {district ? <p className="text-sm text-ink-dim">{district.advantage}</p> : null}
      {suggestion ? (
        <p className="text-sm text-ink">
          {suggestion.title}
          {suggestion.defenderId ? <span className="text-ink-dim"> · {nameOf(suggestion.defenderId)} defends</span> : null}
          {match.scenario_rules_id !== suggestion.scenarioId ? <span className="text-ink-dim"> (what the map rules call for)</span> : null}
        </p>
      ) : null}
      {tolls.map((t) => {
        const settled = paid.data?.find((p) => p.warband_id === t.warbandId && p.kind === t.kind)
        const mayPay = open && Boolean(user) && (isGm || match.participants.some((p) => p.warband_id === t.warbandId && p.owner_id === user?.id))
        return <TollRow key={`${t.warbandId}-${t.kind}`} toll={t} settled={settled} mayPay={mayPay} matchId={match.id} nameOf={nameOf} />
      })}
      {(paid.data ?? []).filter((p) => !tolls.some((t) => t.warbandId === p.warband_id && t.kind === p.kind)).map((p) => (
        <p key={p.id} className="text-sm text-ink-dim">
          {nameOf(p.warband_id)} paid a {p.kind === 'gate' ? 'gate' : 'Middle Bridge'} toll of {p.amount} gc{p.to_warband_id ? ` to ${nameOf(p.to_warband_id)}` : ''} ({formatRelativeTime(p.paid_at)}).
        </p>
      ))}
      {editing ? (
        <div className="flex flex-col gap-2">
          <SelectField label="District" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">None</option>
            {MAP_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div className="flex gap-2">
            <Button type="button" pending={move.isPending} onClick={() => void save()}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface TollDue {
  warbandId: string
  kind: 'gate' | 'bridge'
  /** Fixed for the gate; null for the bridge until the 2D6 is rolled. */
  amount: number | null
  toWarbandId: string | null
  text: string
}

/** One toll owed: what and to whom, paid or a way to pay it (owner or GM, while the match is open). */
function TollRow({ toll, settled, mayPay, matchId, nameOf }: { toll: TollDue; settled: MapTollRow | undefined; mayPay: boolean; matchId: string; nameOf: (id: string) => string }) {
  const pay = usePayMapToll(matchId)
  const [d1, setD1] = useState<number | null>(null)
  const [d2, setD2] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const amount = toll.kind === 'gate' ? GATE_TOLL_GC : d1 !== null && d2 !== null ? d1 + d2 : null

  async function settle() {
    if (amount === null) return
    setError(null)
    try {
      await pay.mutateAsync({ matchId, warbandId: toll.warbandId, kind: toll.kind, amount, toWarbandId: toll.toWarbandId, note: toll.kind === 'bridge' ? `2D6: ${d1}+${d2}` : 'gate toll' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not pay the toll.')
    }
  }

  if (settled) {
    return (
      <p className="text-sm text-ink-dim">
        {toll.text} <span className="text-ok">Paid: {settled.amount} gc{settled.to_warband_id ? ` to ${nameOf(settled.to_warband_id)}` : ''}</span> ({formatRelativeTime(settled.paid_at)}).
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-ink-dim">{toll.text}</p>
      {mayPay ? (
        <div className="flex flex-wrap items-end gap-2">
          {toll.kind === 'bridge' ? (
            <>
              <DieField label="D6" sides={6} value={d1} onChange={setD1} rollable />
              <DieField label="D6" sides={6} value={d2} onChange={setD2} rollable />
            </>
          ) : null}
          <Button type="button" variant="secondary" pending={pay.isPending} disabled={amount === null} onClick={() => void settle()}>
            {amount === null ? 'Pay the toll' : `Pay ${amount} gc${toll.toWarbandId ? ` to ${nameOf(toll.toWarbandId)}` : ''}`}
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  )
}
