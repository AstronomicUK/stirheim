import { describe, expect, it } from 'vitest'
import { csvToRecords } from '../../domain/csv'
import {
  autoMatchScenarios,
  autoMatchWarbands,
  buildMatches,
  buildPayload,
  detectMapping,
  distinctScenarioNames,
  distinctWarbandNames,
  matchScenarioId,
  normaliseHeader,
  parseCount,
  parseDate,
  parseResult,
  unmatchedWarbands,
  validateMapping,
} from './model'

const TODAY = new Date('2026-09-04T12:00:00.000Z')

describe('detectMapping', () => {
  it('reads our own export headers', () => {
    const mapping = detectMapping(['match_id', 'date', 'scenario', 'warband', 'player', 'result', 'routed', 'xp_gained', 'own_out_of_action', 'injuries', 'shards_found', 'gold_found', 'veteran_pool', 'notes'])
    expect(mapping).toEqual({
      matchId: 'match_id',
      date: 'date',
      scenario: 'scenario',
      warband: 'warband',
      player: 'player',
      result: 'result',
      xp: 'xp_gained',
      casualties: 'own_out_of_action',
      notes: 'notes',
    })
  })

  it('is case- and punctuation-insensitive and takes likely Relic & Ruin names', () => {
    const mapping = detectMapping(['Battle ID', 'Recorded', 'Scenario', 'Warband Name', 'Owner', 'Outcome', 'Experience', 'Dead', 'Comments'])
    expect(mapping).toEqual({
      matchId: 'Battle ID',
      date: 'Recorded',
      scenario: 'Scenario',
      warband: 'Warband Name',
      player: 'Owner',
      result: 'Outcome',
      xp: 'Experience',
      casualties: 'Dead',
      notes: 'Comments',
    })
  })

  it('finds the opponent and winner columns of a one-row-per-battle file', () => {
    const mapping = detectMapping(['Date', 'Scenario', 'Warband', 'Opponent Warband', 'Winner'])
    expect(mapping).toEqual({ date: 'Date', scenario: 'Scenario', warband: 'Warband', opponent: 'Opponent Warband', winner: 'Winner' })
  })

  it('gives each header to one field only, exact matches first', () => {
    const mapping = detectMapping(['id', 'Warband', 'Warband Rating', 'Played At'])
    expect(mapping.matchId).toBe('id')
    expect(mapping.warband).toBe('Warband')
    expect(mapping.date).toBe('Played At')
    expect(Object.values(mapping)).not.toContain('Warband Rating')
  })

  it('leaves unknown headers unmapped', () => {
    expect(detectMapping(['foo', 'bar'])).toEqual({})
    expect(normaliseHeader('  Out-of-Action! ')).toBe('outofaction')
  })
})

describe('validateMapping', () => {
  it('needs date, warband and a result or winner', () => {
    expect(validateMapping({})).toHaveLength(3)
    expect(validateMapping({ date: 'd', warband: 'w', result: 'r' })).toEqual([])
    expect(validateMapping({ date: 'd', warband: 'w', winner: 'x' })).toEqual([])
  })
  it('refuses one header on two fields', () => {
    const errors = validateMapping({ date: 'd', warband: 'w', result: 'w' })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/"w" is mapped to more than one field/)
  })
})

describe('parseResult', () => {
  it('reads the usual words and letters', () => {
    for (const w of ['VICTORY', 'won', 'Win', 'w', 'true', 'yes']) expect(parseResult(w)).toBe('won')
    for (const w of ['Defeat', 'lost', 'loss', 'L', 'false', 'no']) expect(parseResult(w)).toBe('lost')
    for (const w of ['Draw', 'tie', 'd', 'Drawn']) expect(parseResult(w)).toBe('draw')
    expect(parseResult('')).toBeNull()
    expect(parseResult('maybe')).toBeNull()
  })
})

describe('parseCount', () => {
  it('takes the first integer', () => {
    expect(parseCount('6')).toBe(6)
    expect(parseCount('+6 XP')).toBe(6)
    expect(parseCount('2 dead')).toBe(2)
    expect(parseCount('none')).toBeNull()
    expect(parseCount('')).toBeNull()
  })
})

