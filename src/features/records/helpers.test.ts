import { describe, expect, it } from 'vitest'
import { exploration, record, report } from './fixtures'
import {
  countInjuries,
  filterRows,
  groupRowsByMatch,
  notesExcerpt,
  ooaCount,
  recordDate,
  recordRows,
  recordsFileName,
  reportSummary,
  resultLabel,
  summariseInjuries,
  warbandOptions,
  warbandTotals,
  xpGained,
} from './helpers'

const xp = (subjectName: string, amount: number, reasons: string[] = ['survived']) => ({
  subjectType: 'hero' as const,
  subjectId: subjectName.toLowerCase(),
  subjectName,
  amount,
  reasons,
  xpBefore: 0,
  xpAfter: amount,
  advancesEarned: 0,
})

const heroInjury = (subjectName: string, outcome: 'recovered' | 'injured' | 'dead' | 'captured' | 'retired') => ({
  subjectType: 'hero' as const,
  subjectId: subjectName.toLowerCase(),
  subjectName,
  rolls: [4, 2],
  injuryCode: outcome === 'recovered' ? null : '42',
  injuryName: outcome === 'recovered' ? 'Full recovery' : 'Deep wound',
  effect: outcome === 'recovered' ? '' : 'Misses the next game.',
  outcome,
})

const groupInjury = (subjectName: string, rolls: number[]) => ({
  subjectType: 'group' as const,
  subjectId: subjectName.toLowerCase(),
  subjectName,
  rolls,
  dead: rolls.filter((r) => r <= 2).length,
})

describe('xpGained', () => {
  it('sums every line of the log', () => {
    expect(xpGained(report({ xp_log: [xp('Captain', 2), xp('Marksman', 1), xp('Warriors', 3)] }))).toBe(6)
  })
  it('is zero with no lines', () => {
    expect(xpGained(report())).toBe(0)
  })
})

describe('ooaCount', () => {
  it('adds hero singles and group counts', () => {
    const r = report({
      ooa: [
        { subjectType: 'hero', subjectId: 'c', subjectName: 'Captain', count: 1 },
        { subjectType: 'group', subjectId: 'w', subjectName: 'Warriors', count: 3 },
      ],
    })
    expect(ooaCount(r)).toBe(4)
  })
})

describe('summariseInjuries', () => {
  it('is empty when nobody was hurt', () => {
    expect(summariseInjuries([])).toBe('')
  })
  it('counts hero outcomes and henchman deaths, worst first', () => {
    const injuries = [heroInjury('Captain', 'recovered'), heroInjury('Youngblood', 'dead'), heroInjury('Marksman', 'injured'), groupInjury('Warriors', [1, 5, 2])]
    expect(countInjuries(injuries)).toEqual({ dead: 3, injured: 1, recovered: 2, captured: 0, retired: 0 })
    expect(summariseInjuries(injuries)).toBe('3 dead, 1 injured, 2 recovered')
  })
  it('names captured and retired', () => {
    expect(summariseInjuries([heroInjury('A', 'captured'), heroInjury('B', 'retired')])).toBe('1 captured, 1 retired')
  })
})

describe('resultLabel', () => {
  it('labels each result', () => {
    expect(resultLabel('won')).toBe('Won')
    expect(resultLabel('lost')).toBe('Lost')
    expect(resultLabel('draw')).toBe('Draw')
    expect(resultLabel('none')).toBe('No report yet')
    expect(resultLabel('none', 'awaiting_reports')).toBe('No report yet')
  })
  it('reads Cancelled for a cancelled match with no report', () => {
    expect(resultLabel('none', 'cancelled')).toBe('Cancelled')
    expect(resultLabel('won', 'cancelled')).toBe('Won')
  })
})

describe('notesExcerpt', () => {
  it('takes the first line and trims it', () => {
    expect(notesExcerpt('  Held the bridge.\nThen ran.  ')).toBe('Held the bridge.')
  })
  it('cuts long lines with an ellipsis', () => {
    expect(notesExcerpt('abcdefghij', 6)).toBe('abcde…')
    expect(notesExcerpt('abcdef', 6)).toBe('abcdef')
  })
  it('is empty for empty notes', () => {
    expect(notesExcerpt('')).toBe('')
  })
})

