import { describe, expect, it } from 'vitest'
import type { ReportView } from '../../../api/reports'
import { postBattleRollLines } from './postBattleLog'

function report(partial: Partial<ReportView> = {}): ReportView {
  return {
    id: 'r1',
    match_id: 'm1',
    warband_id: 'w1',
    warband_name: 'Claws of Eshin',
    submitted_by: 'u1',
    submitted_by_display_name: 'Ana',
    submitted_at: '2026-09-04T10:00:00.000Z',
    won: true,
    result: 'won',
    routed: false,
    xp_log: [],
    ooa: [],
    injuries: [],
    exploration: null,
    veteran_pool_roll: null,
    notes: '',
    status: 'applied',
    review_note: null,
    revision: 1,
    amended_at: null,
    amendment_note: null,
    adjustments: [],
    ...partial,
  }
}

describe('postBattleRollLines', () => {
  it('reads a hero injury roll with its outcome', () => {
    const lines = postBattleRollLines(
      report({
        injuries: [{ subjectType: 'hero', subjectId: 'h1', subjectName: 'Skritch Nightblade', rolls: [16, 2, 22, 26], injuryCode: 'x', injuryName: 'Multiple Injuries', effect: '', outcome: 'recovered' }],
      }),
    )
    expect(lines).toEqual(['Skritch Nightblade: rolled 16, 2, 22, 26 — Multiple Injuries (recovered).'])
  })

  it('reads a henchman group roll as dead and recovered counts', () => {
    const lines = postBattleRollLines(report({ injuries: [{ subjectType: 'group', subjectId: 'g1', subjectName: 'Marksmen', rolls: [1, 4, 6], dead: 1 }] }))
    expect(lines).toEqual(['Marksmen: rolled 1, 4, 6 — 1 dead, 2 recovered.'])
  })

  it('reads exploration dice with the location and what was found', () => {
    const lines = postBattleRollLines(
      report({
        exploration: { diceAllowed: 2, diceReason: 'won', rolls: [4, 2], total: 6, shards: 1, locationId: 'x', locationName: 'The Sewers', locationText: '', subRoll: null, goldFound: 15, itemsFound: [], notes: [] },
      }),
    )
    expect(lines).toEqual(['Exploration: rolled 4 2 (total 6) — The Sewers, 1 shard, 15 gc found.'])
  })

  it('reads the veteran pool roll', () => {
    expect(postBattleRollLines(report({ veteran_pool_roll: 9 }))).toEqual(['Veteran pool: rolled 9.'])
  })

  it('is empty when nothing was rolled', () => {
    expect(postBattleRollLines(report())).toEqual([])
  })
})
