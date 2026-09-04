// CSV export of the campaign's battle records: one line per warband per match, RFC 4180 quoting
// (fields with commas, quotes or line breaks are wrapped in double quotes, quotes doubled), CRLF
// line ends. Plus a plain-text rendering for "Copy as text".

import type { BattleRecord } from '../../api/reports'
import { recordRows, resultLabel, type RecordRow } from './helpers'

export const RECORDS_CSV_HEADER = [
  'match_id',
  'date',
  'scenario',
  'warband',
  'player',
  'result',
  'routed',
  'xp_gained',
  'own_out_of_action',
  'injuries',
  'shards_found',
  'gold_found',
  'veteran_pool',
  'notes',
] as const

/** Quote one field per RFC 4180. Null and undefined become the empty field. */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Joins rows of cells with CRLF; each cell is quoted as needed. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function csvResult(row: RecordRow): string {
  if (row.result !== 'none') return row.result
  return row.state === 'cancelled' ? 'cancelled' : 'no_report'
}

export function recordRowToCsvRow(row: RecordRow): (string | number | boolean | null)[] {
  return [
    row.match_id,
    row.date,
    row.scenario,
    row.warband_name,
    row.player,
    csvResult(row),
    row.routed,
    row.xp_gained,
    row.own_out_of_action,
    row.injuries,
    row.shards_found,
    row.gold_found,
    row.veteran_pool,
    row.notes,
  ]
}

/** The whole records table as CSV; the header row alone when there is nothing to export. */
export function toRecordsCsv(records: BattleRecord[]): string {
  return toCsv([[...RECORDS_CSV_HEADER], ...recordRows(records).map(recordRowToCsvRow)])
}

/** A readable plain-text version of the same table, one match per block, for the clipboard. */
export function toRecordsText(records: BattleRecord[]): string {
  if (records.length === 0) return 'No battles recorded.'
  return records
    .map((record) => {
      const rows = recordRows([record])
      const head = `${record.scenario_title}${rows[0]?.date ? ` — ${rows[0].date.slice(0, 10)}` : ''} (${record.state.replace(/_/g, ' ')})`
      const lines = rows.map((r) => {
        const bits = [`${r.warband_name} (${r.player})`, resultLabel(r.result, r.state)]
        if (r.report) {
          if (r.routed) bits.push('routed')
          bits.push(`+${r.xp_gained} XP`, `${r.own_out_of_action} out of action`)
          if (r.injuries) bits.push(r.injuries)
          bits.push(`${r.shards_found} shards`, `${r.gold_found} gc`)
          if (r.veteran_pool !== null) bits.push(`veteran pool ${r.veteran_pool}`)
          if (r.notes.trim()) bits.push(r.notes.trim().replace(/\s*\r?\n\s*/g, ' / '))
        }
        return `  - ${bits.join(' · ')}`
      })
      return [head, ...lines].join('\n')
    })
    .join('\n\n')
}
