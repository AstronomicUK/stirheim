import { describe, expect, it } from 'vitest'
import type { ItemRow } from '../../../domain'
import { itemPatchesFor, type ReportContext } from './derive'
import { emptyDraft } from './state'

const row = (id: string, holder_id: string, item_rules_id: string, quantity: number): ItemRow =>
  ({ id, warband_id: 'w', holder_type: 'hero', holder_id, item_rules_id, custom_name: null, quantity, notes: '', created_at: '2026-09-12T00:00:00Z', updated_at: '2026-09-12T00:00:00Z' }) as ItemRow

function ctx(over: Partial<ReportContext>): ReportContext {
  return { items: [], matchId: 'm1', itemsUsed: {}, ...over } as unknown as ReportContext
}

describe('report item patches and the addiction ledger (#139/#140)', () => {
  it('does not use a second dose for a hero whose habit already took one at battle start', () => {
    const items = [row('shade', 'kurt', 'crimson_shade', 1), row('root', 'kurt', 'mandrake_root', 1)]
    const used = { kurt: ['crimson_shade', 'mandrake_root'] }
    // No ledger: both ticked consumables are used up by the report, as today.
    expect(itemPatchesFor(ctx({ items, itemsUsed: used }), emptyDraft()).map((p) => [p.id, p.quantity])).toEqual([['shade', 0], ['root', 0]])
    // Ledger says the Crimson Shade dose was consumed at start: only the Mandrake Root is patched.
    const supplied = ctx({ items, itemsUsed: used, addictionSupplies: [{ hero_id: 'kurt', item_rules_id: 'crimson_shade' }] })
    expect(itemPatchesFor(supplied, emptyDraft()).map((p) => [p.id, p.quantity])).toEqual([['root', 0]])
  })

  it('the exemption is per hero and per item: another addict who ticked his own copy still pays for it', () => {
    const items = [row('k', 'kurt', 'crimson_shade', 2), row('o', 'otto', 'crimson_shade', 1)]
    const supplied = ctx({ items, itemsUsed: { kurt: ['crimson_shade'], otto: ['crimson_shade'] }, addictionSupplies: [{ hero_id: 'kurt', item_rules_id: 'crimson_shade' }] })
    expect(itemPatchesFor(supplied, emptyDraft()).map((p) => [p.id, p.quantity])).toEqual([['o', 0]])
  })
})
