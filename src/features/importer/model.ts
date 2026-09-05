// Pure model for the Battle Records importer: which CSV column feeds which field (auto-detected
// from header names, correctable by the GM), how rows become matches, and how names in the file
// are matched to the campaign's warbands and the scenario library. No React, no network.
//
// We have no sample of the Relic & Ruin export yet, so this handles two shapes:
//   * one row per warband report, grouped into matches by a match id column or, failing that,
//     by date + scenario (a warband appearing twice in a group starts a new match);
//   * one row per match, when a second-warband ("opponent") column is mapped: each row is a
//     two-warband battle, the opponent's result being the inverse (or read off a winner column).

import type { ImportMatchPayload } from '../../api/importer'
import { SCENARIOS } from '../../rules/data/campaign/scenarios'

// ---- Target fields and synonyms ----

export const TARGET_FIELDS = ['matchId', 'date', 'scenario', 'warband', 'player', 'result', 'winner', 'xp', 'casualties', 'notes', 'opponent'] as const
export type TargetField = (typeof TARGET_FIELDS)[number]

export interface TargetFieldInfo {
  field: TargetField
  label: string
  hint: string
  required: boolean
}

export const TARGET_FIELD_INFO: TargetFieldInfo[] = [
  { field: 'date', label: 'Date played', hint: 'When the battle was fought or recorded.', required: true },
  { field: 'warband', label: 'Warband', hint: 'The warband this row is about.', required: true },
  { field: 'result', label: 'Result', hint: 'Victory / defeat / draw, or a won column. Not needed if a winner column is mapped.', required: true },
  { field: 'matchId', label: 'Match id', hint: 'Groups rows of the same battle. Without it rows are grouped by date and scenario.', required: false },
  { field: 'scenario', label: 'Scenario', hint: 'Matched to the scenario library by name; unmatched names are kept in the notes.', required: false },
  { field: 'player', label: 'Player', hint: 'Shown in the preview only; the warband decides who owns the record.', required: false },
  { field: 'xp', label: 'Experience gained', hint: 'Whole-warband total for the battle.', required: false },
  { field: 'casualties', label: 'Casualties', hint: 'Own models taken out of action or dead.', required: false },
  { field: 'notes', label: 'Notes', hint: 'Copied into the report (one row per warband) or the match (one row per battle).', required: false },
  { field: 'winner', label: 'Winner', hint: 'Warband name of the winner; blank or "draw" means a draw. Replaces the result column.', required: false },
  { field: 'opponent', label: 'Second warband', hint: 'Map this only when each row is a whole battle with the opponent in its own column.', required: false },
]

/** Header synonyms, compared after normaliseHeader (lower-case, letters and digits only). */
export const SYNONYMS: Record<TargetField, string[]> = {
  matchId: ['match', 'matchid', 'battleid', 'battle', 'id', 'game', 'gameid', 'matchref'],
  date: ['date', 'recorded', 'recordedat', 'played', 'playedat', 'playedon', 'submitted', 'submittedat', 'datetime', 'when', 'timestamp', 'completed', 'completedat', 'matchcreatedat', 'createdat', 'created'],
  scenario: ['scenario', 'scenarioname', 'mission'],
  warband: ['warband', 'warbandname', 'roster', 'rostername', 'name'],
  player: ['player', 'playername', 'owner', 'user', 'username'],
  result: ['result', 'outcome', 'victory', 'won', 'win', 'winlose'],
  winner: ['winner', 'victor', 'winningwarband'],
  // Relic & Ruin's export (reference/relic-and-ruin/battle-records-2026-09-05.csv) has hero_exp_gained
  // as "Name: 2 (Survived +1, Win +1); Name: 1 (...)" and hero_deaths / henchmen_deaths as "group 2: 1".
  xp: ['xp', 'experience', 'xpgained', 'experiencegained', 'exp', 'xpearned', 'totalxp', 'heroexpgained', 'expgained'],
  casualties: ['dead', 'casualties', 'ooa', 'outofaction', 'deaths', 'killed', 'casualtiesdead', 'owncasualties', 'ownoutofaction', 'herodeaths'],
  notes: ['notes', 'note', 'comment', 'comments', 'description', 'summary'],
  opponent: ['opponent', 'opponentwarband', 'opponents', 'versus', 'vs', 'enemy', 'enemywarband', 'warband2', 'secondwarband', 'against'],
}