describe('reportSummary', () => {
  it('lists result, xp, casualties, injuries and shards', () => {
    const r = report({
      result: 'lost',
      won: false,
      routed: true,
      xp_log: [xp('Captain', 2), xp('Warriors', 1)],
      ooa: [{ subjectType: 'group', subjectId: 'w', subjectName: 'Warriors', count: 2 }],
      injuries: [groupInjury('Warriors', [1, 6])],
      exploration: exploration({ shards: 1 }),
    })
    expect(reportSummary(r)).toBe('Lost · routed · +3 XP · 2 out of action · 1 dead, 1 recovered · 1 shard')
  })
  it('leaves out empty parts', () => {
    expect(reportSummary(report())).toBe('Won · +0 XP · 0 out of action')
  })
})

describe('recordDate', () => {
  it('prefers completed, then started, then booked', () => {
    expect(recordDate({ completed_at: 'c', started_at: 's', scheduled_for: 'b' })).toBe('c')
    expect(recordDate({ completed_at: null, started_at: 's', scheduled_for: 'b' })).toBe('s')
    expect(recordDate({ completed_at: null, started_at: null, scheduled_for: 'b' })).toBe('b')
    expect(recordDate({ completed_at: null, started_at: null, scheduled_for: null })).toBeNull()
  })
})

describe('recordRows', () => {
  it('makes one row per participant, filled from its report when there is one', () => {
    const rec = record({
      match_id: 'm1',
      state: 'awaiting_reports',
      completed_at: null,
      reports: [
        report({
          match_id: 'm1',
          warband_id: 'watch',
          xp_log: [xp('Captain', 2)],
          ooa: [{ subjectType: 'hero', subjectId: 'c', subjectName: 'Captain', count: 1 }],
          injuries: [heroInjury('Captain', 'recovered')],
          exploration: exploration({ shards: 3, goldFound: 10 }),
          veteran_pool_roll: 7,
          notes: 'Close one.',
        }),
      ],
    })
    const rows = recordRows([rec])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      match_id: 'm1',
      state: 'awaiting_reports',
      date: '2026-09-04T19:00:00.000Z',
      scenario: 'Skirmish',
      warband_id: 'watch',
      warband_name: 'Reikland Watch',
      player: 'Tom',
      result: 'won',
      routed: false,
      xp_gained: 2,
      own_out_of_action: 1,
      injuries: '1 recovered',
      shards_found: 3,
      gold_found: 10,
      veteran_pool: 7,
      notes: 'Close one.',
    })
    expect(rows[0].report).toBe(rec.reports[0])
    expect(rows[1]).toMatchObject({
      warband_id: 'eshin',
      player: 'Ana',
      result: 'none',
      routed: null,
      xp_gained: null,
      own_out_of_action: null,
      injuries: '',
      shards_found: null,
      gold_found: null,
      veteran_pool: null,
      notes: '',
      report: null,
    })
  })

  it('reports shards and gold as zero when there was no exploration', () => {
    const rows = recordRows([record({ match_id: 'm1', reports: [report({ match_id: 'm1', exploration: null })] })])
    expect(rows[0]).toMatchObject({ shards_found: 0, gold_found: 0 })
  })

  it('still lists a report whose warband is no longer a participant', () => {
    const rows = recordRows([record({ match_id: 'm1', participants: [], reports: [report({ match_id: 'm1', warband_id: 'ghost', warband_name: 'Ghosts', submitted_by_display_name: 'Bo' })] })])
    expect(rows).toEqual([expect.objectContaining({ warband_id: 'ghost', warband_name: 'Ghosts', player: 'Bo', result: 'won' })])
  })

  it('is empty for no records', () => {
    expect(recordRows([])).toEqual([])
  })
})

