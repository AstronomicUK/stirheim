import { describe, expect, it } from 'vitest'
import { csvCell, RECORDS_CSV_HEADER, toCsv, toRecordsCsv, toRecordsText } from './csv'
import { exploration, record, report } from './fixtures'

const HEADER = 'match_id,date,scenario,warband,player,result,routed,xp_gained,own_out_of_action,injuries,shards_found,gold_found,veteran_pool,notes'

describe('csvCell', () => {
  it('leaves plain values alone', () => {
    expect(csvCell('Skirmish')).toBe('Skirmish')
    expect(csvCell(12)).toBe('12')
    expect(csvCell(true)).toBe('true')
  })
  it('renders null and undefined as an empty field', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
  it('quotes commas', () => {
    expect(csvCell('1 dead, 1 recovered')).toBe('"1 dead, 1 recovered"')
  })
  it('doubles embedded quotes', () => {
    expect(csvCell('The "Watch"')).toBe('"The ""Watch"""')
  })
  it('quotes line breaks', () => {
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
    expect(csvCell('a\r\nb')).toBe('"a\r\nb"')
  })
})

describe('toCsv', () => {
  it('joins with CRLF', () => {
    expect(toCsv([['a', 'b'], [1, null]])).toBe('a,b\r\n1,')
  })
})

describe('toRecordsCsv', () => {
  it('is just the header for no records', () => {
    expect(toRecordsCsv([])).toBe(HEADER)
    expect(RECORDS_CSV_HEADER.join(',')).toBe(HEADER)
  })

  it('writes one line per warband per match in header order', () => {
    const rec = record({
      match_id: 'm1',
      scenario_title: 'Wyrdstone Hunt, revisited',
      completed_at: '2026-09-04T21:30:00.000Z',
      reports: [
        report({
          match_id: 'm1',
          warband_id: 'watch',
          routed: false,
          xp_log: [{ subjectType: 'hero', subjectId: 'c', subjectName: 'Captain', amount: 2, reasons: ['survived', 'winning leader'], xpBefore: 20, xpAfter: 22, advancesEarned: 0 }],
          ooa: [{ subjectType: 'group', subjectId: 'w', subjectName: 'Warriors', count: 2 }],
          injuries: [{ subjectType: 'group', subjectId: 'w', subjectName: 'Warriors', rolls: [1, 5], dead: 1 }],
          exploration: exploration({ shards: 3, goldFound: 15 }),
          veteran_pool_roll: 8,
          notes: 'He said "hold".\nWe held.',
        }),
      ],
    })
    const lines = toRecordsCsv([rec]).split('\r\n')
    // The embedded LF in the notes stays inside its quoted field; only CRLF separates records.
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(HEADER)
    expect(lines[1]).toBe('m1,2026-09-04T21:30:00.000Z,"Wyrdstone Hunt, revisited",Reikland Watch,Tom,won,false,2,2,"1 dead, 1 recovered",3,15,8,"He said ""hold"".\nWe held."')
    expect(lines[2]).toBe('m1,2026-09-04T21:30:00.000Z,"Wyrdstone Hunt, revisited",Claws of Eshin,Ana,no_report,,,,,,,,')
  })

  it('leaves report columns empty for a warband that has not reported', () => {
    const lines = toRecordsCsv([record({ match_id: 'm2', state: 'awaiting_reports', completed_at: null })]).split('\r\n')
    expect(lines[1]).toBe('m2,2026-09-04T19:00:00.000Z,Skirmish,Reikland Watch,Tom,no_report,,,,,,,,')
    expect(lines[2]).toBe('m2,2026-09-04T19:00:00.000Z,Skirmish,Claws of Eshin,Ana,no_report,,,,,,,,')
  })

  it('marks a cancelled match without reports as cancelled', () => {
    const lines = toRecordsCsv([record({ match_id: 'm3', state: 'cancelled' })]).split('\r\n')
    expect(lines[1].split(',')[5]).toBe('cancelled')
  })

  it('handles a match with no date at all', () => {
    const lines = toRecordsCsv([record({ match_id: 'm4', scheduled_for: null, started_at: null, completed_at: null })]).split('\r\n')
    expect(lines[1].startsWith('m4,,Skirmish,')).toBe(true)
  })
})

describe('toRecordsText', () => {
  it('says so when there is nothing', () => {
    expect(toRecordsText([])).toBe('No battles recorded.')
  })
  it('renders a block per match with a line per warband', () => {
    const text = toRecordsText([
      record({
        match_id: 'm1',
        reports: [report({ match_id: 'm1', warband_id: 'watch', exploration: exploration({ shards: 2, goldFound: 5 }), veteran_pool_roll: 6, notes: 'Tight.\nVery.' })],
      }),
    ])
    expect(text).toBe(
      ['Skirmish — 2026-09-04 (completed)', '  - Reikland Watch (Tom) · Won · +0 XP · 0 out of action · 2 shards · 5 gc · veteran pool 6 · Tight. / Very.', '  - Claws of Eshin (Ana) · No report yet'].join('\n'),
    )
  })
})
