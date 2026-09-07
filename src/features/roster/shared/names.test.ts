import { describe, expect, it } from 'vitest'
import { equipmentSummary, isBraceable, itemLineName, itemProfile, modelLabel } from './names'

describe('kit line names', () => {
  it('calls two pistols a brace and leaves everything else counted', () => {
    expect(isBraceable('pistol')).toBe(true)
    expect(isBraceable('duelling_pistol')).toBe(true)
    expect(isBraceable('sword')).toBe(false)
    expect(itemLineName({ itemId: 'pistol', quantity: 2 })).toEqual({ name: 'Brace of Pistols', count: 1 })
    expect(itemLineName({ itemId: 'pistol', quantity: 1 })).toEqual({ name: 'Pistol', count: 1 })
    expect(itemLineName({ itemId: 'pistol', quantity: 3 })).toEqual({ name: 'Pistol', count: 3 })
    expect(itemLineName({ itemId: 'dagger', quantity: 2 })).toEqual({ name: 'Dagger', count: 2 })
    expect(equipmentSummary([{ itemId: 'pistol', quantity: 2 }, { itemId: 'dagger', quantity: 2 }])).toBe('Brace of Pistols, Dagger ×2')
  })
})

describe('kit line profiles', () => {
  it('shows the save armour and a shield make together, on both lines', () => {
    const kit = [{ itemId: 'gromril_armour', quantity: 1 }, { itemId: 'shield', quantity: 1 }, { itemId: 'helmet', quantity: 1 }]
    expect(itemProfile(kit[0], kit)).toBe('4+ save · 3+ with shield')
    expect(itemProfile(kit[1], kit)).toBe('6+ save · 3+ with Gromril Armour')
    expect(itemProfile({ itemId: 'light_armour' }, [{ itemId: 'light_armour' }, { itemId: 'buckler' }])).toBe('6+ save')
    expect(itemProfile({ itemId: 'shield' }, [{ itemId: 'shield' }])).toBe('6+ save')
  })
})

describe('modelLabel', () => {
  it('gives a named slot its name, and an unnamed one "Model N"', () => {
    expect(modelLabel(['Alice', '', 'Carl'], 0)).toBe('Alice')
    expect(modelLabel(['Alice', '', 'Carl'], 1)).toBe('Model 2')
    expect(modelLabel(['Alice', '', 'Carl'], 2)).toBe('Carl')
    expect(modelLabel(undefined, 0)).toBe('Model 1')
    expect(modelLabel(['  '], 0)).toBe('Model 1')
    expect(modelLabel([], 4)).toBe('Model 5')
  })
})
