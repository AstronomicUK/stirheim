import { expect, it } from 'vitest'
import { makeHero, makeHenchmanGroup, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import type { ItemRow } from '../../../domain'
import { itemPatchesFor, type ReportContext } from './derive'
import { emptyDraft } from './state'
import { garlicExpiry } from './garlicExpiry'
const item = (id: string, holder_id: string | null, holder_type: ItemRow['holder_type'], quantity: number) => ({ id, holder_id, holder_type, item_rules_id: 'garlic', quantity }) as ItemRow

it('expires carried garlic without a used tick, preserving stash and warriors sitting out', () => {
  const roster = makeWarband({ heroes: [makeHero({ id: 'active' }), makeHero({ id: 'absent', flags: { missNextGames: 1 } })], henchmenGroups: [makeHenchmanGroup({ id: 'group', size: 3 })] })
  const ctx: ReportContext = { template: undefined, matchId: 'match', myRating: 0, opponentRating: 0, roster, items: [item('a', 'active', 'hero', 1), item('b', 'absent', 'hero', 1), item('c', 'group', 'group', 3), item('s', null, 'stash', 2)] }
  expect(itemPatchesFor(ctx, emptyDraft())).toEqual([{ id: 'a', quantity: 0 }, { id: 'c', quantity: 0 }])
  expect(itemPatchesFor({ ...ctx, itemsUsed: { active: ['garlic'] } }, emptyDraft())).toEqual(itemPatchesFor(ctx, emptyDraft()))
  expect(garlicExpiry({ ...ctx, preBattle: { 'oldWound:active': 'flares up' } }, emptyDraft()).map(row => row.id)).toEqual(['c'])
  expect(garlicExpiry({ ...ctx, scenarioId: 'the_sword_of_the_herald' }, { ...emptyDraft(), scenarioNonCampaign: true })).toEqual([])
})

it('preserves absent group members’ garlic and requires an explicit allocation for uneven stacks', () => {
  const roster = makeWarband({ heroes: [], henchmenGroups: [makeHenchmanGroup({ id: 'group', size: 3, campaignState: { raidAbsences: [{ count: 1, games: 1 }] } })] })
  const ctx: ReportContext = { template: undefined, matchId: 'match', myRating: 0, opponentRating: 0, roster, items: [item('g', 'group', 'group', 3)] }
  expect(itemPatchesFor(ctx, emptyDraft())).toEqual([{ id: 'g', quantity: 1 }])
  const uneven = { ...ctx, items: [item('g', 'group', 'group', 2)] }
  const [row] = garlicExpiry(uneven, emptyDraft())
  expect(row).toMatchObject({ uncertain: true, valid: false, count: null })
  expect(itemPatchesFor(uneven, { ...emptyDraft(), garlicCarried: { [row.key]: 1 } })).toEqual([{ id: 'g', quantity: 1 }])
  expect(garlicExpiry(uneven, { ...emptyDraft(), garlicCarried: { [row.key]: 3 } })[0].valid).toBe(false)
})
