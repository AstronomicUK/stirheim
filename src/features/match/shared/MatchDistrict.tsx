// The district line on a match page: where the battle is fought, its flags and advantage, the
// scenario the map rules call for, tolls, and (while the match is open) a way for the GM or a
// participant to move it.

import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMapEvents, useSetMatchDistrict } from '../../../api/map'
import type { MatchSummary } from '../../../api/matches'
import { findDistrict, MAP_DISTRICTS } from '../../../rules/data/map/districts'
import { bridgeTollOwedTo, deriveMapState, districtFlags, gateToll, suggestedScenario } from '../../../rules/resolve/mapCampaign'
import { Button, Notice, SelectField } from '../../../ui'
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
  const tolls = district
    ? ids.flatMap((w) => {
        const lines: string[] = []
        const gate = gateToll(state, w, district.id)
        if (gate) lines.push(`${nameOf(w)} pays ${gate} gc at the gate.`)
        const bridge = bridgeTollOwedTo(state, w, district.id)
        if (bridge) lines.push(`${nameOf(w)} crosses the Middle Bridge: 2D6 gc to ${nameOf(bridge)} after the game.`)
        return lines
      })
    : []

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
      {tolls.map((t) => (
        <p key={t} className="text-sm text-ink-dim">
          {t}
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
