// Pure helpers for the Battle Records page and the report cards on the match page: totals read
// off a stored report (xp gained, own casualties, an injuries summary), the one-row-per-warband-
// per-match flattening the records table and its CSV share, per-warband standings, and filters.
// No React, no network; everything here is unit tested.

import type { BattleRecord, ReportView } from '../../api/reports'
import type { MatchState } from '../../domain'

// ---- Reading one report ----

/** Experience awarded across every line of the report. */
export function xpGained(report: Pick<ReportView, 'xp_log'>): number {
  return report.xp_log.reduce((sum, line) => sum + line.amount, 0)
}

/** Own models taken out of action (heroes count one each; groups the models lost). */
export function ooaCount(report: Pick<ReportView, 'ooa'>): number {
  return report.ooa.reduce((sum, line) => sum + line.count, 0)
}

export interface InjuryCounts {
  dead: number
  injured: number
  recovered: number
  captured: number
  retired: number
}

/**
 * Tallies injury outcomes. Hero and hired-sword lines contribute their outcome; a henchman group
 * line contributes `dead` deaths and one recovery per surviving roll.
 */
export function countInjuries(injuries: ReportView['injuries']): InjuryCounts {
  const counts: InjuryCounts = { dead: 0, injured: 0, recovered: 0, captured: 0, retired: 0 }
  for (const line of injuries) {
    if (line.subjectType === 'group') {
      counts.dead += line.dead
      counts.recovered += Math.max(0, line.rolls.length - line.dead)
    } else {
      counts[line.outcome] += 1
    }
  }
  return counts
}

const INJURY_ORDER: (keyof InjuryCounts)[] = ['dead', 'captured', 'retired', 'injured', 'recovered']

