// Pure helpers for the schedule / challenge form: the datetime-local <-> ISO conversion, the
// scenario picker's value shape, and the validation that turns the form into a ScheduleMatchInput.

import type { ScheduleMatchInput } from '../../../api/matches'
import type { ScenarioRow } from '../../../domain'
import { findScenario } from '../../../rules/data/campaign/scenarios'
import { SCENARIO_AT_THE_TABLE } from '../shared/helpers'

// ---- Dates ----

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO timestamp to the `YYYY-MM-DDTHH:mm` value a datetime-local input wants, in local time. Empty for none/junk. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

/** A datetime-local value (interpreted in local time) to an ISO timestamp; null when blank or malformed. */
export function fromDateTimeLocal(value: string): string | null {
  const m = LOCAL_RE.exec(value.trim())
  if (!m) return null
  const [year, month, day, hour, minute] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])]
  const second = m[6] ? Number(m[6]) : 0
  const d = new Date(year, month - 1, day, hour, minute, second)
  // Reject values the Date constructor would have "rolled over" (month 13, day 40, 25:00).
  if (Number.isNaN(d.getTime()) || d.getMonth() !== month - 1 || d.getDate() !== day || d.getHours() !== hour || d.getMinutes() !== minute) return null
  return d.toISOString()
}

// ---- Scenario picker ----

export type ScenarioPick = { kind: 'none' } | { kind: 'builtin'; id: string } | { kind: 'custom'; id: string }

export const NO_SCENARIO: ScenarioPick = { kind: 'none' }

export type ScenarioSource = 'core' | 'library' | 'custom' | 'none'

export const SCENARIO_SOURCE_OPTIONS: { value: ScenarioSource; label: string }[] = [
  { value: 'core', label: 'Core rulebook' },
  { value: 'library', label: 'Library' },
  { value: 'custom', label: "Your group's" },
  { value: 'none', label: 'Decide at the table' },
]

/** Custom scenarios that this campaign may use: shared with everyone, or written for this campaign. */
export function customScenariosFor<T extends Pick<ScenarioRow, 'campaign_id'>>(rows: T[], campaignId: string): T[] {
  return rows.filter((r) => r.campaign_id === null || r.campaign_id === campaignId)
}

/** The title for the picker's "Selected" line. */
export function pickTitle(pick: ScenarioPick, custom: Pick<ScenarioRow, 'id' | 'name'>[] = []): string {
  switch (pick.kind) {
    case 'none':
      return SCENARIO_AT_THE_TABLE
    case 'builtin':
      return findScenario(pick.id)?.title ?? pick.id.replace(/_/g, ' ')
    case 'custom':
      return custom.find((c) => c.id === pick.id)?.name ?? 'Custom scenario'
  }
}

export function samePick(a: ScenarioPick, b: ScenarioPick): boolean {
  if (a.kind !== b.kind) return false
  return a.kind === 'none' || b.kind === 'none' || a.id === b.id
}

// ---- Form ----

export type NewMatchMode = 'gm' | 'challenge'

export interface NewMatchForm {
  campaignId: string
  /** Every warband in the game, the challenger's own included. */
  warbandIds: string[]
  scenario: ScenarioPick
  /** datetime-local value; blank for "no date yet". */
  scheduledLocal: string
  notes: string
}

export interface NewMatchOptions {
  mode: NewMatchMode
  /** The signed-in user's warbands enrolled in this campaign (only checked for a challenge). */
  myWarbandIds: string[]
}

export type NewMatchValidation = { ok: true; input: ScheduleMatchInput } | { ok: false; error: string }

/**
 * Mirrors schedule_match(): at least two distinct warbands; a challenge includes exactly one of the
 * challenger's own. Dates are converted to ISO; a malformed date is refused rather than dropped.
 */
export function validateNewMatch(form: NewMatchForm, options: NewMatchOptions): NewMatchValidation {
  const ids = Array.from(new Set(form.warbandIds))
  if (options.mode === 'challenge') {
    const own = ids.filter((id) => options.myWarbandIds.includes(id))
    if (own.length !== 1) return { ok: false, error: 'A challenge includes exactly one of your own warbands.' }
    if (ids.length < 2) return { ok: false, error: 'Pick at least one opponent.' }
  }
  if (ids.length < 2) return { ok: false, error: 'Pick at least two warbands.' }

  let scheduledFor: string | null = null
  if (form.scheduledLocal.trim()) {
    scheduledFor = fromDateTimeLocal(form.scheduledLocal)
    if (!scheduledFor) return { ok: false, error: 'That date and time could not be read.' }
  }

  return {
    ok: true,
    input: {
      campaignId: form.campaignId,
      warbandIds: ids,
      scenarioRulesId: form.scenario.kind === 'builtin' ? form.scenario.id : null,
      customScenarioId: form.scenario.kind === 'custom' ? form.scenario.id : null,
      scheduledFor,
      notes: form.notes.trim(),
    },
  }
}

/** Copy that differs between the GM booking a game and a member issuing a challenge. */
export const NEW_MATCH_COPY: Record<NewMatchMode, { eyebrow: string; title: string; description: string; submit: string; warbands: string }> = {
  gm: {
    eyebrow: 'Campaign',
    title: 'Schedule a battle',
    description: 'Book a game between two or more warbands. Everyone you pick is in; nobody needs to accept.',
    submit: 'Schedule battle',
    warbands: 'Warbands',
  },
  challenge: {
    eyebrow: 'Campaign',
    title: 'Challenge',
    description: 'Call out one or more rival warbands. Their players accept or decline before the battle can start.',
    submit: 'Send challenge',
    warbands: 'Opponents',
  },
}