/** Order in which targets claim a header when only a substring matches (more specific first). */
const CONTAINS_ORDER: TargetField[] = ['matchId', 'opponent', 'winner', 'scenario', 'date', 'warband', 'player', 'result', 'xp', 'casualties', 'notes']

/** Lower-case letters and digits only: "Warband Name" and "warband_name" both become "warbandname". */
export function normaliseHeader(header: string): string {
  return header
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Target field → source header. A field that is absent is not mapped. */
export type ColumnMapping = Partial<Record<TargetField, string>>

/**
 * Guesses the mapping from header names: exact synonym matches first, then headers that contain
 * a synonym of four or more characters. Each header feeds at most one field and each field takes
 * at most one header.
 */
export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const taken = new Set<string>()
  const normalised = headers.map((h) => [h, normaliseHeader(h)] as const)

  for (const field of TARGET_FIELDS) {
    const hit = normalised.find(([h, n]) => !taken.has(h) && SYNONYMS[field].includes(n))
    if (hit) {
      mapping[field] = hit[0]
      taken.add(hit[0])
    }
  }
  for (const field of CONTAINS_ORDER) {
    if (mapping[field]) continue
    const long = SYNONYMS[field].filter((s) => s.length >= 4)
    const hit = normalised.find(([h, n]) => !taken.has(h) && long.some((s) => n.includes(s)))
    if (hit) {
      mapping[field] = hit[0]
      taken.add(hit[0])
    }
  }
  return mapping
}

/** Human-readable reasons the mapping is not usable yet; empty when it is. */
export function validateMapping(mapping: ColumnMapping): string[] {
  const missing: string[] = []
  if (!mapping.date) missing.push('Pick the column with the date the battle was played.')
  if (!mapping.warband) missing.push('Pick the column with the warband name.')
  if (!mapping.result && !mapping.winner) missing.push('Pick a result column (victory / defeat / draw), or a winner column.')
  const used = new Map<string, TargetField[]>()
  for (const field of TARGET_FIELDS) {
    const header = mapping[field]
    if (!header) continue
    used.set(header, [...(used.get(header) ?? []), field])
  }
  for (const [header, fields] of used) {
    if (fields.length > 1) missing.push(`"${header}" is mapped to more than one field (${fields.map(fieldLabel).join(', ')}).`)
  }
  return missing
}

export function fieldLabel(field: TargetField): string {
  return TARGET_FIELD_INFO.find((f) => f.field === field)?.label ?? field
}

// ---- Cell parsing ----

export type ResultValue = 'won' | 'lost' | 'draw'

const RESULT_WORDS: Record<string, ResultValue> = {
  won: 'won', win: 'won', winner: 'won', victory: 'won', victorious: 'won', w: 'won', v: 'won', true: 'won', yes: 'won', y: 'won', '1': 'won',
  lost: 'lost', loss: 'lost', lose: 'lost', loser: 'lost', defeat: 'lost', defeated: 'lost', l: 'lost', false: 'lost', no: 'lost', n: 'lost', '0': 'lost',
  draw: 'draw', drawn: 'draw', tie: 'draw', tied: 'draw', d: 'draw', t: 'draw',
}

/** "VICTORY", "Won", "w", "true" → won; "Defeat", "l", "false" → lost; "Draw", "tie" → draw; else null. */
export function parseResult(text: string): ResultValue | null {
  const key = text.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return RESULT_WORDS[key] ?? null
}

/**
 * The count in a cell: "+6 XP" → 6, "2 dead" → 2. A per-warrior breakdown ("Skritch: 2 (Survived
 * +1, Win +1); Verminkin: 1 (Survived +1)", Relic & Ruin's export) adds up the number after each
 * name. Null when there is no number at all.
 */
export function parseCount(text: string): number | null {
  const parts = text.split(';').map((p) => p.trim()).filter(Boolean)
  const perName = parts.map((p) => /^[^:]+:\s*([-+]?\d+)/.exec(p)?.[1]).filter((v): v is string => v !== undefined)
  if (parts.length > 0 && perName.length === parts.length) return perName.reduce((n, v) => n + Number.parseInt(v, 10), 0)
  const m = /[-+]?\d+/.exec(text)
  return m ? Number.parseInt(m[0], 10) : null
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
}

