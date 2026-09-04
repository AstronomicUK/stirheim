// Pure helpers shared by the match screens and the campaign's Battles section: grouping matches by
// state, "A vs B" labels, scenario title and link resolution, display times, and which actions the
// signed-in user may take on a match. The action rules mirror the checks in
// supabase/migrations/20260904000006_match_functions.sql so the UI only offers what the server
// will accept.

import type { MatchParticipantView, MatchSummary } from '../../../api/matches'
import type { MatchState } from '../../../domain'
import { findScenario } from '../../../rules/data/campaign/scenarios'

// ---- State labels and grouping ----

export const MATCH_STATE_LABELS: Record<MatchState, string> = {
  scheduled: 'Scheduled',
  in_progress: 'Now playing',
  awaiting_reports: 'Awaiting reports',
  completed: 'Finished',
  cancelled: 'Cancelled',
}

export type MatchGroupKey = 'now_playing' | 'awaiting_reports' | 'scheduled' | 'finished'

export const MATCH_GROUP_ORDER: MatchGroupKey[] = ['now_playing', 'awaiting_reports', 'scheduled', 'finished']

export const MATCH_GROUP_TITLES: Record<MatchGroupKey, string> = {
  now_playing: 'Now playing',
  awaiting_reports: 'Awaiting reports',
  scheduled: 'Scheduled',
  finished: 'Finished',
}

export function matchGroupKey(state: MatchState): MatchGroupKey {
  switch (state) {
    case 'in_progress':
      return 'now_playing'
    case 'awaiting_reports':
      return 'awaiting_reports'
    case 'scheduled':
      return 'scheduled'
    case 'completed':
    case 'cancelled':
      return 'finished'
  }
}

type Datable = Pick<MatchSummary, 'state' | 'scheduled_for' | 'started_at' | 'completed_at' | 'created_at'>

/**
 * The one time worth showing for a match in its current state: when it is booked for, when it
 * started, or when it ended. Null for a scheduled match with no date yet.
 */
export function matchWhen(m: Datable): string | null {
  switch (m.state) {
    case 'scheduled':
      return m.scheduled_for
    case 'in_progress':
    case 'awaiting_reports':
      return m.started_at ?? m.scheduled_for
    case 'completed':
    case 'cancelled':
      return m.completed_at ?? m.started_at ?? m.scheduled_for
  }
}

function time(iso: string | null): number {
  const t = iso ? Date.parse(iso) : Number.NaN
  return Number.isNaN(t) ? Number.NaN : t
}

/**
 * Buckets matches for the campaign dashboard. Scheduled games run soonest first, with undated
 * ones after them (newest booking first); every other bucket is most recent first.
 */
export function groupMatches<T extends Datable>(matches: T[]): Record<MatchGroupKey, T[]> {
  const groups: Record<MatchGroupKey, T[]> = { now_playing: [], awaiting_reports: [], scheduled: [], finished: [] }
  for (const m of matches) groups[matchGroupKey(m.state)].push(m)

  groups.scheduled.sort((a, b) => {
    const ta = time(a.scheduled_for)
    const tb = time(b.scheduled_for)
    if (Number.isNaN(ta) && Number.isNaN(tb)) return time(b.created_at) - time(a.created_at)
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  })
  const newestFirst = (a: T, b: T) => {
    const ta = time(matchWhen(a) ?? a.created_at)
    const tb = time(matchWhen(b) ?? b.created_at)
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  }
  groups.now_playing.sort(newestFirst)
  groups.awaiting_reports.sort(newestFirst)
  groups.finished.sort(newestFirst)
  return groups
}

// ---- Labels ----

/** Tag tone for a report's result (or the absence of one) wherever it is shown. */
export const RESULT_TONES: Record<'won' | 'lost' | 'draw' | 'none', 'neutral' | 'warn' | 'brass'> = { won: 'brass', lost: 'warn', draw: 'neutral', none: 'neutral' }

/** "Reikland Watch vs Claws of Eshin" (three or more warbands are all joined with "vs"). */
export function versusLabel(participants: Pick<MatchParticipantView, 'warband_name'>[]): string {
  if (participants.length === 0) return 'No warbands'
  return participants.map((p) => p.warband_name).join(' vs ')
}

