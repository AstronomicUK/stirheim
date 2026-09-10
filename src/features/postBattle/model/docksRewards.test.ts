import { describe, it, expect } from 'vitest'
import { docksRewards, type DocksDraft } from './docksRewards'
const cargo = (dice: number[], rolls: DocksDraft['rolls'] = {}, extra: Partial<DocksDraft> = {}) => docksRewards({ role: 'raider', crates: 1, rolls: { '0:cargo': dice, ...rolls }, ...extra }, 2)
describe('Down at the Docks cargo', () => {
  it('uses actual participant count and keeps defensive payment separate', () => {
    expect(docksRewards({ role: 'defender', crates: 7 }, 3).gold).toBe(175)
    expect(docksRewards({ role: 'defender', crates: 7 }, 3).items).toEqual([])
    expect(docksRewards({ role: 'defender', crates: 7 }, 2).problems).not.toEqual([])
    expect(docksRewards({ role: 'raider', crates: 8 }, 2).problems).not.toEqual([])
    expect(docksRewards({ role: 'raider', crates: 0 }).problems).not.toEqual([])
  })
  it('requires all four table dice and both a medicine choice and its quantity', () => {
    expect(cargo([1, 1, 1]).problems).not.toEqual([])
    expect(cargo([1, 1, 2, 2]).problems).not.toEqual([])
    const herbs = cargo([1, 1, 2, 2], { '0:herbs': [5] }, { medicine: { 0: 'herbs' } })
    expect(herbs.problems).toEqual([])
    expect(herbs.items).toEqual([{ item_rules_id: 'healing_herbs', custom_name: null, quantity: 5 }])
    const chest = cargo([1, 1, 2, 2], { '0:herbs': [5] }, { medicine: { 0: 'chest' } })
    expect(chest.items).toEqual([{ item_rules_id: 'scenario_medicine_chest', custom_name: null, quantity: 1 }])
  })
  it('fences gems for 40 instead of awarding both money and gems, and always includes Tarot Cards', () => {
    const r = cargo([1, 1, 1, 1], {}, { gems: { 0: 'sell' } })
    expect(r.gold).toBe(40); expect(r.items).toHaveLength(1)
    expect(r.items[0].item_rules_id).not.toBeNull()
    const kept = cargo([1, 1, 1, 1], {}, { gems: { 0: 'keep' } })
    expect(kept.gold).toBe(0); expect(kept.items.some(i => i.item_rules_id === 'scenario_smuggled_gems')).toBe(true)
  })
  it('food grants its value, one garlic per member and only a successfully discovered drug', () => {
    const r = cargo([3, 3, 3, 3], { '0:food': [4], '0:drug-find': [6], '0:drug': [5] }, { garlicMembers: 8 })
    expect(r.gold).toBe(4); expect(r.problems).toEqual([])
    expect(r.items).toContainEqual({ item_rules_id: 'garlic', custom_name: null, quantity: 8 })
    expect(r.items).toContainEqual({ item_rules_id: 'crimson_shade', custom_name: null, quantity: 1 })
    expect(cargo([3, 3, 3, 3], { '0:food': [4], '0:drug-find': [2], '0:drug': [5] }, { garlicMembers: 8 }).items).toHaveLength(1)
  })
  it('keeps weapon quantities together and gives hunting bolts for each crossbow', () => {
    const weapons = cargo([2, 2, 2, 3], { '0:weapons': [3] })
    expect(weapons.items.map(i => i.quantity)).toEqual([3, 3])
    const bows = cargo([5, 5, 5, 6], { '0:crossbows': [2] })
    expect(bows.problems).toEqual([])
    expect(bows.items).toEqual([{ item_rules_id: 'crossbow', custom_name: null, quantity: 2 }, { item_rules_id: 'scenario_hunting_bolts', custom_name: null, quantity: 2 }])
  })
  it('resolves every cargo row to catalogue items', () => {
    for (let total = 4; total <= 24; total++) {
      let remaining = total - 4
      const dice = Array.from({ length: 4 }, () => { const extra = Math.min(5, remaining); remaining -= extra; return 1 + extra })
      let state: DocksDraft = { role: 'raider', crates: 1, rolls: { '0:cargo': dice }, medicine: { 0: 'herbs' }, gems: { 0: 'keep' }, garlicMembers: 4 }
      for (let pass = 0; pass < 3; pass++) {
        const r = docksRewards(state, 2)
        for (const p of r.prompts) if (!state.rolls?.[p.key]) state = { ...state, rolls: { ...state.rolls, [p.key]: Array(p.count).fill(p.sides) } }
      }
      const r = docksRewards(state, 2)
      expect(r.problems, String(total)).toEqual([])
      expect(r.items.filter(i => !i.item_rules_id), String(total)).toEqual([])
    }
  })
})
