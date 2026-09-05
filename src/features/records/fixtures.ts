// Builders for the records tests. Not shipped: only *.test.ts files import this.

import type { BattleRecord, ReportView } from '../../api/reports'
import type { ExplorationRecord } from '../../domain'

export function exploration(partial: Partial<ExplorationRecord> = {}): ExplorationRecord {
  return {
    diceAllowed: 2,
    diceReason: '2 heroes standing',
    rolls: [3, 4],
    total: 7,
    shards: 2,
    locationId: null,
    locationName: null,
    locationText: null,
    subRoll: null,
    goldFound: 0,
    itemsFound: [],
    notes: [],
    ...partial,
  }
}

let n = 0

export function report(partial: Partial<ReportView> = {}): ReportView {
  n += 1
  return {
    id: `report-${n}`,
    match_id: 'm1',
    warband_id: 'watch',
    warband_name: 'Reikland Watch',
    submitted_by: 'tom-user',
    submitted_by_display_name: 'Tom',
    submitted_at: '2026-09-04T21:00:00.000Z',
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

export function record(partial: Partial<BattleRecord> = {}): BattleRecord {
  n += 1
  return {
    match_id: `m${n}`,
    state: 'completed',
    created_via: 'gm',
    scenario_title: 'Skirmish',
    scheduled_for: '2026-09-04T18:00:00.000Z',
    started_at: '2026-09-04T19:00:00.000Z',
    completed_at: '2026-09-04T21:30:00.000Z',
    participants: [
      { warband_id: 'watch', warband_name: 'Reikland Watch', owner_display_name: 'Tom' },
      { warband_id: 'eshin', warband_name: 'Claws of Eshin', owner_display_name: 'Ana' },
    ],
    reports: [],
    ...partial,
  }
}
