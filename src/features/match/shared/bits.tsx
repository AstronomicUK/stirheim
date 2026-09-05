// Presentational pieces shared by the match screens and the campaign's Battles section: the state
// tag, the ledger-style match row list, and the participant card.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { MatchParticipantView, MatchSummary } from '../../../api/matches'
import type { MatchState } from '../../../domain'
import { Button } from '../../../ui'
import { Tag } from '../../campaign/bits'
import { formatMatchTime, MATCH_STATE_LABELS, matchWhen, pendingLabel, scenarioTitle, versusLabel } from './helpers'

type TagTone = 'neutral' | 'warn' | 'brass'

const STATE_TONES: Record<MatchState, TagTone> = {
  scheduled: 'neutral',
  in_progress: 'brass',
  awaiting_reports: 'warn',
  completed: 'neutral',
  cancelled: 'neutral',
}

export function MatchStateTag({ state }: { state: MatchState }) {
  return <Tag tone={STATE_TONES[state]}>{MATCH_STATE_LABELS[state]}</Tag>
}

export interface RespondHandler {
  (matchId: string, warbandId: string, accept: boolean): void
}

export interface MatchRowsProps {
  matches: MatchSummary[]
  /** When given, scheduled rows with one of my warbands still to answer show Accept / Decline. */
  onRespond?: RespondHandler
  /** Match id whose response is in flight. */
  respondingTo?: string | null
  /** Dim the list (finished games). */
  muted?: boolean
}

/** Compact rows: "A vs B", scenario, date and state tag; each links to the match page. */
export function MatchRows({ matches, onRespond, respondingTo = null, muted = false }: MatchRowsProps) {
  return (
    <ul className={`flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low ${muted ? 'opacity-70' : ''}`}>
      {matches.map((m) => {
        const when = matchWhen(m)
        const pending = m.state === 'scheduled' ? pendingLabel(m.participants) : null
        const mineToAnswer = onRespond && m.state === 'scheduled' ? m.participants.filter((p) => p.mine && p.accepted_at === null) : []
        return (
          <li key={m.id} className="flex flex-col">
            <Link to={`/matches/${m.id}`} className="flex min-h-11 items-start justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-high">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-ink">{versusLabel(m.participants)}</span>
                <span className="truncate text-sm text-ink-dim">
                  {scenarioTitle(m)}
                  {when ? ` · ${formatMatchTime(when)}` : m.state === 'scheduled' ? ' · No date yet' : ''}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <MatchStateTag state={m.state} />
                {pending ? <Tag tone="warn">{pending}</Tag> : null}
              </span>
            </Link>
            {mineToAnswer.length > 0 ? (
              <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-2">
                {mineToAnswer.map((p) => (
                  <div key={p.warband_id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-ink-dim">
                      {mineToAnswer.length > 1 ? `${p.warband_name}: ` : ''}You have been challenged
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <Button variant="secondary" className="min-h-9 px-3 text-sm" pending={respondingTo === m.id} onClick={() => onRespond?.(m.id, p.warband_id, false)}>
                        Decline
                      </Button>
                      <Button className="min-h-9 px-3 text-sm" pending={respondingTo === m.id} onClick={() => onRespond?.(m.id, p.warband_id, true)}>
                        Accept
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export interface ParticipantCardProps {
  participant: MatchParticipantView
  /** Show the accepted / waiting line (scheduled matches). */
  showAcceptance?: boolean
  /** Extra content under the header: live tallies, report status, Accept / Decline. */
  children?: ReactNode
}

export function ParticipantCard({ participant: p, showAcceptance = false, children }: ParticipantCardProps) {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-surface-low px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <Link to={`/warbands/${p.warband_id}`} className="truncate font-medium text-ink no-underline hover:underline">
              {p.warband_name}
            </Link>
            {p.mine ? <Tag tone="brass">You</Tag> : null}
          </span>
          <span className="truncate text-sm text-ink-dim">
            {p.owner_display_name} · {p.type_name}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm tabular-nums text-ink">Rating {p.rating}</span>
          {showAcceptance ? p.accepted_at ? <Tag>Accepted</Tag> : <Tag tone="warn">Waiting</Tag> : null}
        </div>
      </div>
      {children}
    </li>
  )
}
