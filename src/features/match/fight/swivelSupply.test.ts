import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState, battleLiveStateSchema, type ItemRow } from '../../../domain'
import { findItem } from '../../../rules/data/items'
import { itemPatchesFor, type ReportContext } from '../../postBattle/model/derive'
import { emptyDraft } from '../../postBattle/model/state'
import { correctSwivelSupply, swivelSupplyRow, useSwivelSupply } from './swivelSupply'

const row = (id: string, itemId = 'swivel_gun_ball_shot', quantity = 2): ItemRow => ({ id, warband_id: 'w', holder_type: 'stash', holder_id: null, item_rules_id: itemId, quantity, notes: '', custom_name: null, created_at: 't', updated_at: 't' })
const fire = (sheet: ReturnType<typeof emptyBattleLiveState>, items: ItemRow[], itemId = 'swivel_gun_ball_shot', exception = '') => useSwivelSupply(sheet, items, 'w', 'gunner', itemId, exception, crypto.randomUUID(), 't')
const patches = (sheet: ReturnType<typeof emptyBattleLiveState>, items: ItemRow[]) => itemPatchesFor({ items, matchId: 'm', warbandConsumables: sheet.warbandConsumables } as unknown as ReportContext, emptyDraft())

describe('Swivel Gun battle supplies (#69/#139)', () => {
  it('sells the three priced supplies without turning ammunition into a standalone weapon', () => {
    for (const [id, price] of [['swivel_gun_ball_shot', 5], ['swivel_gun_chain_shot', 2], ['swivel_gun_grape_shot', 2]] as const) {
      expect(findItem(id)?.price.base).toBe(price)
      expect(findItem(id)?.weaponId).toBeUndefined()
    }
  })
  it('deducts exactly one supply per used type, not per shot, and survives reload', () => {
    const items = [row('ball'), row('chain', 'swivel_gun_chain_shot'), row('unused', 'swivel_gun_grape_shot')]
    let sheet = fire(emptyBattleLiveState(), items)
    for (let i = 0; i < 5; i++) sheet = fire(battleLiveStateSchema.parse(sheet), items)
    sheet = fire(sheet, items, 'swivel_gun_chain_shot')
    expect(sheet.warbandConsumables).toHaveLength(2)
    expect(patches(sheet, items)).toEqual([{ id: 'ball', quantity: 1 }, { id: 'chain', quantity: 1 }])
    expect(patches(emptyBattleLiveState(), items)).toEqual([])
  })
  it('does not borrow enemy stock or another warrior’s kit; supports an explicit logged exception', () => {
    const items = [{ ...row('foreign'), warband_id: 'enemy' }, { ...row('other'), holder_type: 'hero' as const, holder_id: 'other' }, row('empty', 'swivel_gun_ball_shot', 0)]
    expect(swivelSupplyRow(items, 'w', 'gunner', 'swivel_gun_ball_shot')).toBeUndefined()
    expect(() => fire(emptyBattleLiveState(), items)).toThrow('Buy this ammunition')
    const sheet = fire(emptyBattleLiveState(), items, 'swivel_gun_ball_shot', 'Supply was purchased before this tracker existed')
    expect(sheet.warbandConsumables[0].itemRowId).toBeNull()
    expect(JSON.stringify(sheet)).toContain('Supply was purchased before this tracker existed')
    expect(patches(sheet, items)).toEqual([])
  })
  it('deducts the exact selected stock row and reverses an explained erroneous declaration', () => {
    const items = [{ ...row('kit'), holder_type: 'group' as const, holder_id: 'gunner' }, row('stash')]
    const sheet = fire(emptyBattleLiveState(), items)
    expect(patches(sheet, items)).toEqual([{ id: 'kit', quantity: 1 }])
    expect(correctSwivelSupply(sheet, 'swivel_gun_ball_shot', '')).toBe(sheet)
    const fixed = correctSwivelSupply(sheet, 'swivel_gun_ball_shot', 'Wrong ammunition type recorded')
    expect(patches(fixed, items)).toEqual([])
    expect(JSON.stringify(fixed)).toContain('Wrong ammunition type recorded')
  })
})
