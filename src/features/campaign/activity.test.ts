import { describe, expect, it } from 'vitest'
import type { CampaignActivity } from '../../api/campaigns'
import { activityLines, describeActivity, describeWarbandChanges, formatRelativeTime } from './activity'

const ANA = '11111111-1111-1111-1111-111111111111'
const TOM = '22222222-2222-2222-2222-222222222222'
const ESHIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

let nextId = 1

function entry(partial: Partial<CampaignActivity>): CampaignActivity {
  return {
    id: nextId++,
    at: '2026-09-04T10:00:00.000Z',
    actor_id: ANA,
    actor_display_name: 'Ana',
    table_name: 'warbands',
    action: 'update',
    reason: null,
    warband_id: ESHIN,
    warband_name: 'Claws of Eshin',
    before: null,
    after: null,
    ...partial,
  }
}

describe('describeActivity', () => {
  it('describes a warband being created', () => {
    const line = describeActivity(
      entry({ actor_id: TOM, actor_display_name: 'Tom', action: 'insert', reason: 'create_warband', warband_name: null, after: { id: 'x', name: 'Reikland Watch', gold: 500 } }),
    )
    expect(line).toBe('Tom created Reikland Watch')
  })

  it('describes a manual edit with the gold that moved', () => {
    const line = describeActivity(
      entry({
        reason: 'manual_edit',
        before: { id: ESHIN, name: 'Claws of Eshin', gold: 25, wyrdstone: 3, archived: false, notes: '' },
        after: { id: ESHIN, name: 'Claws of Eshin', gold: 30, wyrdstone: 3, archived: false, notes: '' },
      }),
    )
    expect(line).toBe('Ana edited Claws of Eshin by hand (gold 25 -> 30)')
  })

  it('lists several changed columns', () => {
    const changes = describeWarbandChanges(
      { gold: 10, wyrdstone: 0, name: 'Old', archived: false, notes: 'a' },
      { gold: 12, wyrdstone: 4, name: 'New', archived: true, notes: 'b' },
    )
    expect(changes).toEqual(['gold 10 -> 12', 'wyrdstone 0 -> 4', 'renamed from Old', 'archived', 'notes changed'])
  })

  it('describes joining a campaign', () => {
    const line = describeActivity(entry({ table_name: 'campaign_members', action: 'insert', after: { campaign_id: 'c', warband_id: ESHIN, user_id: ANA, left_at: null } }))
    expect(line).toBe('Ana joined with Claws of Eshin')
  })

  it('describes leaving when left_at is set by the owner', () => {
    const line = describeActivity(
      entry({
        table_name: 'campaign_members',
        action: 'update',
        reason: 'leave_campaign',
        before: { campaign_id: 'c', warband_id: ESHIN, user_id: ANA, left_at: null },
        after: { campaign_id: 'c', warband_id: ESHIN, user_id: ANA, left_at: '2026-09-04T10:00:00.000Z' },
      }),
    )
    expect(line).toBe('Ana left with Claws of Eshin')
  })

  it('describes the GM removing a member', () => {
    const line = describeActivity(
      entry({
        table_name: 'campaign_members',
        action: 'update',
        actor_id: TOM,
        actor_display_name: 'Tom',
        before: { campaign_id: 'c', warband_id: ESHIN, user_id: ANA, left_at: null },
        after: { campaign_id: 'c', warband_id: ESHIN, user_id: ANA, left_at: '2026-09-04T10:00:00.000Z' },
      }),
    )
    expect(line).toBe('Tom removed Claws of Eshin from the campaign')
  })

  it('describes campaign setting changes together', () => {
    const line = describeActivity(
      entry({
        table_name: 'campaigns',
        actor_id: TOM,
        actor_display_name: 'Tom',
        warband_id: null,
        warband_name: null,
        before: { name: 'Stirheim', archived: false, invite_code: 'a', settings: { startingGold: 500 }, rules_markdown: '' },
        after: { name: 'Stirheim', archived: true, invite_code: 'a', settings: { startingGold: 600 }, rules_markdown: '' },
      }),
    )
    expect(line).toBe('Tom archived the campaign and changed the campaign settings')
  })

  it('falls back to a generic line for tables it does not know', () => {
    expect(describeActivity(entry({ table_name: 'match_reports', action: 'insert' }))).toBe('Ana added a match report record for Claws of Eshin')
    expect(describeActivity(entry({ table_name: 'matches', action: 'update', actor_display_name: null, warband_id: null, warband_name: null }))).toBe(
      'Someone changed a match record',
    )
  })
})

describe('activityLines', () => {
  it('collapses the rows of one roster save into the warband line', () => {
    const at = '2026-09-04T10:00:00.000Z'
    const rows = [
      entry({ table_name: 'items', action: 'insert', reason: 'trading', at }),
      entry({ table_name: 'items', action: 'insert', reason: 'trading', at }),
      entry({ table_name: 'warbands', reason: 'trading', at, before: { name: 'Claws of Eshin', gold: 100 }, after: { name: 'Claws of Eshin', gold: 80 } }),
    ]
    const lines = activityLines(rows)
    expect(lines).toHaveLength(1)
    expect(lines[0].text).toBe('Ana visited the trading post with Claws of Eshin (gold 100 -> 80)')
    expect(lines[0].count).toBe(3)
  })

  it('drops the hero and item rows written while a warband is created', () => {
    const at = '2026-09-04T10:00:00.000Z'
    const rows = [
      entry({ table_name: 'items', action: 'insert', reason: 'create_warband', at }),
      entry({ table_name: 'heroes', action: 'insert', reason: 'create_warband', at }),
      entry({ table_name: 'warbands', action: 'insert', reason: 'create_warband', at, after: { name: 'Claws of Eshin' } }),
    ]
    expect(activityLines(rows).map((l) => l.text)).toEqual(['Ana created Claws of Eshin'])
  })

  it('keeps separate saves separate', () => {
    const rows = [
      entry({ reason: 'manual_edit', at: '2026-09-04T10:05:00.000Z', before: { name: 'Claws of Eshin', gold: 1 }, after: { name: 'Claws of Eshin', gold: 2 } }),
      entry({ reason: 'manual_edit', at: '2026-09-04T10:00:00.000Z', before: { name: 'Claws of Eshin', gold: 0 }, after: { name: 'Claws of Eshin', gold: 1 } }),
    ]
    expect(activityLines(rows)).toHaveLength(2)
  })
})

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-09-04T12:00:00.000Z')
  it('rounds to the nearest friendly unit', () => {
    expect(formatRelativeTime('2026-09-04T11:59:40.000Z', now)).toBe('just now')
    expect(formatRelativeTime('2026-09-04T11:55:00.000Z', now)).toBe('5 min ago')
    expect(formatRelativeTime('2026-09-04T09:00:00.000Z', now)).toBe('3 h ago')
    expect(formatRelativeTime('2026-09-03T12:00:00.000Z', now)).toBe('yesterday')
    expect(formatRelativeTime('2026-08-31T12:00:00.000Z', now)).toBe('4 days ago')
  })
  it('returns an empty string for junk', () => {
    expect(formatRelativeTime('not a date', now)).toBe('')
  })
})
