import { describe, expect, it } from 'vitest'
import type { ItemRow } from '../../../domain'
import { itemPatchesFor, type ReportContext } from './derive'
import { emptyDraft } from './state'

const row = (id: string, holder_type: 'hero' | 'stash', holder_id: string | null, item_rules_id: string, quantity: number): ItemRow =>
  ({ id, warband_id: 'w', holder_type, holder_id, item_rules_id, custom_name: null, quantity, notes: '', created_at: '2026-09-12T00:00:00Z', updated_at: '2026-09-12T00:00:00Z' }) as ItemRow

function ctx(over: Partial<ReportContext>): ReportContext {
  return { items: [], matchId: 'm1', itemsUsed: {}, ...over } as unknown as ReportContext
}
const declared = (itemRowId: string | null, holderKey: string, correction?: string) => ({ id: `d:${itemRowId}`, itemRulesId: 'bugmans_ale', itemRowId, holderKey, at: 't', ...(correction ? { correction } : {}) })
const patches = (c: ReportContext) => itemPatchesFor(c, emptyDraft()).map(p => [p.id, p.quantity])

describe("Bugman's Ale in the report (core, one barrel per battle)", () => {
  it('a declared stash barrel is deducted once from its exact row; the last barrel row goes', () => {
    const items = [row('barrel', 'stash', null, 'bugmans_ale', 1), row('sword', 'hero', 'cap', 'sword', 1)]
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables: [declared('barrel', 'stash')] }))).toEqual([['barrel', 0]])
  })
  it('two barrel rows under the same holder: only the declared row is touched', () => {
    const items = [row('old-barrel', 'stash', null, 'bugmans_ale', 2), row('new-barrel', 'stash', null, 'bugmans_ale', 1)]
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables: [declared('new-barrel', 'stash')] }))).toEqual([['new-barrel', 0]])
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables: [declared('old-barrel', 'stash')] }))).toEqual([['old-barrel', 1]])
  })
  it('the sheet tick and a legacy per-warrior tick never cost a second barrel once a barrel is declared', () => {
    const items = [row('barrel', 'stash', null, 'bugmans_ale', 1), row('cap-barrel', 'hero', 'cap', 'bugmans_ale', 1)]
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'], cap: ['bugmans_ale'] }, warbandConsumables: [declared('barrel', 'stash')] }))).toEqual([['barrel', 0]])
  })
  it('a corrected declaration deducts nothing, even if a stale tick lingers on the same holder', () => {
    const items = [row('barrel', 'stash', null, 'bugmans_ale', 1)]
    expect(patches(ctx({ items, itemsUsed: {}, warbandConsumables: [declared('barrel', 'stash', 'Did not drink')] }))).toEqual([])
    // Without a live declaration the legacy tick still settles as before (older sheets).
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables: [declared('barrel', 'stash', 'Did not drink')] }))).toEqual([['barrel', 0]])
  })
  it('a declared row that has since gone deducts no other barrel', () => {
    const items = [row('other-barrel', 'stash', null, 'bugmans_ale', 1)]
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables: [declared('sold-row', 'stash')] }))).toEqual([])
  })
  it('a carried barrel is deducted from its own row, not from a stash barrel', () => {
    const items = [row('stash-barrel', 'stash', null, 'bugmans_ale', 1), row('cap-barrel', 'hero', 'cap', 'bugmans_ale', 1)]
    expect(patches(ctx({ items, itemsUsed: { cap: ['bugmans_ale'] }, warbandConsumables: [declared('cap-barrel', 'cap')] }))).toEqual([['cap-barrel', 0]])
  })
  it('legacy sheets with only the old per-warrior tick still settle one barrel', () => {
    const items = [row('barrel', 'stash', null, 'bugmans_ale', 3)]
    expect(patches(ctx({ items, itemsUsed: { stash: ['bugmans_ale'] } }))).toEqual([['barrel', 2]])
  })

  it('stock changed after the declaration blocks filing until restored or withdrawn; intact stock files', async () => {
    const { makeHero, makeWarband } = await import('../../../rules/resolve/__tests__/fixtures')
    const { findWarbandTemplate } = await import('../../../rules/data/warbandTemplates')
    const { deriveReport } = await import('./derive')
    const base = (items: ItemRow[], warbandConsumables: ReportContext['warbandConsumables']): ReportContext => ({
      ...ctx({ items, itemsUsed: { stash: ['bugmans_ale'] }, warbandConsumables }),
      roster: makeWarband({ id: 'w', heroes: [makeHero({ id: 'cap' })] }), template: findWarbandTemplate('mercenaries_reikland'), matchId: 'match', myRating: 100, opponentRating: 100,
    } as ReportContext)
    const draft = { ...emptyDraft(), result: 'won' as const }
    const intact = deriveReport(draft, base([row('barrel', 'stash', null, 'bugmans_ale', 1)], [declared('barrel', 'stash')]))
    expect(intact.problems.review).toEqual([])
    const sold = deriveReport(draft, base([row('other', 'stash', null, 'bugmans_ale', 1)], [declared('barrel', 'stash')]))
    expect(sold.problems.review).toEqual([expect.stringContaining('Bugman’s Ale stock changed')])
    expect(sold.report).toBeNull()
    const withdrawn = deriveReport(draft, base([row('other', 'stash', null, 'bugmans_ale', 1)], [declared('barrel', 'stash', 'Did not drink')]))
    expect(withdrawn.problems.review).toEqual([])
  })
})
