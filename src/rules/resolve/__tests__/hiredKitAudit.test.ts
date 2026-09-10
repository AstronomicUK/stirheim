import { describe, expect, it } from 'vitest'
import { findHiredSword } from '../../data/campaign/hiredSwords'
import { findItem } from '../../data/items'
import { resolveEquipmentName } from '../../data/items/aliases'
import { HIRED_EQUIPMENT_CHOICES } from '../hiredEquipmentChoices'
import { hiredSwordEquipment, hiredSwordStartingEquipment } from '../recruitment'

const kit = (id: string) => hiredSwordEquipment(findHiredSword(id)!.detail)

describe('hired equipment source regressions (#61 / #74)', () => {
  it('resolves material weapons and printed equipment equivalents', () => {
    expect(resolveEquipmentName('Gromril Hammer')?.id).toBe('gromril_hammer')
    expect(resolveEquipmentName('Ninja Robe (counts as Hardened Leathers)')?.id).toBe('toughened_leathers')
    expect(kit('dwarf_treasure_hunter')).toContainEqual(expect.objectContaining({itemId: 'double_handed_weapon'}))
  })
  it('includes a second equipment sentence and keeps rope and hook together', () => {
    expect(kit('halfling_thief')).toContainEqual(expect.objectContaining({itemId: 'rope_and_hook', quantity: 1}))
    expect(kit('knight_of_the_white_wolf')).toContainEqual(expect.objectContaining({itemId: 'heavy_armour'}))
  })
  it('retains both weapons in a brace and preserves parenthetical special rules', () => {
    expect(kit('highwayman')).toContainEqual(expect.objectContaining({itemId: 'pistol', quantity: 2}))
    const names = kit('ninja_gnoblar').map(item => item.customName)
    expect(names).toContain('Bo (gives an additional attack, may parry and requires both hands)')
    expect(names).not.toContain('requires both hands)')
  })
  it('does not create equipment from a prohibition or opening narrative', () => {
    expect(kit('bone_goliath')).toEqual([])
    expect(kit('chaos_fury')).toEqual([])
    expect(kit('the_headless_horseman').some(item => item.customName?.startsWith('Head or no head'))).toBe(false)
    expect(kit('gaoler').some(item => item.customName === 'no armour')).toBe(false)
  })
  for (const [id, choices] of Object.entries(HIRED_EQUIPMENT_CHOICES)) {
    it(`stores every printed ${id} choice as usable equipment`, () => {
      for (const choice of choices) {
        const equipment = hiredSwordStartingEquipment(id, findHiredSword(id)!.detail, undefined, choice.id)
        expect(equipment).toEqual(choice.equipment)
        for (const item of equipment) if (item.itemId) expect(findItem(item.itemId), item.itemId).toBeDefined()
      }
      expect(() => hiredSwordStartingEquipment(id, findHiredSword(id)!.detail, undefined, 'invalid')).toThrow('Choose one')
    })
  }
  it('keeps the Ogre’s armour with either weapon choice', () => {
    expect(HIRED_EQUIPMENT_CHOICES.ogre_bodyguard).toHaveLength(7)
    for (const choice of HIRED_EQUIPMENT_CHOICES.ogre_bodyguard) expect(choice.equipment).toContainEqual({itemId: 'light_armour', quantity: 1})
  })
})