function toHours(h: string | undefined, meridiem: string | undefined): number {
  let hours = h ? Number.parseInt(h, 10) : 0
  const m = meridiem?.toLowerCase()
  if (m === 'pm' && hours < 12) hours += 12
  if (m === 'am' && hours === 12) hours = 0
  return hours
}

function makeDate(year: number, month: number, day: number, hours: number, minutes: number, seconds: number, zone: string | undefined): string | null {
  if (month < 0 || month > 11 || day < 1 || day > 31 || hours > 23 || minutes > 59 || seconds > 59) return null
  let date: Date
  if (zone) {
    const z = zone.toUpperCase() === 'Z' ? 'Z' : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    date = new Date(`${pad(year, 4)}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}${z}`)
    if (Number.isNaN(date.getTime())) return null
    const check = new Date(date.getTime() + offsetMinutes(z) * 60_000)
    if (check.getUTCDate() !== day || check.getUTCMonth() !== month) return null
  } else {
    date = new Date(year, month, day, hours, minutes, seconds)
    if (date.getDate() !== day || date.getMonth() !== month) return null
  }
  return date.toISOString()
}

function offsetMinutes(zone: string): number {
  if (zone === 'Z') return 0
  const sign = zone.startsWith('-') ? -1 : 1
  const [h, m] = zone.slice(1).split(':')
  return sign * (Number(h) * 60 + Number(m ?? 0))
}

const TIME = String.raw`(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?`

/**
 * Reads the date formats a tracker export or a spreadsheet is likely to hold and returns an ISO
 * timestamp, or null. Accepts ISO 8601 (with or without time and zone), "2026-08-31 09:28",
 * day-first numerics ("31/08/2026", "31.08.2026 19:30"; month-first only when the day slot is
 * over 12), and month names ("Aug 31, 2026 · 09:28", "31 Aug 2026"). Times without a zone are
 * taken in the viewer's local time.
 */
export function parseDate(text: string): string | null {
  const t = text
    .trim()
    .replace(/\s*[·•|]\s*/g, ' ')
    .replace(/,\s*/g, ' ')
    .replace(/\s+at\s+/i, ' ')
    .replace(/\s+/g, ' ')
  if (!t) return null

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(t)
  if (m) return makeDate(+m[1]!, +m[2]! - 1, +m[3]!, m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, m[7])

  m = new RegExp(String.raw`^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})${TIME}$`, 'i').exec(t)
  if (m) {
    const a = +m[1]!
    const b = +m[2]!
    const dayFirst = !(a <= 12 && b > 12)
    const day = dayFirst ? a : b
    const month = (dayFirst ? b : a) - 1
    const year = m[3]!.length === 2 ? 2000 + +m[3]! : +m[3]!
    return makeDate(year, month, day, toHours(m[4], m[7]), m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, undefined)
  }

  m = new RegExp(String.raw`^([a-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)? (\d{4})${TIME}$`, 'i').exec(t)
  if (m) {
    const month = MONTHS[m[1]!.toLowerCase()]
    if (month === undefined) return null
    return makeDate(+m[3]!, month, +m[2]!, toHours(m[4], m[7]), m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, undefined)
  }

  m = new RegExp(String.raw`^(\d{1,2})(?:st|nd|rd|th)? ([a-z]{3,9})\.? (\d{4})${TIME}$`, 'i').exec(t)
  if (m) {
    const month = MONTHS[m[2]!.toLowerCase()]
    if (month === undefined) return null
    return makeDate(+m[3]!, month, +m[1]!, toHours(m[4], m[7]), m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, undefined)
  }

  const fallback = new Date(text.trim())
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
}

// ---- Rows to matches ----

export interface ImportParticipant {
  warbandName: string
  player: string | null
  result: ResultValue
  xpGained: number | null
  casualties: number | null
  notes: string
  /** 1-based line in the file (the header is line 1). */
  line: number
}

export interface ImportMatch {
  key: string
  /** ISO timestamp. */
  playedAt: string
  /** The date cell as written, for the preview. */
  dateText: string
  scenarioName: string | null
  notes: string
  participants: ImportParticipant[]
  lines: number[]
}

export interface RowProblem {
  line: number
  /** `skipped` rows are left out; `warning` rows are imported with a best guess. */
  level: 'skipped' | 'warning'
  message: string
}

export type ImportShape = 'per_report' | 'per_match'

export interface BuildResult {
  matches: ImportMatch[]
  problems: RowProblem[]
  shape: ImportShape
  /** Rows that produced a participant (not skipped). */
  usedRows: number
}

