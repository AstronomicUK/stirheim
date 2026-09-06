// The district field on the schedule form: every district, grouped by who among the chosen
// warbands can reach it, with the scenario the map rules call for and the tolls due.

import { useMemo } from 'react'
import { RandomScenario } from '../match/schedule/RandomScenario'
import { MAP_DISTRICTS, findDistrict } from '../../rules/data/map/districts'
import { bridgeTollOwedTo, canReach, districtFlags, gateToll, suggestedScenario, type MapState } from '../../rules/resolve/mapCampaign'
import { Button, Notice, SelectField } from '../../ui'

export interface DistrictPickerProps {
  state: MapState
  /** The warbands in the game so far. */
  warbandIds: string[]
  nameOf: (warbandId: string) => string
  value: string | null
  onChange: (districtId: string | null) => void
  /** Called with the scenario id the rules suggest when the player takes it. */
  onUseScenario: (scenarioId: string) => void
  currentScenarioId: string | null
  disabled?: boolean
  /** The players will settle it between themselves after the match is booked. */
  decideLater?: boolean
  onDecideLater?: (value: boolean) => void
}

export function DistrictPicker({ state, warbandIds, nameOf, value, onChange, onUseScenario, currentScenarioId, disabled = false, decideLater = false, onDecideLater }: DistrictPickerProps) {
  const groups = useMemo(() => {
    const all: string[] = []
    const some: string[] = []
    const none: string[] = []
    for (const d of MAP_DISTRICTS) {
      const reachers = warbandIds.filter((w) => canReach(state, w, d.id))
      if (warbandIds.length > 0 && reachers.length === warbandIds.length) all.push(d.id)
      else if (reachers.length > 0) some.push(d.id)
      else none.push(d.id)
    }
    return { all, some, none }
  }, [state, warbandIds])

  const district = findDistrict(value)
  const reachers = district ? warbandIds.filter((w) => canReach(state, w, district.id)) : []
  const cannot = district ? warbandIds.filter((w) => !canReach(state, w, district.id)) : []
  const suggestion = district && warbandIds.length > 1 ? suggestedScenario(state, district.id, warbandIds) : null
  const tolls = district
    ? warbandIds.flatMap((w) => {
        const lines: string[] = []
        const gate = gateToll(state, w, district.id)
        if (gate) lines.push(`${nameOf(w)} pays ${gate} gc at the gate (no foothold there).`)
        const bridge = bridgeTollOwedTo(state, w, district.id)
        if (bridge) lines.push(`${nameOf(w)} crosses the Middle Bridge: 2D6 gc to ${nameOf(bridge)} after the game.`)
        return lines
      })
    : []

  const label = (id: string) => {
    const d = findDistrict(id)!
    const flags = districtFlags(d)
    return `${d.name}${flags.length ? ` (${flags.join(', ')})` : ''}`
  }

  // What a roll may land on: somewhere both sides can reach, or anywhere if that is nobody.
  const rollable = (groups.all.length > 0 ? groups.all : [...groups.all, ...groups.some, ...groups.none]).map((id) => ({ id, title: label(id) }))

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 text-sm font-medium text-ink-dim">District</legend>

      {onDecideLater ? (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { later: false, title: 'Choose it now', blurb: 'Book the battle in a district.' },
              { later: true, title: 'Let the players decide', blurb: 'Each side proposes one; agree, or roll off.' },
            ] as const
          ).map((choice) => {
            const on = decideLater === choice.later
            return (
              <button
                key={choice.title}
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => {
                  onDecideLater(choice.later)
                  if (choice.later) onChange(null)
                }}
                className={`flex min-h-16 flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  on ? 'border-brass bg-brass/10 shadow-[inset_0_0_0_1px_var(--color-brass)]' : 'border-border bg-surface-low hover:bg-surface-high'
                }`}
              >
                <span className="text-sm font-semibold leading-tight text-ink">{choice.title}</span>
                <span className="text-xs leading-snug text-ink-dim">{choice.blurb}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {decideLater ? (
        <p className="text-sm leading-relaxed text-ink-dim">
          Each side puts a district forward once the battle is booked. Whoever answers may take it, name their own, or call for a roll-off; when both call one, the app picks between the two.
        </p>
      ) : null}

      <div hidden={decideLater}>
        <RandomScenario
          options={rollable}
          disabled={disabled}
          label="Roll for a district"
          title="Rolling for a district"
          onPick={(option) => onChange(option.id)}
        />
      </div>
      {decideLater ? null : (
      <SelectField label="Where the battle is fought" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} hint={warbandIds.length === 0 ? 'Pick the warbands first to see where each can reach.' : undefined}>
        <option value="">Choose a district</option>
        {warbandIds.length > 0 && groups.all.length > 0 ? (
          <optgroup label="In reach of everyone">
            {groups.all.map((id) => (
              <option key={id} value={id}>
                {label(id)}
              </option>
            ))}
          </optgroup>
        ) : null}
        {groups.some.length > 0 ? (
          <optgroup label={warbandIds.length > 0 ? 'In reach of some' : 'Districts'}>
            {groups.some.map((id) => (
              <option key={id} value={id}>
                {label(id)}
              </option>
            ))}
          </optgroup>
        ) : null}
        {groups.none.length > 0 ? (
          <optgroup label={warbandIds.length > 0 ? 'Out of everyone’s reach' : 'Districts'}>
            {groups.none.map((id) => (
              <option key={id} value={id}>
                {label(id)}
              </option>
            ))}
          </optgroup>
        ) : null}
      </SelectField>
      )}

      {district && !decideLater ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-low px-4 py-3 text-sm">
          <p className="text-ink">{district.advantage}</p>
          {district.abundance ? <p className="text-ink-dim">Abundance of Wyrdstone: the winner gains D3 extra shards.</p> : null}
          {district.hard ? <p className="text-ink-dim">Hard Fought: only the controller gains the advantage.</p> : null}
          {cannot.length > 0 ? (
            <Notice tone="warn">
              {cannot.map(nameOf).join(' and ')} cannot reach this district yet (no path from a gate through explored districts).{reachers.length > 0 ? ` ${reachers.map(nameOf).join(' and ')} can.` : ''} Book it anyway if the table agrees.
            </Notice>
          ) : null}
          {tolls.map((t) => (
            <p key={t} className="text-ink-dim">
              {t}
            </p>
          ))}
          {suggestion ? (
            <div className="flex flex-col gap-2 border-t border-border pt-2">
              <p className="text-ink">
                <span className="font-medium">{suggestion.title}</span>
                {suggestion.defenderId ? <span className="text-ink-dim"> · {nameOf(suggestion.defenderId)} defends</span> : null}
              </p>
              <p className="text-ink-dim">{suggestion.text}</p>
              {currentScenarioId === suggestion.scenarioId ? (
                <p className="text-xs text-ink-dim">Selected below.</p>
              ) : (
                <Button type="button" variant="secondary" disabled={disabled} onClick={() => onUseScenario(suggestion.scenarioId)}>
                  Use {suggestion.title}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  )
}