type Scenarioed = Pick<MatchSummary, 'scenario_rules_id' | 'custom_scenario_id' | 'custom_scenario_name'>

export const SCENARIO_AT_THE_TABLE = 'Scenario decided at the table'

/** Built-in title from the rules data, the custom scenario's name, or the "decide at the table" line. */
export function scenarioTitle(m: Scenarioed): string {
  if (m.scenario_rules_id) return findScenario(m.scenario_rules_id)?.title ?? m.scenario_rules_id.replace(/_/g, ' ')
  if (m.custom_scenario_id) return m.custom_scenario_name ?? 'Custom scenario'
  return SCENARIO_AT_THE_TABLE
}

/** Where the scenario's full text lives, or null when none was picked. */
export function scenarioLink(m: Scenarioed): string | null {
  if (m.scenario_rules_id) return `/scenarios/builtin/${m.scenario_rules_id}`
  if (m.custom_scenario_id) return `/scenarios/custom/${m.custom_scenario_id}`
  return null
}

/** "Fri 4 Sep, 19:30" in the viewer's time zone; empty string for junk. */
export function formatMatchTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ---- Acceptance ----

export function pendingParticipants<T extends Pick<MatchParticipantView, 'accepted_at'>>(participants: T[]): T[] {
  return participants.filter((p) => p.accepted_at === null)
}

export function allAccepted(participants: Pick<MatchParticipantView, 'accepted_at'>[]): boolean {
  return participants.every((p) => p.accepted_at !== null)
}

/** "Awaiting 1 reply" / "Awaiting 2 replies", or null once everyone has accepted. */
export function pendingLabel(participants: Pick<MatchParticipantView, 'accepted_at'>[]): string | null {
  const n = pendingParticipants(participants).length
  return n === 0 ? null : `Awaiting ${n} ${n === 1 ? 'reply' : 'replies'}`
}

// ---- Actions ----

export interface MatchActions {
  /** Ids of my warbands in this match that have not accepted yet; Accept / Decline is offered for each. */
  respondFor: string[]
  /** Whether to show the Start button at all (scheduled; I am a participant or the GM). */
  showStart: boolean
  /** Start is enabled: everyone has accepted and there are at least two warbands. */
  canStart: boolean
  /** Why Start is disabled while shown. */
  startBlocked: string | null
  /** in_progress and I am a participant or the GM. */
  canEnd: boolean
  /** The GM before completion; the creator while still scheduled. */
  canCancel: boolean
  /** in_progress and one of the warbands is mine. */
  canOpenSheet: boolean
}

type Actionable = Pick<MatchSummary, 'state' | 'created_by' | 'participants'>

export function matchActions(match: Actionable, userId: string | undefined, gmId: string | undefined): MatchActions {
  const isGm = Boolean(userId) && userId === gmId
  const isCreator = Boolean(userId) && userId === match.created_by
  // `mine` on the API view is owner_id === userId; deriving it here keeps this a function of the
  // viewer alone, so the GM looking at someone else's challenge is not treated as a player in it.
  const mine = (p: Pick<MatchParticipantView, 'owner_id'>) => Boolean(userId) && p.owner_id === userId
  const isParticipant = match.participants.some(mine)
  const involved = isGm || isParticipant

  const respondFor = match.state === 'scheduled' ? match.participants.filter((p) => mine(p) && p.accepted_at === null).map((p) => p.warband_id) : []

  const showStart = match.state === 'scheduled' && involved
  const pending = pendingParticipants(match.participants).length
  const tooFew = match.participants.length < 2
  const canStart = showStart && pending === 0 && !tooFew
  let startBlocked: string | null = null
  if (showStart && !canStart) {
    startBlocked = tooFew ? 'A battle needs at least two warbands.' : `${pending} ${pending === 1 ? 'warband has' : 'warbands have'} not accepted yet.`
  }

  const canEnd = match.state === 'in_progress' && involved
  const open = match.state !== 'completed' && match.state !== 'cancelled'
  const canCancel = open && (isGm || (isCreator && match.state === 'scheduled'))
  const canOpenSheet = match.state === 'in_progress' && isParticipant

  return { respondFor, showStart, canStart, startBlocked, canEnd, canCancel, canOpenSheet }
}