describe('parseDate', () => {
  it('reads ISO with a zone exactly', () => {
    expect(parseDate('2026-08-31T09:28:00Z')).toBe('2026-08-31T09:28:00.000Z')
    expect(parseDate('2026-08-31T09:28:00+01:00')).toBe('2026-08-31T08:28:00.000Z')
    expect(parseDate('2026-08-31T09:28:00.123456+00:00')).toBe('2026-08-31T09:28:00.000Z')
  })

  it('reads zone-less formats in local time', () => {
    const expected = new Date(2026, 7, 31, 9, 28).toISOString()
    expect(parseDate('2026-08-31 09:28')).toBe(expected)
    expect(parseDate('Aug 31, 2026 · 09:28')).toBe(expected)
    expect(parseDate('31/08/2026 09:28')).toBe(expected)
    expect(parseDate('31 Aug 2026 9:28 am')).toBe(expected)
    expect(parseDate('August 31st, 2026 at 09:28')).toBe(expected)
    expect(parseDate('31.08.2026 09:28')).toBe(expected)
  })

  it('reads dates without a time as local midnight', () => {
    const midnight = new Date(2026, 7, 31).toISOString()
    expect(parseDate('2026-08-31')).toBe(midnight)
    expect(parseDate('31/08/2026')).toBe(midnight)
    expect(parseDate('31-08-26')).toBe(midnight)
  })

  it('is day-first unless the day slot cannot be a month', () => {
    expect(parseDate('03/08/2026')).toBe(new Date(2026, 7, 3).toISOString())
    expect(parseDate('08/31/2026')).toBe(new Date(2026, 7, 31).toISOString())
  })

  it('handles pm and rejects nonsense', () => {
    expect(parseDate('31/08/2026 7:30 pm')).toBe(new Date(2026, 7, 31, 19, 30).toISOString())
    expect(parseDate('')).toBeNull()
    expect(parseDate('yesterday')).toBeNull()
    expect(parseDate('31/02/2026')).toBeNull()
    expect(parseDate('2026-13-01')).toBeNull()
  })
})

const REPORT_CSV = [
  'match_id,date,scenario,warband,player,result,xp_gained,own_out_of_action,notes',
  'm1,2026-08-31T09:28:00Z,Skirmish,Reikland Watch,Tom,won,6,1,"Held the bridge, barely"',
  'm1,2026-08-31T09:28:00Z,Skirmish,Claws of Eshin,Ana,lost,4,2,',
  'm2,2026-09-02T20:00:00Z,Wyrdstone Hunt,Claws of Eshin,Ana,draw,+5 XP,0,',
  'm2,2026-09-02T20:00:00Z,Wyrdstone Hunt,Reikland Watch,Tom,tie,3,lots,',
  ',2026-09-03T20:00:00Z,Skirmish,,Tom,won,3,0,',
  'm3,not a date,Skirmish,Reikland Watch,Tom,eh,3,0,',
].join('\n')

describe('buildMatches (one row per report)', () => {
  const { headers, rows } = csvToRecords(REPORT_CSV)
  const mapping = detectMapping(headers)
  const result = buildMatches(rows, mapping, TODAY)

  it('groups rows by match id, oldest first, and carries the fields over', () => {
    expect(result.shape).toBe('per_report')
    expect(result.matches).toHaveLength(2)
    const [m1, m2] = result.matches
    expect(m1!.playedAt).toBe('2026-08-31T09:28:00.000Z')
    expect(m1!.scenarioName).toBe('Skirmish')
    expect(m1!.notes).toBe('')
    expect(m1!.participants).toEqual([
      { warbandName: 'Reikland Watch', player: 'Tom', result: 'won', xpGained: 6, casualties: 1, notes: 'Held the bridge, barely', line: 2 },
      { warbandName: 'Claws of Eshin', player: 'Ana', result: 'lost', xpGained: 4, casualties: 2, notes: '', line: 3 },
    ])
    expect(m2!.participants.map((p) => [p.warbandName, p.result, p.xpGained, p.casualties])).toEqual([
      ['Claws of Eshin', 'draw', 5, 0],
      ['Reikland Watch', 'draw', 3, null],
    ])
    expect(result.usedRows).toBe(4)
  })

  it('reports skipped rows and warnings by file line', () => {
    expect(result.problems).toEqual([
      { line: 5, level: 'warning', message: 'Casualties "lots" is not a number; left blank.' },
      { line: 6, level: 'skipped', message: 'No warband name.' },
      { line: 7, level: 'skipped', message: 'Result "eh" not recognised (expected victory / defeat / draw).' },
    ])
  })

  it('groups by date and scenario when there is no match id, splitting when a warband repeats', () => {
    const csv = [
      'date,scenario,warband,result',
      'Aug 31 2026,Skirmish,Reikland Watch,won',
      'Aug 31 2026,Skirmish,Claws of Eshin,lost',
      'Aug 31 2026,Skirmish,Reikland Watch,lost',
      'Aug 31 2026,Skirmish,Marienburgers,won',
      'Sep 1 2026,Occupy,Reikland Watch,won',
    ].join('\n')
    const { headers, rows } = csvToRecords(csv)
    const built = buildMatches(rows, detectMapping(headers), TODAY)
    expect(built.matches.map((m) => m.participants.map((p) => p.warbandName))).toEqual([
      ['Reikland Watch', 'Claws of Eshin'],
      ['Reikland Watch', 'Marienburgers'],
      ['Reikland Watch'],
    ])
    expect(built.problems).toEqual([{ line: 6, level: 'warning', message: '"Reikland Watch" is the only warband in this battle.' }])
  })

  it('falls back to today with a warning for an unreadable date', () => {
    const { headers, rows } = csvToRecords('date,warband,result\nsoon,Reikland Watch,won\nsoon,Claws of Eshin,lost')
    const built = buildMatches(rows, detectMapping(headers), TODAY)
    expect(built.matches).toHaveLength(1)
    expect(built.matches[0]!.playedAt).toBe(TODAY.toISOString())
    expect(built.problems.map((p) => p.message)).toEqual(['Date "soon" not recognised; using today.', 'Date "soon" not recognised; using today.'])
  })

  it('skips a second row for the same warband in one match id', () => {
    const { headers, rows } = csvToRecords('match,date,warband,result\nm1,2026-08-31,Reikland Watch,won\nm1,2026-08-31,Reikland Watch,won')
    const built = buildMatches(rows, detectMapping(headers), TODAY)
    expect(built.matches[0]!.participants).toHaveLength(1)
    expect(built.problems.map((p) => [p.line, p.level])).toEqual([
      [2, 'warning'],
      [3, 'skipped'],
    ])
  })
})

