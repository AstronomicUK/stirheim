// Settling where a battle is fought when it was booked without a district. Each side puts one
// forward; whoever answers may take it, name their own instead, or call for a roll-off. Two
// roll-offs and the app picks between the districts on the table — decided on the server so both
// screens see the same answer, and shown here as a coin coming down.

import { useEffect, useRef, useState } from 'react'
import { useDistrictProposals, useMoveOnDistrict, type DistrictProposal, type MatchSummary } from '../../api/matches'
import { MAP_DISTRICTS, findDistrict } from '../../rules/data/map/districts'
import { canReach, districtFlags, type MapState } from '../../rules/resolve/mapCampaign'
import { Button, Icon, Notice, SelectField, Spinner } from '../../ui'
import { Card, Section, Tag } from '../roster/view/bits'

export interface DistrictNegotiationProps {
  match: MatchSummary
  /** The derived map, for what each side can reach. */
  state: MapState
  /** The viewer's own warband in this match, or null when they are only watching. */
  myWarbandId: string | null
  nameOf: (warbandId: string) => string
}

const STANCE_LABEL: Record<DistrictProposal['stance'], string> = {
  proposed: 'proposes',
  agreed: 'agreed to',
  roll_off: 'wants to roll off for',
}

/** Everyone in the match who has yet to say anything. */
function silent(match: MatchSummary, proposals: DistrictProposal[]): string[] {
  return match.participants.filter((p) => !proposals.some((x) => x.warband_id === p.warband_id)).map((p) => p.warband_id)
}

