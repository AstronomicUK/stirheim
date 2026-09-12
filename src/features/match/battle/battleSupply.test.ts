import { describe, expect, it } from 'vitest'
import type { RosterHero, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { BATTLE_SUPPLY_NOTE, withBattleSupplies } from './battleSupply'
import { loadoutOf } from '../fight/combatants'

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const hero = (id: string, equipment: RosterItem[] = []): RosterHero => ({ id, name: id, unitTemplateId: 'captain', stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: { addictedTo: ['crimson_shade'] }, equipment, status: 'active' })
const roster = (heroes: RosterHero[]): RosterWarband => ({ id: 'w', name: 'W', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, heroes, hiredSwords: [], henchmenGroups: [], stash: [] })
const supply = (hero_id: string) => ({ hero_id, item_rules_id: 'crimson_shade', source: 'kit' as const })

describe('battle roster carries the dose the habit used up at battle start (#139/#140)', () => {
  it('lays the last-copy dose back over the battle roster so "Took Crimson Shade" is still offered', () => {
    // start_match took his only copy: the stock row now reads 0.
    const before = roster([hero('kurt', [{ itemId: 'crimson_shade', quantity: 0 }, { itemId: 'sword', quantity: 1 }])])
    const after = withBattleSupplies(before, [supply('kurt')])
    const kurt = after.heroes[0]
    expect(kurt.equipment).toContainEqual({ itemId: 'crimson_shade', quantity: 1, notes: BATTLE_SUPPLY_NOTE })
    expect(loadoutOf(kurt.equipment).consumables.map((c) => c.itemId)).toEqual(['crimson_shade'])
    // Stock itself is untouched: the original roster object is not mutated.
    expect(before.heroes[0].equipment.find((i) => i.itemId === 'crimson_shade')?.quantity).toBe(0)
  })

  it('adds nothing when the hero still holds a copy, for other heroes, or with an empty ledger', () => {
    const r = roster([hero('kurt', [{ itemId: 'crimson_shade', quantity: 1 }]), hero('otto')])
    expect(withBattleSupplies(r, [supply('kurt')])).toBe(r)
    expect(withBattleSupplies(r, [supply('nobody')])).toBe(r)
    expect(withBattleSupplies(r, [])).toBe(r)
    const withOtto = withBattleSupplies(r, [supply('otto')])
    expect(withOtto.heroes[0]).toBe(r.heroes[0])
    expect(withOtto.heroes[1].equipment).toEqual([{ itemId: 'crimson_shade', quantity: 1, notes: BATTLE_SUPPLY_NOTE }])
  })
})