describe('warbandTotals', () => {
  const won = (matchId: string, warbandId: string, shards = 0, amount = 2) =>
    report({ match_id: matchId, warband_id: warbandId, warband_name: warbandId, result: 'won', won: true, xp_log: [xp('X', amount)], exploration: exploration({ shards }) })
  const lost = (matchId: string, warbandId: string, injuries: ReturnType<typeof heroInjury>[] = []) =>
    report({ match_id: matchId, warband_id: warbandId, warband_name: warbandId, result: 'lost', won: false, xp_log: [xp('X', 1)], injuries, ooa: [{ subjectType: 'hero', subjectId: 'x', subjectName: 'X', count: 1 }] })

  it('counts games, results, xp, shards, casualties and deaths per warband', () => {
    const records = [
      record({ match_id: 'm1', reports: [won('m1', 'watch', 2), lost('m1', 'eshin', [heroInjury('Sorcerer', 'dead')])] }),
      record({ match_id: 'm2', reports: [lost('m2', 'watch'), won('m2', 'eshin', 1, 3)] }),
      record({ match_id: 'm3', state: 'awaiting_reports', completed_at: null, reports: [won('m3', 'watch', 0)] }),
    ]
    const totals = warbandTotals(records)
    expect(totals.map((t) => t.warband_id)).toEqual(['watch', 'eshin'])
    expect(totals[0]).toMatchObject({ warband_name: 'Reikland Watch', player: 'Tom', games: 3, wins: 2, losses: 1, draws: 0, unreported: 0, xp_gained: 5, shards_found: 2, own_out_of_action: 1, dead: 0 })
    expect(totals[1]).toMatchObject({ warband_name: 'Claws of Eshin', player: 'Ana', games: 3, wins: 1, losses: 1, draws: 0, unreported: 1, xp_gained: 4, shards_found: 1, own_out_of_action: 1, dead: 1 })
  })

  it('counts draws and ignores cancelled matches', () => {
    const draw = (id: string, w: string) => report({ match_id: id, warband_id: w, result: 'draw', won: false })
    const records = [record({ match_id: 'm1', reports: [draw('m1', 'watch'), draw('m1', 'eshin')] }), record({ match_id: 'm2', state: 'cancelled' })]
    const totals = warbandTotals(records)
    expect(totals).toHaveLength(2)
    for (const t of totals) expect(t).toMatchObject({ games: 1, draws: 1, wins: 0, losses: 0 })
  })

  it('orders by wins then name', () => {
    const records = [record({ match_id: 'm1', reports: [won('m1', 'eshin')] })]
    expect(warbandTotals(records).map((t) => t.warband_name)).toEqual(['Claws of Eshin', 'Reikland Watch'])
  })

  it('is empty for no records', () => {
    expect(warbandTotals([])).toEqual([])
  })
})

describe('filters', () => {
  const rows = recordRows([
    record({ match_id: 'm1', reports: [report({ match_id: 'm1', warband_id: 'watch' }), report({ match_id: 'm1', warband_id: 'eshin', result: 'lost', won: false })] }),
    record({ match_id: 'm2', state: 'awaiting_reports', completed_at: null, reports: [report({ match_id: 'm2', warband_id: 'eshin' })] }),
  ])

  it('filterRows narrows by warband and result', () => {
    expect(filterRows(rows, { warbandId: 'all', result: 'all' })).toHaveLength(4)
    expect(filterRows(rows, { warbandId: 'watch', result: 'all' }).map((r) => r.match_id)).toEqual(['m1', 'm2'])
    expect(filterRows(rows, { warbandId: 'all', result: 'won' }).map((r) => r.warband_id)).toEqual(['watch', 'eshin'])
    expect(filterRows(rows, { warbandId: 'all', result: 'none' })).toEqual([expect.objectContaining({ match_id: 'm2', warband_id: 'watch' })])
    expect(filterRows(rows, { warbandId: 'eshin', result: 'lost' })).toHaveLength(1)
  })

  it('warbandOptions lists each warband once, by name', () => {
    expect(warbandOptions(rows)).toEqual([
      { id: 'eshin', name: 'Claws of Eshin' },
      { id: 'watch', name: 'Reikland Watch' },
    ])
  })

  it('groupRowsByMatch keeps record order and drops nothing', () => {
    const groups = groupRowsByMatch(filterRows(rows, { warbandId: 'all', result: 'won' }))
    expect(groups.map((g) => [g.match_id, g.rows.length])).toEqual([
      ['m1', 1],
      ['m2', 1],
    ])
  })
})

describe('recordsFileName', () => {
  it('slugs the campaign name', () => {
    expect(recordsFileName('Shadows over Stirheim')).toBe('stirheim-shadows-over-stirheim-battle-records.csv')
    expect(recordsFileName('  Été / Nuit: "2026"!  ')).toBe('stirheim-ete-nuit-2026-battle-records.csv')
  })
  it('falls back when nothing survives', () => {
    expect(recordsFileName('***')).toBe('stirheim-campaign-battle-records.csv')
  })
})