describe('buildMatches (one row per battle)', () => {
  it('makes a two-warband match per row with the inverse result for the opponent', () => {
    const csv = ['Date,Scenario,Warband,Opponent,Result,XP,Notes', '31/08/2026,Skirmish,Reikland Watch,Claws of Eshin,Victory,6,Close one', '01/09/2026,Occupy,Reikland Watch,,Draw,2,'].join('\n')
    const { headers, rows } = csvToRecords(csv)
    const mapping = detectMapping(headers)
    expect(mapping.opponent).toBe('Opponent')
    const built = buildMatches(rows, mapping, TODAY)
    expect(built.shape).toBe('per_match')
    expect(built.matches).toHaveLength(2)
    expect(built.matches[0]!.notes).toBe('Close one')
    expect(built.matches[0]!.participants.map((p) => [p.warbandName, p.result, p.xpGained, p.notes])).toEqual([
      ['Reikland Watch', 'won', 6, ''],
      ['Claws of Eshin', 'lost', null, ''],
    ])
    expect(built.matches[1]!.participants.map((p) => p.result)).toEqual(['draw'])
    expect(built.problems).toEqual([
      { line: 3, level: 'warning', message: 'No second warband; imported as a one-warband battle.' },
      { line: 3, level: 'warning', message: '"Reikland Watch" is the only warband in this battle.' },
    ])
  })

  it('reads results off a winner column', () => {
    const csv = ['Date,Warband,Opponent,Winner', '2026-08-31,Reikland Watch,Claws of Eshin,claws of eshin', '2026-09-01,Reikland Watch,Claws of Eshin,', '2026-09-02,Reikland Watch,Claws of Eshin,Reikland Watch'].join('\n')
    const { headers, rows } = csvToRecords(csv)
    const built = buildMatches(rows, detectMapping(headers), TODAY)
    expect(built.matches.map((m) => m.participants.map((p) => p.result))).toEqual([
      ['lost', 'won'],
      ['draw', 'draw'],
      ['won', 'lost'],
    ])
  })
})