export function DistrictNegotiation({ match, state, myWarbandId, nameOf }: DistrictNegotiationProps) {
  // Kept loaded past the moment it settles: the roll-off reveal needs the districts that were on the table.
  const proposals = useDistrictProposals(match.id)
  const move = useMoveOnDistrict(match.id)
  const [choice, setChoice] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onTable = [...new Set((proposals.data ?? []).map((r) => r.district_id))]

  // Settled while this screen was open: run the roll-off past before the answer stands.
  const [reveal, setReveal] = useState(false)
  const wasOpen = useRef(match.district_id === null)
  useEffect(() => {
    if (wasOpen.current && match.district_id !== null && match.district_decided_by === 'roll_off') setReveal(true)
    wasOpen.current = match.district_id === null
  }, [match.district_id, match.district_decided_by])

  if (match.district_id !== null) {
    const district = findDistrict(match.district_id)
    if (match.district_decided_by === 'scheduled' || !district) return null
    if (reveal && onTable.length > 1) {
      return <RollOffReveal options={onTable} winner={match.district_id} onDone={() => setReveal(false)} />
    }
    return (
      <Notice tone="info" title={`The battle is at ${district.name}`}>
        {match.district_decided_by === 'roll_off' ? 'Neither side would give way, so it was rolled for.' : 'Both sides agreed on it.'}
      </Notice>
    )
  }

  if (proposals.isPending) {
    return (
      <div className="flex justify-center py-6">
        <Spinner label="Loading the proposals" />
      </div>
    )
  }

  const rows = proposals.data ?? []
  const mine = myWarbandId ? rows.find((r) => r.warband_id === myWarbandId) : undefined
  const theirs = rows.filter((r) => r.warband_id !== myWarbandId)
  const waitingOn = silent(match, rows).map(nameOf)
  const canAnswer = Boolean(myWarbandId)
  // What the other side has put forward that this side could simply take.
  const takeable = [...new Set(theirs.map((r) => r.district_id))].filter((id) => id !== mine?.district_id)

  async function act(move_: Parameters<typeof move.mutateAsync>[0]['move']) {
    if (!myWarbandId) return
    setError(null)
    try {
      await move.mutateAsync({ warbandId: myWarbandId, move: move_ })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That could not be recorded.')
    }
  }

  const label = (id: string) => {
    const d = findDistrict(id)
    if (!d) return id
    const flags = districtFlags(d)
    return `${d.name}${flags.length ? ` (${flags.join(', ')})` : ''}`
  }

  const reachable = MAP_DISTRICTS.filter((d) => match.participants.every((p) => canReach(state, p.warband_id, d.id)))
  const rest = MAP_DISTRICTS.filter((d) => !reachable.includes(d))

  return (
    <Section title="Where is it fought?" aside={match.participants.length > 2 ? `${rows.length} of ${match.participants.length} answered` : undefined}>
      <Card className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-dim">
          This battle was booked without a district. Each side puts one forward; take what the other side proposed, name your own, or call for a roll-off. When everyone has called one, the app picks between the districts on the table.
        </p>

        {rows.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {rows.map((row) => (
              <li key={row.warband_id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Icon name={row.stance === 'roll_off' ? 'dice' : 'map'} size={15} className="text-brass" />
                <span className="text-ink">{nameOf(row.warband_id)}</span>
                <span className="text-ink-dim">{STANCE_LABEL[row.stance]}</span>
                <span className="font-medium text-ink">{findDistrict(row.district_id)?.name ?? row.district_id}</span>
                {row.warband_id === myWarbandId ? <Tag tone="brass">You</Tag> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {waitingOn.length > 0 ? <p className="text-sm text-ink-dim">Waiting on {waitingOn.join(' and ')}.</p> : null}

        {error ? <Notice tone="error">{error}</Notice> : null}

        {!canAnswer ? (
          <p className="text-sm text-ink-dim">You have no warband in this match, so this is theirs to settle.</p>
        ) : (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {takeable.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-dim">Take what they proposed</p>
                <div className="flex flex-wrap gap-2">
                  {takeable.map((id) => (
                    <Button key={id} variant="secondary" pending={move.isPending} onClick={() => void act({ kind: 'agree', districtId: id })}>
                      {findDistrict(id)?.name ?? id}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <SelectField
                label={mine ? 'Change what you propose' : 'Propose a district'}
                value={choice || (mine?.district_id ?? '')}
                onChange={(e) => setChoice(e.target.value)}
                disabled={move.isPending}
              >
                <option value="">Choose a district</option>
                {reachable.length > 0 ? (
                  <optgroup label="In reach of everyone">
                    {reachable.map((d) => (
                      <option key={d.id} value={d.id}>
                        {label(d.id)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <optgroup label={reachable.length > 0 ? 'Further afield' : 'Districts'}>
                  {rest.map((d) => (
                    <option key={d.id} value={d.id}>
                      {label(d.id)}
                    </option>
                  ))}
                </optgroup>
              </SelectField>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!(choice || mine?.district_id)}
                  pending={move.isPending}
                  onClick={() => void act({ kind: 'propose', districtId: choice || mine!.district_id })}
                >
                  {mine ? 'Propose this instead' : 'Propose it'}
                </Button>
                {mine ? (
                  <Button variant="secondary" pending={move.isPending} disabled={mine.stance === 'roll_off'} onClick={() => void act({ kind: 'rollOff' })}>
                    {mine.stance === 'roll_off' ? 'Roll-off called' : 'Call a roll-off'}
                  </Button>
                ) : null}
              </div>
              {mine?.stance === 'roll_off' ? (
                <p className="text-xs text-ink-dim">Waiting for the other side to call one too. Proposing again takes it back.</p>
              ) : null}
            </div>
          </div>
        )}
      </Card>
    </Section>
  )
}

const TICK_START = 90
const TICK_END = 420

/**
 * The roll-off, after the fact. The server has already decided — this runs the districts that were
 * on the table past and stops on the one it chose, so the answer arrives as something you watch
 * rather than a line of text that was there when the page loaded.
 */
function RollOffReveal({ options, winner, onDone }: { options: string[]; winner: string; onDone: () => void }) {
  const target = Math.max(0, options.indexOf(winner))
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [cursor, setCursor] = useState(() => (reduced ? target : 0))
  const [landed, setLanded] = useState(() => reduced)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (reduced) return
    const steps = options.length * 3 + target + 1
    let at = 0
    for (let i = 0; i < steps; i++) {
      const eased = TICK_START + (TICK_END - TICK_START) * (i / Math.max(1, steps - 1)) ** 2.2
      at += eased
      const last = i === steps - 1
      timers.current.push(
        window.setTimeout(() => {
          setCursor(last ? target : i % options.length)
          if (last) setLanded(true)
        }, at),
      )
    }
    const held = timers
    return () => {
      for (const t of held.current) window.clearTimeout(t)
      held.current = []
    }
  }, [options, target, reduced])

  return (
    <Section title="Roll-off">
      <Card className="flex flex-col gap-3 px-4 py-4">
        <p className="text-sm leading-relaxed text-ink-dim">Neither side would give way, so the district was rolled for.</p>
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
          {options.map((id, i) => {
            const on = i === cursor
            const won = landed && on
            return (
              <li key={id} className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${won ? 'bg-brass text-surface-low' : on ? 'bg-surface-high text-ink' : 'text-ink-dim'}`}>
                <Icon name="map" size={16} className={won ? 'text-surface-low' : 'text-brass'} />
                <span className={`text-sm ${won || on ? 'font-semibold' : ''}`}>{findDistrict(id)?.name ?? id}</span>
              </li>
            )
          })}
        </ul>
        {landed ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="text-sm text-ink">
              The battle is at <span className="font-semibold">{findDistrict(winner)?.name ?? winner}</span>.
            </p>
            <Button variant="ghost" onClick={onDone}>
              Got it
            </Button>
          </div>
        ) : null}
      </Card>
    </Section>
  )
}