/** Lower-case letters and digits only, for comparing names typed by different people. */
export function normaliseName(name: string): string {
  return normaliseHeader(name)
}

function cell(row: Record<string, string>, header: string | undefined): string {
  return header ? (row[header] ?? '').trim() : ''
}

function resultFromWinner(winner: string, warbandName: string): ResultValue {
  const w = normaliseName(winner)
  if (!w || parseResult(winner) === 'draw') return 'draw'
  return w === normaliseName(warbandName) ? 'won' : 'lost'
}

const INVERSE: Record<ResultValue, ResultValue> = { won: 'lost', lost: 'won', draw: 'draw' }

/**
 * Turns the CSV rows into matches using the mapping. Rows without a warband or with an
 * unreadable result are skipped; unreadable dates fall back to `today` with a warning; unreadable
 * numbers become null with a warning. Matches come back oldest first.
 */
export function buildMatches(rows: Record<string, string>[], mapping: ColumnMapping, today: Date = new Date()): BuildResult {
  const shape: ImportShape = mapping.opponent ? 'per_match' : 'per_report'
  const problems: RowProblem[] = []
  /** Current group per base key (match id, or date + scenario). */
  const groups = new Map<string, ImportMatch>()
  /** How many groups a date + scenario key has been split into. */
  const splits = new Map<string, number>()
  const order: ImportMatch[] = []
  const todayIso = today.toISOString()
  let usedRows = 0

  rows.forEach((row, index) => {
    const line = index + 2
    const warbandName = cell(row, mapping.warband)
    if (!warbandName) {
      problems.push({ line, level: 'skipped', message: 'No warband name.' })
      return
    }

    let result: ResultValue
    if (mapping.winner) {
      result = resultFromWinner(cell(row, mapping.winner), warbandName)
    } else {
      const parsed = parseResult(cell(row, mapping.result))
      if (!parsed) {
        problems.push({ line, level: 'skipped', message: `Result "${cell(row, mapping.result)}" not recognised (expected victory / defeat / draw).` })
        return
      }
      result = parsed
    }

    const dateText = cell(row, mapping.date)
    let playedAt = parseDate(dateText)
    if (!playedAt) {
      problems.push({ line, level: 'warning', message: dateText ? `Date "${dateText}" not recognised; using today.` : 'No date; using today.' })
      playedAt = todayIso
    }

    const xpText = cell(row, mapping.xp)
    const xpGained = xpText ? parseCount(xpText) : null
    if (xpText && xpGained === null) problems.push({ line, level: 'warning', message: `Experience "${xpText}" is not a number; left blank.` })
    const deadText = cell(row, mapping.casualties)
    const casualties = deadText ? parseCount(deadText) : null
    if (deadText && casualties === null) problems.push({ line, level: 'warning', message: `Casualties "${deadText}" is not a number; left blank.` })

    const scenarioName = cell(row, mapping.scenario) || null
    const notes = cell(row, mapping.notes)
    const player = cell(row, mapping.player) || null
    const participant: ImportParticipant = { warbandName, player, result, xpGained, casualties, notes: shape === 'per_report' ? notes : '', line }
    usedRows += 1

    if (shape === 'per_match') {
      const match: ImportMatch = { key: `line:${line}`, playedAt, dateText, scenarioName, notes, participants: [participant], lines: [line] }
      const opponentName = cell(row, mapping.opponent)
      if (opponentName) {
        const opponentResult = mapping.winner ? resultFromWinner(cell(row, mapping.winner), opponentName) : INVERSE[result]
        match.participants.push({ warbandName: opponentName, player: null, result: opponentResult, xpGained: null, casualties: null, notes: '', line })
      } else {
        problems.push({ line, level: 'warning', message: 'No second warband; imported as a one-warband battle.' })
      }
      order.push(match)
      return
    }

    const matchId = cell(row, mapping.matchId)
    const baseKey = matchId ? `id:${matchId}` : `when:${dateText}|${normaliseName(scenarioName ?? '')}`
    let match = groups.get(baseKey)
    // Grouping by date and scenario: rows are taken in file order, and a warband that is already
    // in the current group for that day and scenario starts the next battle.
    if (!matchId && match?.participants.some((p) => normaliseName(p.warbandName) === normaliseName(warbandName))) {
      match = undefined
    }
    if (!match) {
      const n = (splits.get(baseKey) ?? 0) + 1
      splits.set(baseKey, n)
      match = { key: n === 1 ? baseKey : `${baseKey}#${n}`, playedAt, dateText, scenarioName, notes: '', participants: [], lines: [] }
      groups.set(baseKey, match)
      order.push(match)
    } else if (!match.scenarioName && scenarioName) {
      match.scenarioName = scenarioName
    }
    if (matchId && match.participants.some((p) => normaliseName(p.warbandName) === normaliseName(warbandName))) {
      problems.push({ line, level: 'skipped', message: `"${warbandName}" already has a row in battle ${matchId}.` })
      usedRows -= 1
      return
    }
    match.participants.push(participant)
    match.lines.push(line)
  })

  for (const match of order) {
    if (match.participants.length === 1) {
      problems.push({ line: match.lines[0]!, level: 'warning', message: `"${match.participants[0]!.warbandName}" is the only warband in this battle.` })
    }
  }

  const matches = [...order].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
  problems.sort((a, b) => a.line - b.line)
  return { matches, problems, shape, usedRows }
}