/** "1 dead, 2 injured, 1 recovered"; empty string when nobody was hurt. */
export function summariseInjuries(injuries: ReportView['injuries']): string {
  const counts = countInjuries(injuries)
  return INJURY_ORDER.filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${k}`)
    .join(', ')
}

export type RecordResult = ReportView['result'] | 'none'

const RESULT_LABELS: Record<RecordResult, string> = { won: 'Won', lost: 'Lost', draw: 'Draw', none: 'No report yet' }

/** Human label for a result; a cancelled match with no report reads "Cancelled" rather than "No report yet". */
export function resultLabel(result: RecordResult, state?: MatchState): string {
  if (result === 'none' && state === 'cancelled') return 'Cancelled'
  return RESULT_LABELS[result]
}

/** The first line of the notes, cut to `max` characters with an ellipsis. */
export function notesExcerpt(notes: string, max = 80): string {
  const first = notes.trim().split(/\r?\n/)[0] ?? ''
  if (first.length <= max) return first
  return `${first.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/** One-line summary for a collapsed report card: "Won · +6 XP · 2 out of action · 1 dead". */
export function reportSummary(report: ReportView): string {
  const parts = [resultLabel(report.result)]
  if (report.routed) parts.push('routed')
  parts.push(`+${xpGained(report)} XP`)
  const ooa = ooaCount(report)
  parts.push(`${ooa} out of action`)
  const injuries = summariseInjuries(report.injuries)
  if (injuries) parts.push(injuries)
  const shards = report.exploration?.shards ?? 0
  if (shards > 0) parts.push(`${shards} ${shards === 1 ? 'shard' : 'shards'}`)
  return parts.join(' · ')
}

// ---- The records table ----

/** One warband's line in one match: the participant plus whatever it reported. */
export interface RecordRow {
  match_id: string
  state: MatchState
  /** When the match ended, else when it started, else when it was booked for. */
  date: string | null
  scenario: string
  warband_id: string
  warband_name: string
  player: string
  result: RecordResult
  /** Null until a report is filed. */
  routed: boolean | null
  xp_gained: number | null
  own_out_of_action: number | null
  injuries: string
  shards_found: number | null
  gold_found: number | null
  veteran_pool: number | null
  notes: string
  report: ReportView | null
}

/** The date worth recording for a match: ended, else started, else booked for. */
export function recordDate(record: Pick<BattleRecord, 'completed_at' | 'started_at' | 'scheduled_for'>): string | null {
  return record.completed_at ?? record.started_at ?? record.scheduled_for
}

/**
 * Flattens the campaign's records to one row per warband per match, in the order the records
 * arrive. A report filed by a warband no longer listed as a participant still gets a row.
 */
export function recordRows(records: BattleRecord[]): RecordRow[] {
  const rows: RecordRow[] = []
  for (const record of records) {
    const seen = new Set<string>()
    const base = { match_id: record.match_id, state: record.state, date: recordDate(record), scenario: record.scenario_title }
    for (const p of record.participants) {
      seen.add(p.warband_id)
      const report = record.reports.find((r) => r.warband_id === p.warband_id) ?? null
      rows.push({ ...base, warband_id: p.warband_id, warband_name: p.warband_name, player: p.owner_display_name, ...reportFields(report) })
    }
    for (const report of record.reports) {
      if (seen.has(report.warband_id)) continue
      seen.add(report.warband_id)
      rows.push({ ...base, warband_id: report.warband_id, warband_name: report.warband_name, player: report.submitted_by_display_name, ...reportFields(report) })
    }
  }
  return rows
}

function reportFields(report: ReportView | null): Pick<RecordRow, 'result' | 'routed' | 'xp_gained' | 'own_out_of_action' | 'injuries' | 'shards_found' | 'gold_found' | 'veteran_pool' | 'notes' | 'report'> {
  if (!report) {
    return { result: 'none', routed: null, xp_gained: null, own_out_of_action: null, injuries: '', shards_found: null, gold_found: null, veteran_pool: null, notes: '', report: null }
  }
  return {
    result: report.result,
    routed: report.routed,
    xp_gained: xpGained(report),
    own_out_of_action: ooaCount(report),
    injuries: summariseInjuries(report.injuries),
    shards_found: report.exploration?.shards ?? 0,
    gold_found: report.exploration?.goldFound ?? 0,
    veteran_pool: report.veteran_pool_roll,
    notes: report.notes,
    report,
  }
}

// ---- Standings ----

export interface WarbandTotals {
  warband_id: string
  warband_name: string
  player: string
  /** Matches played that were not cancelled, whether or not a report is in yet. */
  games: number
  wins: number
  losses: number
  draws: number
  /** Games still waiting on this warband's report. */
  unreported: number
  xp_gained: number
  shards_found: number
  own_out_of_action: number
  dead: number
}

/**
 * Per-warband standings across the records, sorted by wins then name. Cancelled matches are left
 * out entirely; a game without a report counts as played but not as a win, loss or draw.
 */
export function warbandTotals(records: BattleRecord[]): WarbandTotals[] {
  const totals = new Map<string, WarbandTotals>()
  for (const row of recordRows(records)) {
    if (row.state === 'cancelled') continue
    let t = totals.get(row.warband_id)
    if (!t) {
      t = { warband_id: row.warband_id, warband_name: row.warband_name, player: row.player, games: 0, wins: 0, losses: 0, draws: 0, unreported: 0, xp_gained: 0, shards_found: 0, own_out_of_action: 0, dead: 0 }
      totals.set(row.warband_id, t)
    }
    t.games += 1
    if (row.result === 'won') t.wins += 1
    else if (row.result === 'lost') t.losses += 1
    else if (row.result === 'draw') t.draws += 1
    else t.unreported += 1
    t.xp_gained += row.xp_gained ?? 0
    t.shards_found += row.shards_found ?? 0
    t.own_out_of_action += row.own_out_of_action ?? 0
    if (row.report) t.dead += countInjuries(row.report.injuries).dead
  }
  return [...totals.values()].sort((a, b) => b.wins - a.wins || a.warband_name.localeCompare(b.warband_name))
}

// ---- Filters ----

export type ResultFilter = 'all' | RecordResult

export interface RecordFilters {
  /** A warband id, or 'all'. */
  warbandId: string
  result: ResultFilter
}

export const NO_FILTERS: RecordFilters = { warbandId: 'all', result: 'all' }

export function filterRows(rows: RecordRow[], filters: RecordFilters): RecordRow[] {
  return rows.filter((r) => (filters.warbandId === 'all' || r.warband_id === filters.warbandId) && (filters.result === 'all' || r.result === filters.result))
}

/** Distinct warbands across the rows, by name, for the filter select. */
export function warbandOptions(rows: Pick<RecordRow, 'warband_id' | 'warband_name'>[]): { id: string; name: string }[] {
  const seen = new Map<string, string>()
  for (const r of rows) if (!seen.has(r.warband_id)) seen.set(r.warband_id, r.warband_name)
  return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
}

/** Groups rows back under their match, keeping the records' order. */
export function groupRowsByMatch(rows: RecordRow[]): { match_id: string; rows: RecordRow[] }[] {
  const groups: { match_id: string; rows: RecordRow[] }[] = []
  const byId = new Map<string, RecordRow[]>()
  for (const row of rows) {
    let list = byId.get(row.match_id)
    if (!list) {
      list = []
      byId.set(row.match_id, list)
      groups.push({ match_id: row.match_id, rows: list })
    }
    list.push(row)
  }
  return groups
}

// ---- Export names ----

/** "stirheim-<campaign>-battle-records.csv", with the campaign name reduced to a safe slug. */
export function recordsFileName(campaignName: string): string {
  const slug = campaignName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `stirheim-${slug || 'campaign'}-battle-records.csv`
}
