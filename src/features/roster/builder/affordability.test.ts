import { describe, expect, it } from 'vitest'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { addDraftEquipment, addDraftGroup, equipmentOptionsFor, newWarbandDraft, type EquipmentOption, type WarbandDraft } from '../../../rules/resolve/builder'
import { canAffordAnother } from './affordability'

const REIKLAND = findWarbandTemplate('mercenaries_reikland')!
const CAPTAIN_OPTIONS = equipmentOptionsFor(REIKLAND, 'mercenaries_reikland_captain')
const WARRIOR_OPTIONS = equipmentOptionsFor(REIKLAND, 'mercenaries_reikland_warriors')

function option(options: EquipmentOption[], name: string): EquipmentOption {
  const found = options.find((o) => o.name === name)
  if (!found) throw new Error(`no option ${name}`)
  return found
}
const SWORD = option(CAPTAIN_OPTIONS, 'Sword') // 10 gc
const LIGHT_ARMOUR = option(CAPTAIN_OPTIONS, 'Light armour') // 20 gc
const SPEAR = option(WARRIOR_OPTIONS, 'Spear') // 10 gc a model
const captain = { kind: 'hero', id: 'captain' } as const
const warriors = { kind: 'group', id: 'warriors' } as const

/** A captain (60 gc hire) and whatever purse we choose to leave him. */
function withPurse(remaining: number): WarbandDraft {
  return { ...newWarbandDraft(REIKLAND, 'Test', 'captain'), startingGold: 60 + remaining }
}

describe('canAffordAnother (#41)', () => {
  it('allows the copy that fits and refuses the one that would tip the purse below zero', () => {
    const d = withPurse(15)
    expect(canAffordAnother(d, captain, SWORD, REIKLAND)).toBe(true)
    expect(canAffordAnother(d, captain, LIGHT_ARMOUR, REIKLAND)).toBe(false)
    const armed = addDraftEquipment(d, captain, SWORD)
    expect(canAffordAnother(armed, captain, SWORD, REIKLAND)).toBe(false)
  })

  it("prices a henchman group's line per model, the way the summary does", () => {
    // Warriors are 25 gc each to hire; 3 of them and 25 gc spare leaves room for one 10 gc spear, not three.
    const d = addDraftGroup({ ...withPurse(75 + 25) }, REIKLAND, 'mercenaries_reikland_warriors', 'warriors', 3, 'The Lads')
    expect(canAffordAnother(d, warriors, SPEAR, REIKLAND)).toBe(false)
    const two = addDraftGroup({ ...withPurse(50 + 25) }, REIKLAND, 'mercenaries_reikland_warriors', 'warriors', 2, 'The Pair')
    expect(canAffordAnother(two, warriors, SPEAR, REIKLAND)).toBe(true)
  })

  it('never blocks a line whose price is entered later', () => {
    const unpriced = CAPTAIN_OPTIONS.find((o) => o.cost.kind === 'multiplier' || o.cost.kind === 'unknown')
    if (!unpriced) return
    expect(canAffordAnother(withPurse(0), captain, unpriced, REIKLAND)).toBe(true)
  })
})