// ---- Matching names to the campaign ----

export interface MemberOption {
  warband_id: string
  name: string
}

/** Distinct warband names across the matches, in first-seen order. */
export function distinctWarbandNames(matches: ImportMatch[]): string[] {
  const seen = new Map<string, string>()
  for (const m of matches) for (const p of m.participants) if (!seen.has(normaliseName(p.warbandName))) seen.set(normaliseName(p.warbandName), p.warbandName)
  return [...seen.values()]
}

/**
 * CSV name → campaign warband id, by normalised name; failing that, the one member whose name
 * contains (or is contained in) the CSV name; else null.
 */
export function autoMatchWarbands(names: string[], members: MemberOption[]): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const name of names) {
    const n = normaliseName(name)
    const exact = members.filter((m) => normaliseName(m.name) === n)
    if (exact.length === 1) {
      out[name] = exact[0]!.warband_id
      continue
    }
    const loose = n.length >= 3 ? members.filter((m) => normaliseName(m.name).includes(n) || n.includes(normaliseName(m.name))) : []
    out[name] = loose.length === 1 ? loose[0]!.warband_id : null
  }
  return out
}

/** Names still without a campaign warband. */
export function unmatchedWarbands(names: string[], assignments: Record<string, string | null>): string[] {
  return names.filter((n) => !assignments[n])
}

/** Distinct scenario names across the matches, in first-seen order. */
export function distinctScenarioNames(matches: ImportMatch[]): string[] {
  const seen = new Map<string, string>()
  for (const m of matches) if (m.scenarioName && !seen.has(normaliseName(m.scenarioName))) seen.set(normaliseName(m.scenarioName), m.scenarioName)
  return [...seen.values()]
}

/** A built-in scenario id whose title (or id) matches the name, ignoring case, punctuation and a "Scenario 2:" prefix. */
export function matchScenarioId(name: string): string | null {
  const n = normaliseName(name.replace(/^scenario\s*\d+\s*[:.-]?\s*/i, ''))
  if (!n) return null
  const hit = SCENARIOS.find((s) => normaliseName(s.title) === n || normaliseName(s.id) === n)
  return hit?.id ?? null
}

export function autoMatchScenarios(names: string[]): Record<string, string | null> {
  return Object.fromEntries(names.map((n) => [n, matchScenarioId(n)]))
}

// ---- Payload ----

/**
 * The RPC payload. Every participant must have a warband id in `warbandIds`; throws otherwise
 * (the screen blocks the import before this point).
 */
export function buildPayload(matches: ImportMatch[], warbandIds: Record<string, string | null>, scenarioIds: Record<string, string | null>): ImportMatchPayload[] {
  return matches.map((m) => ({
    scenario_rules_id: m.scenarioName ? (scenarioIds[m.scenarioName] ?? null) : null,
    scenario_name: m.scenarioName ?? undefined,
    played_at: m.playedAt,
    notes: m.notes,
    participants: m.participants.map((p) => {
      const warband_id = warbandIds[p.warbandName]
      if (!warband_id) throw new Error(`"${p.warbandName}" is not matched to a warband in this campaign.`)
      return { warband_id, won: p.result === 'won', result: p.result, xp_gained: p.xpGained, casualties: p.casualties, notes: p.notes }
    }),
  }))
}