describe('matching names', () => {
  const members = [
    { warband_id: 'w1', name: 'Reikland Watch' },
    { warband_id: 'w2', name: 'Claws of Eshin' },
    { warband_id: 'w3', name: 'The Marienburgers' },
    { warband_id: 'w4', name: 'Sisters' },
    { warband_id: 'w5', name: 'Sisters of Sigmar' },
  ]

  it('matches warbands by normalised name, then by a unique loose match', () => {
    const names = ['reikland  watch', 'CLAWS-OF-ESHIN', 'Marienburgers', 'Sisters of', 'Nobody']
    expect(autoMatchWarbands(names, members)).toEqual({ 'reikland  watch': 'w1', 'CLAWS-OF-ESHIN': 'w2', Marienburgers: 'w3', 'Sisters of': null, Nobody: null })
    expect(unmatchedWarbands(names, autoMatchWarbands(names, members))).toEqual(['Sisters of', 'Nobody'])
  })

  it('lists distinct warband and scenario names in first-seen order', () => {
    const { headers, rows } = csvToRecords('match,date,scenario,warband,result\nm1,2026-08-31,Skirmish,B,won\nm1,2026-08-31,Skirmish,A,lost\nm2,2026-09-01,Scenario 3: Wyrdstone Hunt,b,won\nm2,2026-09-01,,A,lost')
    const built = buildMatches(rows, detectMapping(headers), TODAY)
    expect(distinctWarbandNames(built.matches)).toEqual(['B', 'A'])
    expect(distinctScenarioNames(built.matches)).toEqual(['Skirmish', 'Scenario 3: Wyrdstone Hunt'])
  })

  it('matches scenarios to the library by title, ignoring a numbered prefix', () => {
    expect(matchScenarioId('Skirmish')).toBe('skirmish')
    expect(matchScenarioId('scenario 3: wyrdstone hunt')).toBe('wyrdstone_hunt')
    expect(matchScenarioId('Ambush!')).toBe('ambush')
    expect(matchScenarioId("The Wizard's Mansion")).toBe('the_wizard_s_mansion')
    expect(matchScenarioId('Something we made up')).toBeNull()
    expect(autoMatchScenarios(['Occupy', 'Custom'])).toEqual({ Occupy: 'occupy', Custom: null })
  })
})

describe('buildPayload', () => {
  const { headers, rows } = csvToRecords(REPORT_CSV)
  const built = buildMatches(rows, detectMapping(headers), TODAY)
  const warbands = { 'Reikland Watch': 'w1', 'Claws of Eshin': 'w2' }

  it('produces the RPC shape', () => {
    const payload = buildPayload(built.matches, warbands, { Skirmish: 'skirmish', 'Wyrdstone Hunt': null })
    expect(payload).toEqual([
      {
        scenario_rules_id: 'skirmish',
        scenario_name: 'Skirmish',
        played_at: '2026-08-31T09:28:00.000Z',
        notes: '',
        participants: [
          { warband_id: 'w1', won: true, result: 'won', xp_gained: 6, casualties: 1, notes: 'Held the bridge, barely' },
          { warband_id: 'w2', won: false, result: 'lost', xp_gained: 4, casualties: 2, notes: '' },
        ],
      },
      {
        scenario_rules_id: null,
        scenario_name: 'Wyrdstone Hunt',
        played_at: '2026-09-02T20:00:00.000Z',
        notes: '',
        participants: [
          { warband_id: 'w2', won: false, result: 'draw', xp_gained: 5, casualties: 0, notes: '' },
          { warband_id: 'w1', won: false, result: 'draw', xp_gained: 3, casualties: null, notes: '' },
        ],
      },
    ])
  })

  it('refuses an unmatched warband', () => {
    expect(() => buildPayload(built.matches, { 'Reikland Watch': 'w1', 'Claws of Eshin': null }, {})).toThrow(/Claws of Eshin/)
  })
})

describe('the real Relic & Ruin export (captured 2026-09-05)', () => {
  it('maps its headers and builds eight two-warband battles', async () => {
    const { readFileSync } = await import('node:fs')
    const { csvToRecords } = await import('../../domain/csv')
    const text = readFileSync(new URL('./fixtures/relic-battle-records.csv', import.meta.url), 'utf8')
    const parsedCsv = csvToRecords(text)
    const records = parsedCsv.rows
    const mapping = detectMapping(parsedCsv.headers)
    expect(mapping).toMatchObject({ matchId: 'match_id', date: 'match_created_at', scenario: 'scenario', warband: 'warband_name', result: 'won', xp: 'hero_exp_gained', notes: 'notes' })
    const built = buildMatches(records, mapping, new Date('2026-09-05T12:00:00Z'))
    expect(built.matches).toHaveLength(8)
    expect(built.matches.every((m) => m.participants.length === 2)).toBe(true)
    const hidden = built.matches.find((m) => m.participants.some((p) => p.warbandName === 'The Call of the Grave') && m.scenarioName === 'Hidden Treasure')!
    const grave = hidden.participants.find((p) => p.warbandName === 'The Call of the Grave')!
    expect(grave.result).toBe('won')
    // "Kel'thuzad: 2 (...); Nephanis: 2 (...); King Morlak Velmorn: 1 (...); Sir Jedran Falseborn: 1 (...)" adds up.
    expect(grave.xpGained).toBe(6)
    const evards = hidden.participants.find((p) => p.warbandName === 'Evards Quest')!
    expect(evards.result).toBe('lost')
    expect(built.problems.filter((p) => p.level === 'skipped')).toEqual([])
  })
})
