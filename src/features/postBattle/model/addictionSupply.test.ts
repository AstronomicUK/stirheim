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
  it('consumes the recorded number of single-use Herbs doses, ignoring reusable and corrected uses', () => {
    const use = { id: 'use', warriorId: 'kurt', itemRowId: 'herbs', at: 'now', singleUse: true, woundsRestored: 1, manualWounds: 1, healedEventIds: [] }
    const items = [row('herbs', 'kurt', 'healing_herbs', 2)]
    const context = ctx({ items, itemsUsed: { kurt: ['healing_herbs'] }, healingHerbUses: [use, { ...use, id: 'second' }, { ...use, id: 'reusable', singleUse: false }, { ...use, id: 'corrected', correction: 'Mistake' }] })
    expect(itemPatchesFor(context, emptyDraft())).toEqual([{ id: 'herbs', quantity: 0 }])
    expect(itemPatchesFor({ ...context, healingHerbUses: [{ ...use, singleUse: false }] }, emptyDraft())).toEqual([])
  })
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


describe('Blessed Water report consumption', () => {
  const use = { id: 'one', warriorId: 'kurt', warriorName: 'Kurt', itemRowId: 'water', at: 'now', turn: 2 }
  it('deducts the exact number of throws from a stack once, regardless of an old checkbox', () => {
    const context = ctx({ items: [row('water', 'kurt', 'blessed_water', 3)], itemsUsed: { kurt: ['blessed_water'] }, blessedWaterUses: [use, { ...use, id: 'two' }, { ...use, id: 'corrected', correction: 'Wrong model' }] })
    expect(itemPatchesFor(context, emptyDraft())).toEqual([{ id: 'water', quantity: 1 }])
    expect(itemPatchesFor({ ...context, blessedWaterUses: [{ ...use, correction: 'Wrong model' }] }, emptyDraft())).toEqual([])
  })
  it('tracks separate physical rows and a last copy without spending unrelated stock', () => {
    const context = ctx({ items: [row('water', 'kurt', 'blessed_water', 1), row('other', 'kurt', 'blessed_water', 2)], blessedWaterUses: [use] })
    expect(itemPatchesFor(context, emptyDraft())).toEqual([{ id: 'water', quantity: 0 }])
  })
  it('keeps a legacy tick working when no explicit throws exist', () => {
    expect(itemPatchesFor(ctx({ items: [row('water', 'kurt', 'blessed_water', 1)], itemsUsed: { kurt: ['blessed_water'] } }), emptyDraft())).toEqual([{ id: 'water', quantity: 0 }])
  })
})
